/**
 * AudioWaveform
 * ─────────────
 * SVG waveform visualisation rendered inside an audio/voiceover/BGM clip.
 * When the real audio URL is accessible via the same origin we decode it
 * through the Web Audio API; otherwise we fall back to a seeded
 * pseudo-random waveform so the UI always has something to display.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  clipId: string;
  audioSrc?: string;
  width: number;
  height: number;
  color?: string;
}

// ── Seeded pseudo-random (mulberry32) ────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function buildSeededWaveform(clipId: string, barCount: number): number[] {
  const rand = mulberry32(hashStr(clipId));
  const raw: number[] = Array.from({ length: barCount }, () => rand());
  // Smooth with simple moving average (3-window)
  return raw.map((v, i) => {
    const a = raw[Math.max(0, i - 1)];
    const b = v;
    const c = raw[Math.min(raw.length - 1, i + 1)];
    return (a + b + c) / 3;
  });
}

// ── Component ────────────────────────────────────────────────────────────

export function AudioWaveform({ clipId, audioSrc, width, height, color = '#10b981' }: Props) {
  const [bars, setBars] = useState<number[]>([]);
  const decodedRef = useRef(false);

  const BAR_WIDTH = 2;
  const BAR_GAP   = 1;
  const barCount  = Math.max(1, Math.floor(width / (BAR_WIDTH + BAR_GAP)));

  // Seeded fallback (always computed, shown until real decode completes)
  const fallback = useMemo(() => buildSeededWaveform(clipId, barCount), [clipId, barCount]);

  useEffect(() => {
    setBars([]); // reset when clip changes
    decodedRef.current = false;

    if (!audioSrc || !window.AudioContext) return;

    const ctx = new window.AudioContext();
    let alive = true;

    fetch(audioSrc, { mode: 'cors' })
      .then(r => r.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => {
        if (!alive) return;
        const channelData = decoded.getChannelData(0); // use left channel
        const blockSize = Math.floor(channelData.length / barCount);
        const peaks: number[] = Array.from({ length: barCount }, (_, i) => {
          let max = 0;
          for (let j = 0; j < blockSize; j++) {
            max = Math.max(max, Math.abs(channelData[i * blockSize + j] ?? 0));
          }
          return max;
        });
        decodedRef.current = true;
        setBars(peaks);
      })
      .catch(() => { /* CORS / decode failure → use seeded fallback */ });

    return () => { alive = false; ctx.close(); };
  }, [audioSrc, barCount]);

  const displayBars = bars.length === barCount ? bars : fallback;

  if (width < 4 || height < 4) return null;

  const midY = height / 2;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 }}
    >
      {displayBars.map((amp, i) => {
        const x = i * (BAR_WIDTH + BAR_GAP) + 1;
        const barH = Math.max(2, amp * (height - 4));
        return (
          <rect
            key={i}
            x={x}
            y={midY - barH / 2}
            width={BAR_WIDTH}
            height={barH}
            fill={color}
            rx={1}
          />
        );
      })}
    </svg>
  );
}
