/**
 * EditorContext
 * -------------
 * Single source of truth for all editor state:
 *   - Timeline tracks + clips
 *   - Playhead position & playback
 *   - Selected clips
 *   - Tool mode
 *   - Zoom / scroll
 *   - Snap settings
 *   - Marquee selection
 *   - Undo / redo
 *
 * All mutating operations go through this context so that history is
 * recorded automatically and the VideoStateContext stays in sync.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  HistoryEntry,
  MarqueeRect,
  SnapPoint,
  TimelineClip,
  TimelineTrack,
  ToolMode,
} from '@/types/editor';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useVideoState } from './VideoStateContext';
import type { VideoState } from '@/types/index';

// -------------------------------------------------------------------------
// Default tracks (empty project skeleton)
// -------------------------------------------------------------------------

const DEFAULT_FPS = 30;

function makeDefaultTracks(): TimelineTrack[] {
  return [
    { id: 'track-video',     type: 'video',     label: 'Video',     clips: [], muted: false, locked: false, collapsed: false, color: '#6366f1', height: 72 },
    { id: 'track-voiceover', type: 'voiceover', label: 'Voiceover', clips: [], muted: false, locked: false, collapsed: false, color: '#10b981', height: 56 },
    { id: 'track-bgm',       type: 'bgm',       label: 'BGM',       clips: [], muted: false, locked: false, collapsed: false, color: '#f59e0b', height: 56 },
    { id: 'track-caption',   type: 'caption',   label: 'Captions',  clips: [], muted: false, locked: false, collapsed: false, color: '#ec4899', height: 48 },
    { id: 'track-gif',       type: 'gif',       label: 'GIFs',      clips: [], muted: false, locked: false, collapsed: false, color: '#8b5cf6', height: 48 },
  ];
}

// -------------------------------------------------------------------------
// Context shape
// -------------------------------------------------------------------------

interface EditorContextValue {
  // ── State ─────────────────────────────────────────────────────────────
  tracks: TimelineTrack[];
  selectedClipIds: string[];
  playheadFrame: number;
  isPlaying: boolean;
  toolMode: ToolMode;
  zoomLevel: number;        // px per frame
  scrollX: number;          // px scrolled horizontally
  fps: number;
  totalDurationInFrames: number;
  snapEnabled: boolean;
  marquee: MarqueeRect | null;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string;
  redoLabel: string;

  // ── Playback ──────────────────────────────────────────────────────────
  setPlayheadFrame: (frame: number) => void;
  togglePlayback: () => void;
  stop: () => void;

  // ── Tool & view ───────────────────────────────────────────────────────
  setToolMode: (mode: ToolMode) => void;
  setZoomLevel: (zoom: number) => void;
  setScrollX: (x: number) => void;
  setSnapEnabled: (v: boolean) => void;
  setMarquee: (rect: MarqueeRect | null) => void;

  // ── Clip operations ───────────────────────────────────────────────────
  addClip: (trackId: string, clip: Omit<TimelineClip, 'id' | 'trackId'>) => void;
  removeClips: (ids: string[]) => void;
  moveClip: (id: string, newTrackId: string, newStartFrame: number) => void;
  resizeClip: (id: string, newStart: number, newDuration: number) => void;
  splitClip: (id: string, atFrame: number) => void;
  updateClipProps: (id: string, props: Partial<TimelineClip>) => void;
  duplicateClip: (id: string) => void;

  // ── Track operations ──────────────────────────────────────────────────
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackCollapse: (trackId: string) => void;

  // ── Selection ─────────────────────────────────────────────────────────
  selectClip: (id: string, additive?: boolean) => void;
  deselectAll: () => void;
  selectByMarquee: (rect: MarqueeRect, trackOffsets: Map<string, { top: number; height: number }>) => void;

  // ── Snapping ──────────────────────────────────────────────────────────
  getSnapPoints: (excludeClipId?: string) => SnapPoint[];
  snapFrame: (frame: number, excludeId?: string) => number;

  // ── History ───────────────────────────────────────────────────────────
  undo: () => void;
  redo: () => void;

  // ── Load from VideoState ──────────────────────────────────────────────
  loadFromVideoState: (vs: VideoState) => void;
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

// -------------------------------------------------------------------------
// UUID shim — use crypto.randomUUID if uuidv4 not available
// -------------------------------------------------------------------------
function genId(): string {
  try { return uuidv4(); } catch { return crypto.randomUUID(); }
}

// -------------------------------------------------------------------------
// Provider
// -------------------------------------------------------------------------

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const { videoState, setVideoState } = useVideoState();
  const history = useUndoRedo();

  const [tracks, setTracksRaw] = useState<TimelineTrack[]>(makeDefaultTracks);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [playheadFrame, setPlayheadFrameState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [zoomLevel, setZoomLevel] = useState(2);     // 2 px / frame by default
  const [scrollX, setScrollX] = useState(0);
  const [fps] = useState(DEFAULT_FPS);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);

  const rafRef = useRef<number | null>(null);
  const playStartRef = useRef<{ wallMs: number; startFrame: number } | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────
  const totalDurationInFrames = Math.max(
    300,
    ...tracks.flatMap(t => t.clips.map(c => c.startFrame + c.durationInFrames))
  );

  // ── Sync tracks → VideoState ─────────────────────────────────────────
  const syncToVideoState = useCallback((t: TimelineTrack[]) => {
    const videoTrack    = t.find(tr => tr.type === 'video');
    const voiceTrack    = t.find(tr => tr.type === 'voiceover');
    const bgmTrack      = t.find(tr => tr.type === 'bgm');
    const captionTrack  = t.find(tr => tr.type === 'caption');

    setVideoState(prev => ({
      id: prev?.id ?? genId(),
      global: prev?.global ?? { fps, durationInFrames: totalDurationInFrames, width: 1920, height: 1080 },
      audio: {
        voiceoverUrl: voiceTrack?.clips[0]?.src ?? prev?.audio?.voiceoverUrl,
        bgmUrl: bgmTrack?.clips[0]?.src ?? prev?.audio?.bgmUrl,
        volumeBgm: bgmTrack?.clips[0]?.volume ?? prev?.audio?.volumeBgm ?? 0.3,
      },
      captions: (captionTrack?.clips ?? []).map(c => ({
        text: c.text ?? '',
        startFrame: c.startFrame,
        endFrame: c.startFrame + c.durationInFrames,
      })),
      scenes: (videoTrack?.clips ?? []).map(c => ({
        id: c.id,
        startFrame: c.startFrame,
        durationInFrames: c.durationInFrames,
        transitionType: c.transitionType ?? 'fade',
        visualType: c.type === 'gif' ? 'gif' : 'image',
        visualUrl: c.src ?? '',
        kenBurnsEffect: c.kenBurns ?? false,
      })),
    }));
  }, [fps, setVideoState, totalDurationInFrames]);

  // Wrapped setter — always syncs
  const setTracks = useCallback((next: TimelineTrack[] | ((prev: TimelineTrack[]) => TimelineTrack[])) => {
    setTracksRaw(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      syncToVideoState(resolved);
      return resolved;
    });
  }, [syncToVideoState]);

  // ── History-aware track mutation ─────────────────────────────────────
  const commit = useCallback((label: string, fn: (prev: TimelineTrack[]) => TimelineTrack[]) => {
    setTracksRaw(prev => {
      const next = fn(prev);
      history.push(label, prev, next);
      syncToVideoState(next);
      return next;
    });
  }, [history, syncToVideoState]);

  // ── Playback ─────────────────────────────────────────────────────────
  const setPlayheadFrame = useCallback((f: number) => {
    setPlayheadFrameState(Math.max(0, Math.min(f, totalDurationInFrames)));
  }, [totalDurationInFrames]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      playStartRef.current = null;
      return;
    }
    playStartRef.current = { wallMs: performance.now(), startFrame: playheadFrame };
    const tick = (now: number) => {
      if (!playStartRef.current) return;
      const elapsed = now - playStartRef.current.wallMs;
      const newFrame = Math.round(playStartRef.current.startFrame + (elapsed / 1000) * fps);
      if (newFrame >= totalDurationInFrames) {
        setPlayheadFrameState(totalDurationInFrames);
        setIsPlaying(false);
        return;
      }
      setPlayheadFrameState(newFrame);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, fps, totalDurationInFrames]);

  const togglePlayback = useCallback(() => setIsPlaying(v => !v), []);
  const stop = useCallback(() => { setIsPlaying(false); setPlayheadFrameState(0); }, []);

  // ── Clip operations ───────────────────────────────────────────────────
  const addClip = useCallback((trackId: string, clip: Omit<TimelineClip, 'id' | 'trackId'>) => {
    const id = genId();
    commit('Add clip', prev =>
      prev.map(tr => tr.id !== trackId ? tr : {
        ...tr,
        clips: [...tr.clips, { ...clip, id, trackId }],
      })
    );
  }, [commit]);

  const removeClips = useCallback((ids: string[]) => {
    commit('Delete clip', prev =>
      prev.map(tr => ({ ...tr, clips: tr.clips.filter(c => !ids.includes(c.id)) }))
    );
    setSelectedClipIds(prev => prev.filter(id => !ids.includes(id)));
  }, [commit]);

  const moveClip = useCallback((id: string, newTrackId: string, newStartFrame: number) => {
    commit('Move clip', prev => {
      let clip: TimelineClip | undefined;
      const removed = prev.map(tr => {
        const idx = tr.clips.findIndex(c => c.id === id);
        if (idx === -1) return tr;
        clip = tr.clips[idx];
        return { ...tr, clips: tr.clips.filter(c => c.id !== id) };
      });
      if (!clip) return prev;
      const updated: TimelineClip = { ...clip, trackId: newTrackId, startFrame: Math.max(0, newStartFrame) };
      return removed.map(tr =>
        tr.id !== newTrackId ? tr : { ...tr, clips: [...tr.clips, updated].sort((a, b) => a.startFrame - b.startFrame) }
      );
    });
  }, [commit]);

  const resizeClip = useCallback((id: string, newStart: number, newDuration: number) => {
    commit('Resize clip', prev =>
      prev.map(tr => ({
        ...tr,
        clips: tr.clips.map(c =>
          c.id !== id ? c : { ...c, startFrame: Math.max(0, newStart), durationInFrames: Math.max(1, newDuration) }
        ),
      }))
    );
  }, [commit]);

  const splitClip = useCallback((id: string, atFrame: number) => {
    commit('Split clip', prev =>
      prev.map(tr => {
        const idx = tr.clips.findIndex(c => c.id === id);
        if (idx === -1) return tr;
        const clip = tr.clips[idx];
        if (atFrame <= clip.startFrame || atFrame >= clip.startFrame + clip.durationInFrames) return tr;
        const firstDur = atFrame - clip.startFrame;
        const secondDur = clip.durationInFrames - firstDur;
        const first: TimelineClip = { ...clip, durationInFrames: firstDur };
        const second: TimelineClip = { ...clip, id: genId(), startFrame: atFrame, durationInFrames: secondDur };
        const clips = [...tr.clips];
        clips.splice(idx, 1, first, second);
        return { ...tr, clips };
      })
    );
  }, [commit]);

  const updateClipProps = useCallback((id: string, props: Partial<TimelineClip>) => {
    commit('Update clip', prev =>
      prev.map(tr => ({
        ...tr,
        clips: tr.clips.map(c => c.id !== id ? c : { ...c, ...props }),
      }))
    );
  }, [commit]);

  const duplicateClip = useCallback((id: string) => {
    commit('Duplicate clip', prev =>
      prev.map(tr => {
        const idx = tr.clips.findIndex(c => c.id === id);
        if (idx === -1) return tr;
        const orig = tr.clips[idx];
        const dupe: TimelineClip = {
          ...orig,
          id: genId(),
          startFrame: orig.startFrame + orig.durationInFrames + fps, // 1s gap
        };
        return { ...tr, clips: [...tr.clips, dupe].sort((a, b) => a.startFrame - b.startFrame) };
      })
    );
  }, [commit, fps]);

  // ── Track operations ─────────────────────────────────────────────────
  const toggleTrackMute = useCallback((trackId: string) => {
    setTracks(prev => prev.map(tr => tr.id !== trackId ? tr : { ...tr, muted: !tr.muted }));
  }, [setTracks]);

  const toggleTrackLock = useCallback((trackId: string) => {
    setTracks(prev => prev.map(tr => tr.id !== trackId ? tr : { ...tr, locked: !tr.locked }));
  }, [setTracks]);

  const toggleTrackCollapse = useCallback((trackId: string) => {
    setTracks(prev => prev.map(tr => tr.id !== trackId ? tr : { ...tr, collapsed: !tr.collapsed }));
  }, [setTracks]);

  // ── Selection ─────────────────────────────────────────────────────────
  const selectClip = useCallback((id: string, additive = false) => {
    setSelectedClipIds(prev => {
      if (additive) return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      return [id];
    });
  }, []);

  const deselectAll = useCallback(() => setSelectedClipIds([]), []);

  const selectByMarquee = useCallback(
    (rect: MarqueeRect, trackOffsets: Map<string, { top: number; height: number }>) => {
      const minX = Math.min(rect.startX, rect.endX);
      const maxX = Math.max(rect.startX, rect.endX);
      const minY = Math.min(rect.startY, rect.endY);
      const maxY = Math.max(rect.startY, rect.endY);

      const selected: string[] = [];
      tracks.forEach(tr => {
        const offset = trackOffsets.get(tr.id);
        if (!offset) return;
        const trTop = offset.top;
        const trBot = offset.top + offset.height;
        if (trBot < minY || trTop > maxY) return;
        tr.clips.forEach(c => {
          const clipLeft = c.startFrame * zoomLevel - scrollX;
          const clipRight = clipLeft + c.durationInFrames * zoomLevel;
          if (clipRight >= minX && clipLeft <= maxX) selected.push(c.id);
        });
      });
      setSelectedClipIds(selected);
    },
    [tracks, zoomLevel, scrollX]
  );

  // ── Snapping ─────────────────────────────────────────────────────────
  const SNAP_THRESHOLD_FRAMES = 4;

  const getSnapPoints = useCallback((excludeClipId?: string): SnapPoint[] => {
    const pts: SnapPoint[] = [{ frame: 0, source: 'ruler' }, { frame: playheadFrame, source: 'playhead' }];
    tracks.forEach(tr =>
      tr.clips.forEach(c => {
        if (c.id === excludeClipId) return;
        pts.push({ frame: c.startFrame, source: 'clip-start' });
        pts.push({ frame: c.startFrame + c.durationInFrames, source: 'clip-end' });
      })
    );
    return pts;
  }, [tracks, playheadFrame]);

  const snapFrame = useCallback((frame: number, excludeId?: string): number => {
    if (!snapEnabled) return frame;
    const pts = getSnapPoints(excludeId);
    let best = frame;
    let bestDist = SNAP_THRESHOLD_FRAMES;
    pts.forEach(p => {
      const d = Math.abs(p.frame - frame);
      if (d < bestDist) { bestDist = d; best = p.frame; }
    });
    return best;
  }, [snapEnabled, getSnapPoints]);

  // ── History ───────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const before = history.undo();
    if (before) { setTracksRaw(before); syncToVideoState(before); }
  }, [history, syncToVideoState]);

  const redo = useCallback(() => {
    const after = history.redo();
    if (after) { setTracksRaw(after); syncToVideoState(after); }
  }, [history, syncToVideoState]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipIds.length) removeClips(selectedClipIds);
      }
      if (e.key === 'Escape') deselectAll();
      if (e.key === ' ') { e.preventDefault(); togglePlayback(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedClipIds, removeClips, deselectAll, togglePlayback]);

  // ── Load from VideoState ──────────────────────────────────────────────
  const loadFromVideoState = useCallback((vs: VideoState) => {
    const newTracks = makeDefaultTracks();
    const videoTrack    = newTracks.find(t => t.type === 'video')!;
    const voiceTrack    = newTracks.find(t => t.type === 'voiceover')!;
    const bgmTrack      = newTracks.find(t => t.type === 'bgm')!;
    const captionTrack  = newTracks.find(t => t.type === 'caption')!;

    videoTrack.clips = vs.scenes.map(s => ({
      id: s.id,
      trackId: videoTrack.id,
      type: 'video' as const,
      name: `Scene`,
      startFrame: s.startFrame,
      durationInFrames: s.durationInFrames,
      src: s.visualUrl,
      transitionType: s.transitionType,
      kenBurns: s.kenBurnsEffect,
      volume: 1,
      opacity: 1,
    }));

    if (vs.audio.voiceoverUrl) {
      voiceTrack.clips = [{
        id: genId(),
        trackId: voiceTrack.id,
        type: 'voiceover',
        name: 'Voiceover',
        startFrame: 0,
        durationInFrames: vs.global.durationInFrames,
        src: vs.audio.voiceoverUrl,
        volume: 1,
      }];
    }

    if (vs.audio.bgmUrl) {
      bgmTrack.clips = [{
        id: genId(),
        trackId: bgmTrack.id,
        type: 'bgm',
        name: 'Background Music',
        startFrame: 0,
        durationInFrames: vs.global.durationInFrames,
        src: vs.audio.bgmUrl,
        volume: vs.audio.volumeBgm,
      }];
    }

    captionTrack.clips = vs.captions.map(cap => ({
      id: genId(),
      trackId: captionTrack.id,
      type: 'caption' as const,
      name: cap.text.slice(0, 24),
      startFrame: cap.startFrame,
      durationInFrames: cap.endFrame - cap.startFrame,
      text: cap.text,
      fontColor: '#ffffff',
      fontSize: 72,
      captionPosition: 'bottom' as const,
      captionBackground: true,
    }));

    setTracksRaw(newTracks);
    syncToVideoState(newTracks);
  }, [syncToVideoState]);

  // Auto-load when videoState changes externally (e.g. after AI generation)
  const didLoad = useRef(false);
  useEffect(() => {
    if (!didLoad.current && videoState && videoState.scenes.length > 0) {
      didLoad.current = true;
      loadFromVideoState(videoState);
    }
  }, [videoState, loadFromVideoState]);

  const value: EditorContextValue = {
    tracks, selectedClipIds, playheadFrame, isPlaying, toolMode,
    zoomLevel, scrollX, fps, totalDurationInFrames, snapEnabled, marquee,
    canUndo: history.canUndo, canRedo: history.canRedo,
    undoLabel: history.undoLabel, redoLabel: history.redoLabel,
    setPlayheadFrame, togglePlayback, stop,
    setToolMode, setZoomLevel, setScrollX, setSnapEnabled, setMarquee,
    addClip, removeClips, moveClip, resizeClip, splitClip, updateClipProps, duplicateClip,
    toggleTrackMute, toggleTrackLock, toggleTrackCollapse,
    selectClip, deselectAll, selectByMarquee,
    getSnapPoints, snapFrame,
    undo, redo,
    loadFromVideoState,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within an EditorProvider');
  return ctx;
}
