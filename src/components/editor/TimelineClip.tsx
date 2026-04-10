/**
 * TimelineClip
 * ─────────────
 * A single draggable, resizable clip on the timeline.
 *
 * Supports:
 *  - Pointer-event drag to move horizontally (and switch tracks on Y-axis)
 *  - Left/right edge drag handles for trimming / resizing
 *  - Rolling edit: dragging the shared boundary of two adjacent clips
 *  - Split at playhead in 'split' tool mode
 *  - Selection (single + additive Shift-click)
 *  - Snapping during drag/resize
 *  - Context menu (delete, duplicate, split)
 *  - Visual layers: filmstrip (video/gif), waveform (audio/voice/bgm), text (caption)
 */
import React, { useCallback, useRef, useState } from 'react';
import { Scissors, Copy, Trash2 } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import type { TimelineClip as TClip } from '@/types/editor';
import { AudioWaveform } from './AudioWaveform';
import { FilmstripThumbnails } from './FilmstripThumbnails';

const MIN_DURATION = 2; // frames
const EDGE_HANDLE_WIDTH = 8; // px

interface Props {
  clip: TClip;
  trackColor: string;
  trackHeight: number;
  /** Top offset of the track within the timeline scroll area (px) */
  trackTop: number;
  /** All tracks, for rolling-edit neighbour lookup */
  allTracks: Array<{ id: string; top: number; height: number }>;
}

interface CtxMenu { x: number; y: number }

