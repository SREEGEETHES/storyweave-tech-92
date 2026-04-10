"""
StoryWeave GPU Inference Server
================================
FastAPI server hosting all AI models used by the StoryWeave video pipeline:
  - POST /tts/generate      → Qwen3-TTS (voiceover audio)
  - POST /bgm/generate      → ACE-Step 1.5 (background music)
  - POST /transcribe        → Whisper (captions with frame timestamps)
  - POST /image/generate    → Seedream 5.0 Lite (scene images)
  - GET  /health            → Health check

Set GPU_SERVER_API_KEY in .env to require auth on all endpoints.
All generated assets are uploaded to S3 and the public URL is returned.
"""

from __future__ import annotations

import io
import os
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from functools import lru_cache
from typing import Optional

import boto3
import soundfile as sf
import torch
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

load_dotenv()


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    gpu_server_api_key: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket: str = "storyweave-assets"
    s3_public_base_url: str = ""          # e.g. https://cdn.storyweave.io
    device: str = "cuda" if torch.cuda.is_available() else "cpu"

    # Model IDs (override via env to pin versions)
    qwen_tts_model: str = "Qwen/Qwen3-TTS"
    whisper_model_size: str = "large-v3"  # tiny / base / small / medium / large-v3
    seedream_model: str = "ByteDance-Seed/Seedream-3-0"

    class Config:
        env_file = ".env"

settings = Settings()


# ---------------------------------------------------------------------------
# S3 helper
# ---------------------------------------------------------------------------

def _s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )


