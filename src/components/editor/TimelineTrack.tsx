/**
 * TimelineTrack
 * ─────────────
 * One horizontal track row. Renders all clips + track controls (label, mute, lock).
 * The playhead line is drawn by the parent MultiTrackTimeline.
 */
import React, { useCallback } from 'react';
import { Volume2, VolumeX, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import type { TimelineTrack as TTrack } from '@/types/editor';
import { TimelineClip } from './TimelineClip';

interface Props {
  track: TTrack;
  trackTop: number;
  allTrackMeta: Array<{ id: string; top: number; height: number }>;
}

const GUTTER_WIDTH = 120;

export function TimelineTrack({ track, trackTop, allTrackMeta }: Props) {
  const { toggleTrackMute, toggleTrackLock, toggleTrackCollapse, deselectAll } = useEditor();

  const height = track.collapsed ? 24 : track.height;

  const handleBgClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement) === e.currentTarget) deselectAll();
  }, [deselectAll]);

  return (
    <div style={{ display: 'flex', height, borderBottom: '1px solid #27272a', flexShrink: 0 }}>
      {/* ── Label gutter ─────────────────────────────────────────────── */}
      <div
        style={{
          width: GUTTER_WIDTH,
          flexShrink: 0,
          background: '#18181b',
          borderRight: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px',
          gap: 4,
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => toggleTrackCollapse(track.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#71717a', flexShrink: 0 }}
        >
          {track.collapsed
            ? <ChevronRight size={12} />
            : <ChevronDown size={12} />}
        </button>

        {/* Colour swatch */}
        <div style={{ width: 4, height: 20, borderRadius: 2, background: track.color, flexShrink: 0 }} />

        {/* Label */}
        <span style={{
          fontSize: 11, color: '#a1a1aa', fontWeight: 500, flex: 1,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {track.label}
        </span>

        {/* Mute */}
        <button
          onClick={() => toggleTrackMute(track.id)}
          title={track.muted ? 'Unmute' : 'Mute'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: track.muted ? '#ef4444' : '#52525b', flexShrink: 0,
          }}
        >
          {track.muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
        </button>

        {/* Lock */}
        <button
          onClick={() => toggleTrackLock(track.id)}
          title={track.locked ? 'Unlock' : 'Lock'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: track.locked ? '#f59e0b' : '#52525b', flexShrink: 0,
          }}
        >
          {track.locked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>
      </div>

      {/* ── Clip rail ────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: track.locked ? 'rgba(0,0,0,0.4)' : 'transparent',
          opacity: track.muted ? 0.5 : 1,
          cursor: track.locked ? 'not-allowed' : 'default',
        }}
        onClick={handleBgClick}
      >
        {!track.collapsed && track.clips.map(clip => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            trackColor={track.color}
            trackHeight={height}
            trackTop={trackTop}
            allTracks={allTrackMeta}
          />
        ))}
      </div>
    </div>
  );
}

export { GUTTER_WIDTH };
