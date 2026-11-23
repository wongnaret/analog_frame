import type { PhotoMetadata } from '../types';
import type { Rect } from '../renderer/layout';
import { getFilmAccentColor } from '../presets/filmStocks';

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
): void {
  ctx.save();
  ctx.fillStyle = holeFill;

  if (orientation === 'horizontal') {
    const holeW = Math.max(4, stripRect.height * 0.42);
    const holeH = Math.max(5, stripRect.height * 0.56);
    const step = holeW * 2.05;
    const radius = Math.max(1.5, 4 * scale);
    const startOffset = ((stripRect.width % step) + step * 0.5) / 2;
    const yTop = stripRect.y + (stripRect.height - holeH) / 2;

    for (let x = stripRect.x + startOffset; x + holeW <= stripRect.x + stripRect.width - 8 * scale; x += step) {
      drawRoundedRectPath(ctx, x, yTop, holeW, holeH, radius);
      ctx.fill();
    }
  } else {
    const holeW = Math.max(5, stripRect.width * 0.56);
    const holeH = Math.max(4, stripRect.width * 0.42);
    const step = holeH * 2.05;
    const radius = Math.max(1.5, 4 * scale);
    const startOffset = ((stripRect.height % step) + step * 0.5) / 2;
    const xLeft = stripRect.x + (stripRect.width - holeW) / 2;

    for (let y = stripRect.y + startOffset; y + holeH <= stripRect.y + stripRect.height - 8 * scale; y += step) {
      drawRoundedRectPath(ctx, xLeft, y, holeW, holeH, radius);
      ctx.fill();
    }
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