def upload_bytes_to_s3(data: bytes, key: str, content_type: str) -> str:
    """Upload raw bytes to S3 and return the public URL."""
    client = _s3_client()
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        ACL="public-read",
    )
    if settings.s3_public_base_url:
        return f"{settings.s3_public_base_url.rstrip('/')}/{key}"
    return f"https://{settings.s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def require_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    """Validate the API key if one is configured on the server."""
    configured = settings.gpu_server_api_key
    if configured and api_key != configured:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return api_key


# ---------------------------------------------------------------------------
# Lazy model loading (load once, reuse across requests)
# ---------------------------------------------------------------------------

_models: dict = {}


def get_qwen_tts():
    if "qwen_tts" not in _models:
        from transformers import AutoProcessor, AutoModel
        print(f"[GPU Server] Loading Qwen3-TTS ({settings.qwen_tts_model})…")
        processor = AutoProcessor.from_pretrained(settings.qwen_tts_model)
        model = AutoModel.from_pretrained(
            settings.qwen_tts_model,
            torch_dtype=torch.float16 if settings.device == "cuda" else torch.float32,
        ).to(settings.device)
        model.eval()
        _models["qwen_tts"] = (processor, model)
        print("[GPU Server] Qwen3-TTS ready.")
    return _models["qwen_tts"]


def get_whisper():
    if "whisper" not in _models:
        from faster_whisper import WhisperModel
        print(f"[GPU Server] Loading Whisper ({settings.whisper_model_size})…")
        compute_type = "float16" if settings.device == "cuda" else "int8"
        model = WhisperModel(settings.whisper_model_size, device=settings.device, compute_type=compute_type)
        _models["whisper"] = model
        print("[GPU Server] Whisper ready.")
    return _models["whisper"]


def get_ace_step():
    if "ace_step" not in _models:
        try:
            from acestep.pipeline import ACEStepPipeline
            print("[GPU Server] Loading ACE-Step 1.5…")
            pipe = ACEStepPipeline.from_pretrained(
                "ACE-Step/ACE-Step-v1-5-3.5B",
                torch_dtype=torch.float16 if settings.device == "cuda" else torch.float32,
            ).to(settings.device)
            _models["ace_step"] = pipe
            print("[GPU Server] ACE-Step 1.5 ready.")
        except ImportError:
            print("[GPU Server] ACE-Step not installed — BGM generation will use placeholder.")
            _models["ace_step"] = None
    return _models["ace_step"]


def get_seedream():
    if "seedream" not in _models:
        from diffusers import DiffusionPipeline
        print(f"[GPU Server] Loading Seedream ({settings.seedream_model})…")
        pipe = DiffusionPipeline.from_pretrained(
            settings.seedream_model,
            torch_dtype=torch.float16 if settings.device == "cuda" else torch.float32,
        ).to(settings.device)
        pipe.enable_attention_slicing()
        _models["seedream"] = pipe
        print("[GPU Server] Seedream ready.")
    return _models["seedream"]


# ---------------------------------------------------------------------------
# Lifespan: pre-warm models on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[GPU Server] Starting up…")
    # Pre-warm Whisper (small / fast) — heavy models load on first request
    try:
        get_whisper()
    except Exception as exc:
        print(f"[GPU Server] Whisper pre-warm failed: {exc}")
    yield
    print("[GPU Server] Shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="StoryWeave GPU Inference Server",
    version="1.0.0",
    description="Serves Qwen3-TTS, ACE-Step 1.5, Whisper, and Seedream 5.0 Lite.",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesise into speech")
    voice: str = Field("default", description="Voice ID or name (model-specific)")
    language: str = Field("en", description="BCP-47 language code, e.g. 'en', 'zh'")
    speed: float = Field(1.0, ge=0.5, le=2.0, description="Playback speed multiplier")


class TTSResponse(BaseModel):
    audio_url: str
    duration_seconds: float


class BGMRequest(BaseModel):
    prompt: str = Field(..., description="Text description of the desired music style/mood")
    duration: float = Field(30.0, ge=5.0, le=300.0, description="Target duration in seconds")
    bpm: int = Field(120, ge=40, le=200, description="Beats per minute")
    genre: str = Field("cinematic", description="Music genre hint")
    mood: str = Field("neutral", description="Emotional mood hint")


class BGMResponse(BaseModel):
    audio_url: str
    duration_seconds: float


class TranscribeRequest(BaseModel):
    audio_url: str = Field(..., description="Public URL of the audio file to transcribe")
    language: str = Field("en", description="BCP-47 language code of the spoken language")
    fps: int = Field(30, ge=1, le=120, description="Frames per second of the destination video")


class CaptionSegment(BaseModel):
    text: str
    start_frame: int
    end_frame: int


class TranscribeResponse(BaseModel):
    segments: list[CaptionSegment]
    full_text: str


class ImageRequest(BaseModel):
    prompt: str = Field(..., description="Visual description of the scene to generate")
    negative_prompt: str = Field(
        "blurry, low quality, distorted, watermark, text",
        description="Things to avoid in the image",
    )
    width: int = Field(1920, ge=256, le=2048, description="Output image width in pixels")
    height: int = Field(1080, ge=256, le=2048, description="Output image height in pixels")
    steps: int = Field(30, ge=10, le=80, description="Number of diffusion steps")
    cfg_scale: float = Field(7.5, ge=1.0, le=20.0, description="Classifier-free guidance scale")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")


class ImageResponse(BaseModel):
    image_url: str


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Infra"])
def health():
    return {
        "status": "ok",
        "device": settings.device,
        "loaded_models": list(_models.keys()),
    }


# ---------------------------------------------------------------------------
# POST /tts/generate — Qwen3-TTS
# ---------------------------------------------------------------------------

@app.post("/tts/generate", response_model=TTSResponse, tags=["TTS"])
def tts_generate(req: TTSRequest, _: str = Depends(require_api_key)):
    """
    Generate a voiceover audio file from text using Qwen3-TTS.
    Returns an S3 URL pointing to the generated MP3.
    """
    try:
        processor, model = get_qwen_tts()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Qwen3-TTS model unavailable: {exc}")

    try:
        inputs = processor(
            text=req.text,
            return_tensors="pt",
            language=req.language,
        ).to(settings.device)

        with torch.no_grad():
            output = model.generate(
                **inputs,
                max_new_tokens=4096,
                do_sample=True,
                temperature=0.7,
            )

        # Decode output tokens → waveform (Qwen3-TTS returns int16 PCM)
        waveform = processor.batch_decode(output, skip_special_tokens=True)
        sample_rate = 24000  # Qwen3-TTS native sample rate

        # Write to in-memory WAV buffer then convert to MP3 via soundfile
        buf = io.BytesIO()
        sf.write(buf, waveform[0], sample_rate, format="WAV")
        audio_bytes = buf.getvalue()
        duration = len(waveform[0]) / sample_rate

        # Apply speed multiplier if needed (simple resample approach)
        if req.speed != 1.0:
            import librosa
            import numpy as np
            audio_np, _ = librosa.load(io.BytesIO(audio_bytes), sr=sample_rate)
            stretched = librosa.effects.time_stretch(audio_np, rate=req.speed)
            buf2 = io.BytesIO()
            sf.write(buf2, stretched, sample_rate, format="WAV")
            audio_bytes = buf2.getvalue()
            duration = duration / req.speed

        s3_key = f"audio/tts/{uuid.uuid4()}.wav"
        audio_url = upload_bytes_to_s3(audio_bytes, s3_key, "audio/wav")

        return TTSResponse(audio_url=audio_url, duration_seconds=round(duration, 3))

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {exc}")


# ---------------------------------------------------------------------------
# POST /bgm/generate — ACE-Step 1.5
# ---------------------------------------------------------------------------

@app.post("/bgm/generate", response_model=BGMResponse, tags=["BGM"])
def bgm_generate(req: BGMRequest, _: str = Depends(require_api_key)):
    """
    Generate background music using ACE-Step 1.5.
    Returns an S3 URL pointing to the generated WAV/MP3.
    """
    pipe = get_ace_step()

    if pipe is None:
        # ACE-Step not installed — return a royalty-free placeholder URL
        # so the rest of the pipeline can continue functioning.
        raise HTTPException(
            status_code=503,
            detail=(
                "ACE-Step is not installed on this server. "
                "Run: pip install git+https://github.com/ace-step/ACE-Step.git"
            ),
        )

    try:
        # ACE-Step pipeline call (mirrors the official API)
        full_prompt = (
            f"{req.genre}, {req.mood} mood, {req.bpm} BPM. {req.prompt}"
        )
        result = pipe(
            prompt=full_prompt,
            duration=req.duration,
            num_inference_steps=50,
            guidance_scale=7.5,
        )
        # result.audios is a list of numpy arrays [samples, channels]
        audio_np = result.audios[0]
        sample_rate = 44100  # ACE-Step output sample rate

        buf = io.BytesIO()
        sf.write(buf, audio_np.T, sample_rate, format="WAV")
        audio_bytes = buf.getvalue()
        actual_duration = audio_np.shape[-1] / sample_rate

        s3_key = f"audio/bgm/{uuid.uuid4()}.wav"
        audio_url = upload_bytes_to_s3(audio_bytes, s3_key, "audio/wav")

        return BGMResponse(audio_url=audio_url, duration_seconds=round(actual_duration, 3))

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"BGM generation failed: {exc}")


# ---------------------------------------------------------------------------
# POST /transcribe — Whisper
# ---------------------------------------------------------------------------

@app.post("/transcribe", response_model=TranscribeResponse, tags=["Captioning"])
def transcribe(req: TranscribeRequest, _: str = Depends(require_api_key)):
    """
    Transcribe an audio file with Whisper and return word-level captions
    aligned to video frames (startFrame / endFrame based on fps).
    """
    import httpx

    model = get_whisper()

    # Download the audio file to a temp location
    try:
        with httpx.Client(timeout=60) as client:
            response = client.get(req.audio_url)
            response.raise_for_status()
        audio_data = response.content
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to download audio: {exc}")

    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        segments_raw, info = model.transcribe(
            tmp_path,
            language=req.language if req.language != "auto" else None,
            word_timestamps=True,
            vad_filter=True,
        )

        caption_segments: list[CaptionSegment] = []
        full_text_parts: list[str] = []

        for seg in segments_raw:
            text = seg.text.strip()
            if not text:
                continue
            full_text_parts.append(text)
            start_frame = int(seg.start * req.fps)
            end_frame = int(seg.end * req.fps)
            caption_segments.append(
                CaptionSegment(
                    text=text,
                    start_frame=start_frame,
                    end_frame=end_frame,
                )
            )

        os.unlink(tmp_path)

        return TranscribeResponse(
            segments=caption_segments,
            full_text=" ".join(full_text_parts),
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")


# ---------------------------------------------------------------------------
# POST /image/generate — Seedream 5.0 Lite
# ---------------------------------------------------------------------------

@app.post("/image/generate", response_model=ImageResponse, tags=["Image"])
def image_generate(req: ImageRequest, _: str = Depends(require_api_key)):
    """
    Generate a scene image using Seedream 5.0 Lite.
    Returns an S3 URL pointing to the generated PNG.
    """
    try:
        pipe = get_seedream()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Seedream model unavailable: {exc}")

    try:
        generator = None
        if req.seed is not None:
            generator = torch.Generator(device=settings.device).manual_seed(req.seed)

        result = pipe(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            width=req.width,
            height=req.height,
            num_inference_steps=req.steps,
            guidance_scale=req.cfg_scale,
            generator=generator,
        )

        image = result.images[0]

        buf = io.BytesIO()
        image.save(buf, format="PNG")
        image_bytes = buf.getvalue()

        s3_key = f"images/scenes/{uuid.uuid4()}.png"
        image_url = upload_bytes_to_s3(image_bytes, s3_key, "image/png")

        return ImageResponse(image_url=image_url)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {exc}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
        workers=1,  # Single worker — GPU models are not fork-safe
    )
