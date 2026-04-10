/**
 * MultiTrackTimeline
 * ───────────────────
 * The full timeline panel:
 *   - TimelineRuler at the top
 *   - Stacked TimelineTrack rows
 *   - Red playhead line spanning all tracks
 *   - Horizontal scroll driven by EditorContext.scrollX
 *   - Wheel to zoom (Ctrl/Cmd + scroll) or scroll horizontally
 *   - Marquee selection box on empty-area drag
 *   - Snap indicator lines when dragging
 */
import React, { useCallback, useRef, useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrack, GUTTER_WIDTH } from './TimelineTrack';
import type { MarqueeRect } from '@/types/editor';

const RULER_HEIGHT = 28;

export function MultiTrackTimeline() {
  const {
    tracks, zoomLevel, setZoomLevel, scrollX, setScrollX,
    playheadFrame, deselectAll, setMarquee, selectByMarquee, marquee,
    totalDurationInFrames,
  } = useEditor();

  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [localMarquee, setLocalMarquee] = useState<MarqueeRect | null>(null);

  // ── Compute track offsets for hit-testing (marquee + drop) ────────────
  let cumTop = RULER_HEIGHT;
  const trackMeta: Array<{ id: string; top: number; height: number }> = tracks.map(tr => {
    const height = tr.collapsed ? 24 : tr.height;
    const meta = { id: tr.id, top: cumTop, height };
    cumTop += height + 1; // +1 for border
    return meta;
  });

  // ── Wheel handler (zoom + scroll) ────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom centred on cursor
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cursorX = e.clientX - rect.left - GUTTER_WIDTH;
      const cursorFrame = (cursorX + scrollX) / zoomLevel;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.max(0.5, Math.min(20, zoomLevel * factor));
      setZoomLevel(newZoom);
      // Preserve the frame under the cursor
      setScrollX(Math.max(0, cursorFrame * newZoom - cursorX));
    } else {
      setScrollX(prev => Math.max(0, prev + e.deltaX + e.deltaY * 0.5));
    }
  }, [zoomLevel, scrollX, setZoomLevel, setScrollX]);

  // ── Marquee selection ─────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-clip]')) return;
    deselectAll();
    const rect = containerRef.current!.getBoundingClientRect();
    marqueeStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [deselectAll]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!marqueeStartRef.current) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const cur = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const m: MarqueeRect = {
      startX: marqueeStartRef.current.x,
      startY: marqueeStartRef.current.y,
      endX: cur.x,
      endY: cur.y,
    };
    setLocalMarquee(m);
    setMarquee(m);
  }, [setMarquee]);

  const onPointerUp = useCallback(() => {
    if (localMarquee) {
      // Convert marquee coords to clip-rail coords (subtract gutter)
      const offsetMap = new Map(trackMeta.map(m => [m.id, m]));
      const railMarquee: MarqueeRect = {
        startX: localMarquee.startX - GUTTER_WIDTH + scrollX,
        startY: localMarquee.startY - RULER_HEIGHT,
        endX: localMarquee.endX - GUTTER_WIDTH + scrollX,
        endY: localMarquee.endY - RULER_HEIGHT,
      };
      selectByMarquee(railMarquee, offsetMap);
    }
    marqueeStartRef.current = null;
    setLocalMarquee(null);
    setMarquee(null);
  }, [localMarquee, scrollX, trackMeta, selectByMarquee, setMarquee]);

  // ── Playhead line X position ──────────────────────────────────────────
  const playheadX = GUTTER_WIDTH + playheadFrame * zoomLevel - scrollX;
  const totalWidth = Math.max(800, totalDurationInFrames * zoomLevel + GUTTER_WIDTH + 200);

  return (
    <div
      ref={containerRef}
      className="relative bg-zinc-950 overflow-hidden select-none"
      style={{ height: '100%' }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Ruler */}
      <TimelineRuler gutterWidth={GUTTER_WIDTH} />

      {/* Track rows (vertically scrollable) */}
      <div
        style={{
          position: 'absolute',
          top: RULER_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div style={{ minWidth: totalWidth }}>
          {tracks.map((track, idx) => (
            <TimelineTrack
              key={track.id}
              track={track}
              trackTop={trackMeta[idx]?.top ?? 0}
              allTrackMeta={trackMeta}
            />
          ))}
          {/* Bottom padding */}
          <div style={{ height: 40 }} />
        </div>
      </div>

      {/* Playhead red line */}
      {playheadX >= GUTTER_WIDTH && playheadX <= (containerRef.current?.clientWidth ?? 9999) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: playheadX,
            width: 2,
            height: '100%',
            background: '#ef4444',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        />
      )}

      {/* Marquee selection box */}
      {localMarquee && (() => {
        const x = Math.min(localMarquee.startX, localMarquee.endX);
        const y = Math.min(localMarquee.startY, localMarquee.endY);
        const w = Math.abs(localMarquee.endX - localMarquee.startX);
        const h = Math.abs(localMarquee.endY - localMarquee.startY);
        return (
          <div
            style={{
              position: 'absolute',
              left: x, top: y, width: w, height: h,
              border: '1px solid #6366f1',
              background: 'rgba(99,102,241,0.1)',
              pointerEvents: 'none',
              zIndex: 30,
            }}
          />
        );
      })()}

      {/* Horizontal scroll bar */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: GUTTER_WIDTH, right: 0, height: 8,
          background: '#18181b', zIndex: 40,
        }}
        onPointerDown={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setScrollX(ratio * (totalDurationInFrames * zoomLevel));
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#3f3f46',
            borderRadius: 4,
            width: `${Math.min(100, ((containerRef.current?.clientWidth ?? 800) / totalWidth) * 100)}%`,
            marginLeft: `${Math.min(100 - ((containerRef.current?.clientWidth ?? 800) / totalWidth) * 100, (scrollX / (totalDurationInFrames * zoomLevel)) * 100)}%`,
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}
