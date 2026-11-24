import type { PhotoMetadata } from '../types';
import type { Rect } from '../renderer/layout';
import { getFilmAccentColor } from '../presets/filmStocks';

export const FULL_FRAME_SPROCKET_COUNT = 8;
export const HALF_FRAME_SPROCKET_COUNT = 4;

// ISO 1007 (135 film) standard perforation proportions:
// Pitch = 4.75 mm, width = 1.98 mm (0.417 * pitch), height = 2.80 mm (1.414 * width)
const PERF_ALONG_RATIO = 1.98 / 4.75;
const PERF_ACROSS_TO_ALONG = 2.8 / 1.98;

export interface SprocketGeometry {
  holes: Rect[];
  pitch: number;
  holeAlong: number;
  holeAcross: number;
}

export function computeSprocketHoles(
  bandRect: Rect,
  orientation: 'horizontal' | 'vertical',
  holeCount: number,
  scale: number,
): SprocketGeometry {
  const safeCount = Math.max(1, Math.round(holeCount));

  if (orientation === 'horizontal') {
    const pitch = bandRect.width / safeCount;
    const holeAlong = Math.max(2 * scale, pitch * PERF_ALONG_RATIO);
    const holeAcross = Math.max(
      2.5 * scale,
      Math.min(bandRect.height * 0.78, holeAlong * PERF_ACROSS_TO_ALONG),
    );
    const y = bandRect.y + (bandRect.height - holeAcross) / 2;
    const holes: Rect[] = [];

    for (let i = 0; i < safeCount; i++) {
      const centerX = bandRect.x + (i + 0.5) * pitch;
      holes.push({
        x: centerX - holeAlong / 2,
        y,
        width: holeAlong,
        height: holeAcross,
      });
    }

    return { holes, pitch, holeAlong, holeAcross };
  }

  const pitch = bandRect.height / safeCount;
  const holeAlong = Math.max(2 * scale, pitch * PERF_ALONG_RATIO);
  const holeAcross = Math.max(
    2.5 * scale,
    Math.min(bandRect.width * 0.78, holeAlong * PERF_ACROSS_TO_ALONG),
  );
  const x = bandRect.x + (bandRect.width - holeAcross) / 2;
  const holes: Rect[] = [];

  for (let i = 0; i < safeCount; i++) {
    const centerY = bandRect.y + (i + 0.5) * pitch;
    holes.push({
      x,
      y: centerY - holeAlong / 2,
      width: holeAcross,
      height: holeAlong,
    });
  }

  return { holes, pitch, holeAlong, holeAcross };
}

export function computeSprocketBandThickness(
  estimatedSpan: number,
  holeCount: number,
  maxAllowedThickness: number,
  scale: number,
): number {
  const pitch = estimatedSpan / Math.max(1, holeCount);
  const idealHoleAcross = pitch * PERF_ALONG_RATIO * PERF_ACROSS_TO_ALONG;
  const idealBand = idealHoleAcross / 0.74 + 16 * scale;
  const minBand = 92 * scale;
  return Math.round(Math.max(minBand, Math.min(maxAllowedThickness, idealBand)));
}

export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawSprocketRow(
  ctx: CanvasRenderingContext2D,
  stripRect: Rect,
  orientation: 'horizontal' | 'vertical',
  holeFill: string,
  scale: number,
  holeCount = FULL_FRAME_SPROCKET_COUNT,
): void {
  const { holes } = computeSprocketHoles(stripRect, orientation, holeCount, scale);
  const radius = Math.max(1.5, 6 * scale);

  ctx.save();
  ctx.fillStyle = holeFill;
  for (const hole of holes) {
    drawRoundedRectPath(ctx, hole.x, hole.y, hole.width, hole.height, radius);
    ctx.fill();
  }
  ctx.restore();
}

export function drawEdgeMarkings(
  ctx: CanvasRenderingContext2D,
  stripRect: Rect,
  orientation: 'horizontal' | 'vertical',
  metadata: PhotoMetadata,
  showFrameNumber: boolean,
  scale: number,
  edgeLabelOverride?: string,
): void {
  const filmLabel = (edgeLabelOverride || metadata.filmStock || 'ANALOG FILM').toUpperCase();
  const frameCode = showFrameNumber && metadata.frameNumber.trim() ? metadata.frameNumber.trim().toUpperCase() : '24A';
  const accent = getFilmAccentColor(metadata.filmStock);
  const fontSize = Math.max(8, 17 * scale);

  ctx.save();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.88;
  ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'middle';

  if (orientation === 'horizontal') {
    const y = stripRect.y + stripRect.height / 2;
    ctx.textAlign = 'left';
    ctx.fillText(`▸ ${filmLabel}`, stripRect.x + 22 * scale, y, stripRect.width * 0.58);
    ctx.textAlign = 'right';
    ctx.fillText(frameCode, stripRect.x + stripRect.width - 22 * scale, y, stripRect.width * 0.3);
  } else {
    const cx = stripRect.x + stripRect.width / 2;
    ctx.translate(cx, stripRect.y + stripRect.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.fillText(`▸ ${filmLabel}`, -stripRect.height / 2 + 22 * scale, 0, stripRect.height * 0.58);
    ctx.textAlign = 'right';
    ctx.fillText(frameCode, stripRect.height / 2 - 22 * scale, 0, stripRect.height * 0.3);
  }

  ctx.restore();
}

export function drawFilmGateNotches(
  ctx: CanvasRenderingContext2D,
  photoRect: Rect,
  notchFill: string,
  scale: number,
): void {
  ctx.save();
  ctx.fillStyle = notchFill;
  const notchW = Math.max(4, 14 * scale);
  const notchH = Math.max(3, 6 * scale);
  const y = photoRect.y - notchH * 0.35;
  ctx.beginPath();
  ctx.roundRect?.(photoRect.x + photoRect.width * 0.14, y, notchW, notchH, 2 * scale);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect?.(photoRect.x + photoRect.width * 0.86 - notchW, y, notchW, notchH, 2 * scale);
  ctx.fill();
  ctx.restore();
}
