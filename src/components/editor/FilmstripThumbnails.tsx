/**
 * FilmstripThumbnails
 * ────────────────────
 * Shows a repeating filmstrip of the clip's source image across the
 * full width of a video / GIF clip on the timeline.
 * Each "frame cell" is sized to match one frame at the current zoom level,
 * clamped to a minimum of 24 px so the image is always visible.
 */
import React from 'react';

interface Props {
  src?: string;
  width: number;
  height: number;
  /** Pixels per frame at the current zoom level */
  zoomLevel: number;
  /** Video frame rate */
  fps: number;
}

export function FilmstripThumbnails({ src, width, height, zoomLevel, fps }: Props) {
  if (!src || width < 4 || height < 4) return null;

  // One cell = one second of video (fps frames) at current zoom
  const cellWidth = Math.max(24, zoomLevel * fps);
  const cellHeight = height;

  // Derive aspect-correct cell height from thumbnail dimensions
  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${JSON.stringify(src)})`,
    backgroundRepeat: 'repeat-x',
    backgroundSize: `${cellWidth}px ${cellHeight}px`,
    backgroundPosition: 'left center',
    opacity: 0.5,
    pointerEvents: 'none',
  };

  // Sprocket holes — subtle dark circles along top and bottom
  const holeCount = Math.ceil(width / 16);

  return (
    <>
      <div style={thumbStyle} />
      {/* Top sprocket holes */}
      <div style={{ position: 'absolute', top: 2, left: 0, width, display: 'flex', gap: 8, pointerEvents: 'none', opacity: 0.4 }}>
        {Array.from({ length: holeCount }).map((_, i) => (
          <div
            key={i}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'black', flexShrink: 0 }}
          />
        ))}
      </div>
      {/* Bottom sprocket holes */}
      <div style={{ position: 'absolute', bottom: 2, left: 0, width, display: 'flex', gap: 8, pointerEvents: 'none', opacity: 0.4 }}>
        {Array.from({ length: holeCount }).map((_, i) => (
          <div
            key={i}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'black', flexShrink: 0 }}
          />
        ))}
      </div>
    </>
  );
}
