import { useCallback, useRef, useState } from 'react';
import type { HistoryEntry, TimelineTrack } from '@/types/editor';

const MAX_HISTORY = 60;

export interface UndoRedoControls {
  /** Push a new action onto the stack */
  push: (label: string, before: TimelineTrack[], after: TimelineTrack[]) => void;
  /** Revert to the state before the last action. Returns the 'before' tracks, or null if at bottom. */
  undo: () => TimelineTrack[] | null;
  /** Re-apply the last undone action. Returns the 'after' tracks, or null if at top. */
  redo: () => TimelineTrack[] | null;
  canUndo: boolean;
  canRedo: boolean;
  /** Current action label (shown in toolbar tooltip) */
  undoLabel: string;
  redoLabel: string;
}

/**
 * Undo/redo history stack for the timeline editor.
 * Each entry stores a full deep-copy of the tracks array before and after
 * a user action so that undo/redo are simple array swaps.
 */
export function useUndoRedo(): UndoRedoControls {
  // Mutable ref so that push/undo/redo don't require re-render of the hook itself
  const stackRef = useRef<HistoryEntry[]>([]);
  const indexRef = useRef<number>(-1);

  // Force a re-render when the canUndo/canRedo state changes
  const [, setVersion] = useState(0);
  const bump = () => setVersion(v => v + 1);

  const push = useCallback((label: string, before: TimelineTrack[], after: TimelineTrack[]) => {
    // Drop any "future" entries above the current index
    stackRef.current = stackRef.current.slice(0, indexRef.current + 1);
    // Enforce max size
    if (stackRef.current.length >= MAX_HISTORY) {
      stackRef.current.shift();
    }
    stackRef.current.push({
      label,
      before: JSON.parse(JSON.stringify(before)),
      after: JSON.parse(JSON.stringify(after)),
    });
    indexRef.current = stackRef.current.length - 1;
    bump();
  }, []);

  const undo = useCallback((): TimelineTrack[] | null => {
    if (indexRef.current < 0) return null;
    const entry = stackRef.current[indexRef.current];
    indexRef.current -= 1;
    bump();
    return JSON.parse(JSON.stringify(entry.before));
  }, []);

  const redo = useCallback((): TimelineTrack[] | null => {
    if (indexRef.current >= stackRef.current.length - 1) return null;
    indexRef.current += 1;
    const entry = stackRef.current[indexRef.current];
    bump();
    return JSON.parse(JSON.stringify(entry.after));
  }, []);

  const canUndo = indexRef.current >= 0;
  const canRedo = indexRef.current < stackRef.current.length - 1;
  const undoLabel = canUndo ? stackRef.current[indexRef.current].label : '';
  const redoLabel = canRedo ? stackRef.current[indexRef.current + 1].label : '';

  return { push, undo, redo, canUndo, canRedo, undoLabel, redoLabel };
}
