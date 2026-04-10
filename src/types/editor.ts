/** -----------------------------------------------------------------------
 *  StoryWeave Editor Types
 *  All timeline / clip data types used by the visual editor.
 *  The editor's internal model is separate from VideoState so the editor
 *  can support richer metadata (trim points, inspector props, etc.) that
 *  gets collapsed into VideoState only at render time.
 * ---------------------------------------------------------------------- */

export type TrackType = 'video' | 'voiceover' | 'bgm' | 'caption' | 'gif';

export type TransitionType = 'fade' | 'slide' | 'none';

export type CaptionPosition = 'top' | 'center' | 'bottom';

export type ToolMode =
  | 'select'     // default — move clips
  | 'split'      // click to split clip at playhead
  | 'trim'       // drag edges for rolling edits
  | 'text'       // add caption overlay
  | 'hand';      // pan timeline

// -------------------------------------------------------------------------
// Clip
// -------------------------------------------------------------------------

export interface TimelineClip {
  id: string;
  trackId: string;
  type: TrackType;

  /** Frame at which this clip starts in the composition */
  startFrame: number;
  /** Number of frames this clip occupies */
  durationInFrames: number;

  /** Display label shown on the clip body */
  name: string;

  // --- Content ---
  /** URL: image/video/audio/GIF source */
  src?: string;
  /** Caption text (caption clips only) */
  text?: string;

  // --- Trim (non-destructive) ---
  /** Source frames to skip at the start */
  trimIn?: number;
  /** Source frames to remove from the end */
  trimOut?: number;

  // --- Audio properties ---
  /** 0–1 gain */
  volume?: number;
  /** Fade-in duration in frames */
  fadeIn?: number;
  /** Fade-out duration in frames */
  fadeOut?: number;

  // --- Visual properties ---
  /** 0–1 opacity */
  opacity?: number;
  /** Horizontal position offset (px) */
  x?: number;
  /** Vertical position offset (px) */
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;

  // --- Crop (0–1 ratio of clip dimensions) ---
  cropLeft?: number;
  cropRight?: number;
  cropTop?: number;
  cropBottom?: number;

  /** Corner border radius in px */
  borderRadius?: number;

  // --- Scene / transition ---
  transitionType?: TransitionType;
  /** Ken Burns slow zoom effect */
  kenBurns?: boolean;

  // --- Caption-specific ---
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  fontWeight?: 'normal' | 'bold';
  captionPosition?: CaptionPosition;
  captionBackground?: boolean;
  captionAnimationIn?: 'fade' | 'slide-up' | 'none';
}

// -------------------------------------------------------------------------
// Track
// -------------------------------------------------------------------------

export interface TimelineTrack {
  id: string;
  type: TrackType;
  label: string;
  clips: TimelineClip[];
  muted: boolean;
  locked: boolean;
  collapsed: boolean;
  /** CSS colour used for clip backgrounds on this track */
  color: string;
  /** Pixel height of this track row */
  height: number;
}

// -------------------------------------------------------------------------
// History (undo / redo)
// -------------------------------------------------------------------------

export interface HistoryEntry {
  /** Human-readable label shown in history panel */
  label: string;
  before: TimelineTrack[];
  after: TimelineTrack[];
}

// -------------------------------------------------------------------------
// Marquee selection
// -------------------------------------------------------------------------

export interface MarqueeRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// -------------------------------------------------------------------------
// Snap point
// -------------------------------------------------------------------------

export interface SnapPoint {
  frame: number;
  /** type of snap source */
  source: 'clip-start' | 'clip-end' | 'playhead' | 'ruler';
}

// -------------------------------------------------------------------------
// Klipy GIF API types
// -------------------------------------------------------------------------

export interface KlipyGIF {
  id: string;
  title: string;
  url: string;       // full GIF URL
  preview: string;   // smaller preview URL
  width: number;
  height: number;
}