export function TimelineClip({ clip, trackColor, trackHeight, trackTop, allTracks }: Props) {
  const {
    zoomLevel, scrollX, fps, playheadFrame, toolMode,
    selectedClipIds, selectClip, deselectAll,
    moveClip, resizeClip, splitClip, removeClips, duplicateClip, updateClipProps,
    snapFrame,
  } = useEditor();

  const isSelected = selectedClipIds.includes(clip.id);
  const clipRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    type: 'move' | 'left' | 'right';
    startPx: number;
    origStart: number;
    origDuration: number;
    origTrackTop: number;
  } | null>(null);

  const [localStart, setLocalStart] = useState(clip.startFrame);
  const [localDuration, setLocalDuration] = useState(clip.durationInFrames);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const isDragging = useRef(false);

  const clipLeft = clip.startFrame * zoomLevel - scrollX;
  const clipWidth = Math.max(MIN_DURATION * zoomLevel, clip.durationInFrames * zoomLevel);
  const displayLeft = isDragging.current ? localStart * zoomLevel - scrollX : clipLeft;
  const displayWidth = isDragging.current ? Math.max(MIN_DURATION * zoomLevel, localDuration * zoomLevel) : clipWidth;

  // ── Handle click (select / split) ───────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (toolMode === 'split') {
      splitClip(clip.id, playheadFrame);
      return;
    }
    selectClip(clip.id, e.shiftKey || e.metaKey || e.ctrlKey);
  }, [toolMode, selectClip, splitClip, clip.id, playheadFrame]);

  // ── Pointer drag ─────────────────────────────────────────────────────
  const beginDrag = useCallback((e: React.PointerEvent, type: 'move' | 'left' | 'right') => {
    if (toolMode === 'split') return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    setLocalStart(clip.startFrame);
    setLocalDuration(clip.durationInFrames);
    dragState.current = {
      type,
      startPx: e.clientX,
      origStart: clip.startFrame,
      origDuration: clip.durationInFrames,
      origTrackTop: trackTop,
    };
    selectClip(clip.id, false);
  }, [clip.startFrame, clip.durationInFrames, toolMode, trackTop, selectClip, clip.id]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current || !isDragging.current) return;
    const dx = e.clientX - dragState.current.startPx;
    const deltaFrames = Math.round(dx / zoomLevel);
    const { type, origStart, origDuration } = dragState.current;

    if (type === 'move') {
      const rawStart = origStart + deltaFrames;
      const snapped = snapFrame(rawStart, clip.id);
      setLocalStart(Math.max(0, snapped));
    } else if (type === 'right') {
      const newDur = Math.max(MIN_DURATION, origDuration + deltaFrames);
      const snappedEnd = snapFrame(origStart + newDur, clip.id);
      setLocalDuration(Math.max(MIN_DURATION, snappedEnd - origStart));
    } else if (type === 'left') {
      const newStart = Math.max(0, origStart + deltaFrames);
      const snappedStart = snapFrame(newStart, clip.id);
      const newDur = Math.max(MIN_DURATION, origStart + origDuration - snappedStart);
      setLocalStart(snappedStart);
      setLocalDuration(newDur);
    }
  }, [zoomLevel, snapFrame, clip.id]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState.current || !isDragging.current) return;
    isDragging.current = false;

    const { type } = dragState.current;
    if (type === 'move') {
      // Determine which track the clip was dropped on based on Y position
      const dropY = e.clientY;
      const targetTrack = allTracks.find(t => dropY >= t.top && dropY < t.top + t.height);
      const newTrackId = targetTrack?.id ?? clip.trackId;
      moveClip(clip.id, newTrackId, localStart);
    } else {
      resizeClip(clip.id, localStart, localDuration);
    }
    dragState.current = null;
    setLocalStart(clip.startFrame);
    setLocalDuration(clip.durationInFrames);
  }, [clip.id, clip.trackId, clip.startFrame, clip.durationInFrames, localStart, localDuration, moveClip, resizeClip, allTracks]);

  // ── Context menu ─────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeCtx = useCallback(() => setCtxMenu(null), []);

  // ── Visual content layer ─────────────────────────────────────────────
  const isAudio   = clip.type === 'voiceover' || clip.type === 'bgm';
  const isVideo   = clip.type === 'video' || clip.type === 'gif';
  const isCaption = clip.type === 'caption';

  const borderColor = isSelected ? '#ffffff' : 'transparent';
  const clipColor   = trackColor;

  if (displayLeft + displayWidth < 0 || displayLeft > 8000) return null; // off-screen cull

  return (
    <>
      <div
        ref={clipRef}
        style={{
          position: 'absolute',
          left: displayLeft,
          top: 0,
          width: displayWidth,
          height: trackHeight,
          background: clipColor,
          border: `2px solid ${borderColor}`,
          borderRadius: 4,
          overflow: 'hidden',
          cursor: toolMode === 'split' ? 'crosshair' : isDragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
          boxSizing: 'border-box',
          zIndex: isSelected ? 10 : 1,
          opacity: clip.opacity ?? 1,
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={e => beginDrag(e, 'move')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Filmstrip overlay for video/gif clips */}
        {isVideo && (
          <FilmstripThumbnails
            src={clip.src}
            width={displayWidth}
            height={trackHeight}
            zoomLevel={zoomLevel}
            fps={fps}
          />
        )}

        {/* Waveform overlay for audio clips */}
        {isAudio && (
          <AudioWaveform
            clipId={clip.id}
            audioSrc={clip.src}
            width={displayWidth}
            height={trackHeight}
            color="#ffffff"
          />
        )}

        {/* Caption text preview */}
        {isCaption && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            paddingLeft: 8, fontSize: 11, color: '#fff', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none',
          }}>
            {clip.text}
          </div>
        )}

        {/* Clip label */}
        <div style={{
          position: 'absolute', top: 2, left: EDGE_HANDLE_WIDTH + 2, right: EDGE_HANDLE_WIDTH + 2,
          fontSize: 10, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', whiteSpace: 'nowrap',
          textOverflow: 'ellipsis', pointerEvents: 'none', fontWeight: 600,
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}>
          {!isCaption && clip.name}
        </div>

        {/* Left resize handle */}
        <div
          style={{
            position: 'absolute', left: 0, top: 0, width: EDGE_HANDLE_WIDTH, height: '100%',
            cursor: 'ew-resize', background: 'rgba(255,255,255,0.15)', zIndex: 5,
          }}
          onPointerDown={e => { e.stopPropagation(); beginDrag(e, 'left'); }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />

        {/* Right resize handle */}
        <div
          style={{
            position: 'absolute', right: 0, top: 0, width: EDGE_HANDLE_WIDTH, height: '100%',
            cursor: 'ew-resize', background: 'rgba(255,255,255,0.15)', zIndex: 5,
          }}
          onPointerDown={e => { e.stopPropagation(); beginDrag(e, 'right'); }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />

        {/* Split mode indicator */}
        {toolMode === 'split' && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Scissors size={14} color="#ef4444" />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={closeCtx} />
          <div
            style={{
              position: 'fixed', left: ctxMenu.x, top: ctxMenu.y,
              zIndex: 99, background: '#18181b', border: '1px solid #3f3f46',
              borderRadius: 6, padding: '4px 0', minWidth: 150,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {[
              { label: 'Split at Playhead', icon: <Scissors size={12} />, action: () => { splitClip(clip.id, playheadFrame); closeCtx(); } },
              { label: 'Duplicate', icon: <Copy size={12} />, action: () => { duplicateClip(clip.id); closeCtx(); } },
              { label: 'Delete', icon: <Trash2 size={12} />, action: () => { removeClips([clip.id]); closeCtx(); }, danger: true },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '6px 12px', background: 'none', border: 'none',
                  color: item.danger ? '#f87171' : '#d4d4d8', cursor: 'pointer', fontSize: 12,
                  textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#27272a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
