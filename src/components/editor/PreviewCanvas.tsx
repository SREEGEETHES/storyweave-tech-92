/**
 * PreviewCanvas
 * ─────────────
 * Real-time video preview panel.
 *
 * Shows the scene image + caption overlay for the current playhead frame,
 * with full transport controls. Uses a canvas-based approach so no
 * additional Remotion dependencies are needed on the frontend — actual
 * render goes through Remotion Lambda on the backend.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Play, Pause, Square, SkipBack, SkipForward,
  Volume2, VolumeX, Maximize2,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useEditor } from '@/contexts/EditorContext';
import { useVideoState } from '@/contexts/VideoStateContext';

export function PreviewCanvas() {
  const { playheadFrame, fps, totalDurationInFrames, isPlaying, togglePlayback, stop, setPlayheadFrame } = useEditor();
  const { videoState } = useVideoState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef  = useRef<HTMLAudioElement>(null);
  const imgCache  = useRef<Map<string, HTMLImageElement>>(new Map());
  const [volume, setVolume] = React.useState(0.8);
  const [muted, setMuted]   = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Find active scene for current frame ──────────────────────────────
  const activeScene = videoState?.scenes.find(
    s => playheadFrame >= s.startFrame && playheadFrame < s.startFrame + s.durationInFrames
  ) ?? videoState?.scenes[0];

  // ── Find active captions for current frame ───────────────────────────
  const activeCaptions = (videoState?.captions ?? []).filter(
    c => playheadFrame >= c.startFrame && playheadFrame <= c.endFrame
  );

  // ── Draw to canvas ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = videoState?.global.backgroundColor ?? '#000';
    ctx.fillRect(0, 0, W, H);

    if (!activeScene?.visualUrl) {
      // No scene: just render a dark placeholder
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3f3f46';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No scene at this frame', W / 2, H / 2);
    } else {
      const src = activeScene.visualUrl;
      if (!imgCache.current.has(src)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { imgCache.current.set(src, img); };
        img.src = src;
      }
      const img = imgCache.current.get(src);
      if (img?.complete && img.naturalWidth > 0) {
        // Ken Burns: slow zoom
        let scale = 1;
        if (activeScene.kenBurnsEffect) {
          const progress = (playheadFrame - activeScene.startFrame) / activeScene.durationInFrames;
          scale = 1 + progress * 0.08;
        }
        const sw = W * scale;
        const sh = H * scale;
        ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
      } else {
        ctx.fillStyle = '#1c1c2e';
        ctx.fillRect(0, 0, W, H);
      }
    }

    // ── Captions overlay ───────────────────────────────────────────────
    activeCaptions.forEach(cap => {
      const text = cap.text;
      const fontSize = Math.round(H * 0.055);
      ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(text).width;
      const padX = 16, padY = 10;
      const bx = (W - textWidth) / 2 - padX;
      const by = H - fontSize - 48 - padY;
      // Semi-transparent background
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.roundRect?.(bx, by, textWidth + padX * 2, fontSize + padY * 2, 6);
      ctx.fill();
      // Text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, W / 2, H - 48);
    });
  }, [playheadFrame, activeScene, activeCaptions, videoState]);

  // ── Sync audio ────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !videoState?.audio.voiceoverUrl) return;
    if (isPlaying) {
      audio.currentTime = playheadFrame / fps;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = playheadFrame / fps;
    }
  }, [isPlaying, fps]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const formatTime = (frame: number) => {
    const secs = frame / fps;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const f = frame % fps;
    return `${m}:${s.toString().padStart(2, '0')}.${f.toString().padStart(2, '0')}`;
  };

  const progress = totalDurationInFrames > 0 ? (playheadFrame / totalDurationInFrames) * 100 : 0;

  const handleScrub = useCallback((val: number[]) => {
    setPlayheadFrame(Math.round((val[0] / 100) * totalDurationInFrames));
  }, [setPlayheadFrame, totalDurationInFrames]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-zinc-950">
      {/* Canvas area */}
      <div className="flex-1 relative flex items-center justify-center bg-black min-h-0">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="max-w-full max-h-full object-contain"
          style={{ display: 'block' }}
        />
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors"
        >
          <Maximize2 size={14} />
        </button>
        {/* Frame counter */}
        <div className="absolute bottom-2 right-2 text-xs text-zinc-600 font-mono">
          {playheadFrame}/{totalDurationInFrames}
        </div>
      </div>

      {/* Hidden audio element */}
      {videoState?.audio.voiceoverUrl && (
        <audio ref={audioRef} src={videoState.audio.voiceoverUrl} preload="auto" />
      )}

      {/* Transport controls */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 space-y-2 bg-zinc-900 border-t border-zinc-800">
        {/* Scrubber */}
        <Slider
          value={[progress]}
          onValueChange={handleScrub}
          min={0}
          max={100}
          step={0.01}
          className="w-full"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500">
            {formatTime(playheadFrame)}
          </span>

          <div className="flex items-center gap-1">
            {/* Skip back */}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPlayheadFrame(0)}>
              <SkipBack size={13} />
            </Button>
            {/* Play/Pause */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={togglePlayback}>
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </Button>
            {/* Stop */}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={stop}>
              <Square size={12} />
            </Button>
            {/* Skip forward */}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
              onClick={() => setPlayheadFrame(totalDurationInFrames)}>
              <SkipForward size={13} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(v => !v)} className="text-zinc-500 hover:text-white">
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <Slider
              value={[muted ? 0 : volume * 100]}
              onValueChange={([v]) => { setVolume(v / 100); setMuted(false); }}
              min={0} max={100} step={1}
              className="w-20"
            />
          </div>

          <span className="text-xs font-mono text-zinc-500">
            {formatTime(totalDurationInFrames)}
          </span>
        </div>
      </div>
    </div>
  );
}
