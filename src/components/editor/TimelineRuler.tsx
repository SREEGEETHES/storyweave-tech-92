/**
 * TimelineRuler
 * ─────────────
 * Horizontal ruler above the tracks showing time marks and the playhead.
 * Clicking the ruler moves the playhead.
 */
import React, { useCallback, useRef } from 'react';
import { useEditor } from '@/contexts/EditorContext';

interface Props {
  /** Width of the left track-label gutter (px) */
  gutterWidth: number;
}

const RULER_HEIGHT = 28;

export function TimelineRuler({ gutterWidth }: Props) {
  const { zoomLevel, scrollX, fps, totalDurationInFrames, setPlayheadFrame, playheadFrame } = useEditor();
  const railRef = useRef<HTMLDivElement>(null);

  // Choose tick density so ticks are at least 40px apart
  const framesPerTick = Math.max(1, Math.ceil(40 / zoomLevel));
  // Round to nice intervals: 1 5 10 15 30 60 90 150 300 ...
  const niceIntervals = [1, 5, 10, 15, 30, 60, 90, 150, 300, 600, 900, 1800];
  const fpt = niceIntervals.find(n => n * zoomLevel >= 40) ?? 1800;

  const totalWidth = totalDurationInFrames * zoomLevel;

  const formatFrame = (frame: number): string => {
    const totalSecs = frame / fps;
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    const f = frame % fps;
    if (m === 0 && s === 0) return `0:00`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!railRef.current) return;
    const rect = railRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollX;
    const frame = Math.round(x / zoomLevel);
    setPlayheadFrame(Math.max(0, Math.min(frame, totalDurationInFrames)));
  }, [scrollX, zoomLevel, setPlayheadFrame, totalDurationInFrames]);

  const ticks: number[] = [];
  for (let f = 0; f <= totalDurationInFrames + fpt; f += fpt) {
    ticks.push(f);
  }

  const playheadX = playheadFrame * zoomLevel - scrollX;

  return (
    <div
      style={{ height: RULER_HEIGHT, position: 'relative', overflow: 'hidden', userSelect: 'none' }}
      className="bg-zinc-900 border-b border-zinc-700 flex"
    >
      {/* Gutter spacer */}
      <div style={{ width: gutterWidth, flexShrink: 0 }} className="border-r border-zinc-700" />

      {/* Rail */}
      <div
        ref={railRef}
        className="relative flex-1 cursor-col-resize"
        onClick={handleClick}
        style={{ overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: totalWidth, height: RULER_HEIGHT }}>
          {ticks.map(f => {
            const x = f * zoomLevel - scrollX;
            if (x < -60 || x > totalWidth + 60) return null;
            return (
              <div key={f} style={{ position: 'absolute', left: x, top: 0, height: RULER_HEIGHT }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 14,
                    width: 1,
                    height: RULER_HEIGHT - 14,
                    background: '#52525b',
                  }}
                />
                {zoomLevel * fpt >= 20 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 3,
                      top: 4,
                      fontSize: 10,
                      color: '#a1a1aa',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {formatFrame(f)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Playhead triangle */}
        {playheadX >= 0 && (
          <div
            style={{
              position: 'absolute',
              left: playheadX,
              top: 0,
              width: 2,
              height: RULER_HEIGHT,
              background: '#ef4444',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: -5,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #ef4444',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
