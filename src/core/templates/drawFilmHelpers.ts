import type { PhotoMetadata } from '../types';
import type { Rect } from '../renderer/layout';
import { incrementFrameNumber } from '../exif/parser';
import { getFilmAccentColor } from '../presets/filmStocks';

export const FULL_FRAME_SPROCKET_COUNT = 8;
export const HALF_FRAME_SPROCKET_COUNT = 4;

// ISO 1007 (135 film) standard perforation proportions:
// Pitch = 4.75 mm, width = 1.98 mm (0.417 * pitch), height = 2.80 mm (1.414 * width)
const PERF_ALONG_RATIO = 1.98 / 4.75;
const PERF_ACROSS_TO_ALONG = 2.8 / 1.98;

const FILM_EDGE_CODES: Array<[RegExp, string]> = [
  [/kodak\s+gold\s+200/i, 'KODAK GB 200-7'],
  [/kodak\s+colorplus\s+200/i, 'KODAK 200-7'],
  [/kodak\s+ultramax\s+400/i, 'KODAK GC 400-8'],
  [/kodak\s+portra\s+160/i, 'KODAK PORTRA 160'],
  [/kodak\s+portra\s+400/i, 'KODAK PORTRA 400'],
  [/kodak\s+portra\s+800/i, 'KODAK PORTRA 800'],
  [/kodak\s+ektar\s+100/i, 'KODAK EKTAR 100'],
  [/kodak\s+tri-?x\s+400/i, 'KODAK 400TX'],
  [/kodak\s+vision3\s+250d/i, 'KODAK 5207 250D'],
  [/kodak\s+vision3\s+500t/i, 'KODAK 5219 500T'],
  [/ilford\s+hp5/i, 'ILFORD HP5 PLUS'],
  [/ilford\s+fp4/i, 'ILFORD FP4 PLUS'],
  [/ilford\s+delta\s+400/i, 'ILFORD DELTA 400'],
  [/ilford\s+xp2/i, 'ILFORD XP2 SUPER'],
  [/fuji(?:film)?\s+superia/i, 'FUJI SUPERIA 400'],
  [/fuji(?:film)?\s+c200/i, 'FUJI C200'],
  [/fuji(?:film)?\s+pro\s+400h/i, 'FUJI PRO 400H'],
  [/fuji(?:film)?\s+.*acros/i, 'FUJI ACROS 100II'],
  [/cinestill\s+800t/i, 'CineStill 800T'],
  [/cinestill\s+400d/i, 'CineStill 400D'],
  [/harman\s+phoenix/i, 'HARMAN PHOENIX 200'],
];

export function getFilmEdgeCode(filmStock: string): string {
  const clean = filmStock.trim();
  if (!clean) return 'ANALOG FILM';
  for (const [pattern, code] of FILM_EDGE_CODES) {
    if (pattern.test(clean)) return code;
  }
  return clean.toUpperCase();
}

function isBlackAndWhiteFilm(filmStock: string): boolean {
  return /ilford|hp5|fp4|delta|xp2|tri-?x|400tx|acros|b&w|monochrome/i.test(filmStock);
}

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
      Math.min(bandRect.height * 0.84, holeAlong * PERF_ACROSS_TO_ALONG),
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
    Math.min(bandRect.width * 0.84, holeAlong * PERF_ACROSS_TO_ALONG),
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
  const idealBand = idealHoleAcross / 0.8 + 12 * scale;
  const minBand = 84 * scale;
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
  const { holes, holeAlong, holeAcross } = computeSprocketHoles(
    stripRect,
    orientation,
    holeCount,
    scale,
  );
  // Real 135 perforations have visibly rounded corners (~24-26% of short dimension)
  const radius = Math.max(2 * scale, Math.min(holeAlong, holeAcross) * 0.26);

  ctx.save();
  ctx.fillStyle = holeFill;
  for (const hole of holes) {
    drawRoundedRectPath(ctx, hole.x, hole.y, hole.width, hole.height, radius);
    ctx.fill();
  }
  ctx.restore();
}

function drawDxBarcodeSpan(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  bottomY: number,
  maxBarHeight: number,
  scale: number,
): void {
  const span = endX - startX;
  if (span < 24 * scale) return;

  const pattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0];
  const barW = Math.max(1.5, 4.2 * scale);
  const step = barW * 2.1;
  let idx = 0;

  for (let x = startX; x + barW <= endX; x += step) {
    const bit = pattern[idx % pattern.length];
    const tall = idx % 3 === 0 ? maxBarHeight : maxBarHeight * 0.56;
    if (bit === 1) {
      ctx.fillRect(x, bottomY - tall, barW, tall);
    } else {
      // Lower baseline sync track (matches Kodak DX edge coding)
      ctx.fillRect(x, bottomY - maxBarHeight * 0.24, barW, maxBarHeight * 0.24);
    }
    idx++;
  }
}

export function drawFilmEdgeStockHeader(
  ctx: CanvasRenderingContext2D,
  bandRect: Rect,
  orientation: 'horizontal' | 'vertical',
  filmStock: string,
  scale: number,
  repeatTwice = false,
): void {
  const edgeCode = getFilmEdgeCode(filmStock);
  const accent = getFilmAccentColor(filmStock);
  const fontSize = Math.max(8, 21 * scale);

  ctx.save();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  if (orientation === 'horizontal') {
    const y = bandRect.y + bandRect.height / 2;
    if (repeatTwice) {
      ctx.fillText(edgeCode, bandRect.x + bandRect.width * 0.25, y, bandRect.width * 0.42);
      ctx.fillText(edgeCode, bandRect.x + bandRect.width * 0.75, y, bandRect.width * 0.42);
    } else {
      ctx.fillText(edgeCode, bandRect.x + bandRect.width * 0.5, y, bandRect.width * 0.86);
    }
  } else {
    const x = bandRect.x + bandRect.width / 2;
    if (repeatTwice) {
      for (const frac of [0.25, 0.75]) {
        ctx.save();
        ctx.translate(x, bandRect.y + bandRect.height * frac);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(edgeCode, 0, 0, bandRect.height * 0.42);
        ctx.restore();
      }
    } else {
      ctx.save();
      ctx.translate(x, bandRect.y + bandRect.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(edgeCode, 0, 0, bandRect.height * 0.86);
      ctx.restore();
    }
  }

  ctx.restore();
}

export function drawFilmDxAndFrameMarkers(
  ctx: CanvasRenderingContext2D,
  bandRect: Rect,
  orientation: 'horizontal' | 'vertical',
  metadata: PhotoMetadata,
  showFrameNumber: boolean,
  scale: number,
  slotCount: 1 | 2,
): void {
  const accent = getFilmAccentColor(metadata.filmStock);
  const showDx = !isBlackAndWhiteFilm(metadata.filmStock);
  const fontSize = Math.max(8, 20 * scale);
  const rawFrame = metadata.frameNumber.trim().toUpperCase() || '01A';
  const baseNum = rawFrame.replace(/[A-Z]+$/, '');
  const nextFrame = incrementFrameNumber(rawFrame);
  const nextBaseNum = nextFrame.replace(/[A-Z]+$/, '');

  ctx.save();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'middle';

  const renderAlongHorizontalAxis = (rect: Rect) => {
    const midY = rect.y + rect.height / 2;
    const bottomY = rect.y + rect.height - 6 * scale;
    const barH = Math.max(6, rect.height * 0.46);

    if (slotCount === 2) {
      const f1 = `${rawFrame} ▸`;
      const f2 = `${nextFrame} ▸`;
      if (showFrameNumber) {
        ctx.textAlign = 'center';
        ctx.fillText(f1, rect.x + rect.width * 0.25, midY, rect.width * 0.2);
        ctx.fillText(f2, rect.x + rect.width * 0.75, midY, rect.width * 0.2);
      }
      if (showDx) {
        ctx.globalAlpha = 0.72;
        drawDxBarcodeSpan(ctx, rect.x + 28 * scale, rect.x + rect.width * 0.16, bottomY, barH, scale);
        drawDxBarcodeSpan(ctx, rect.x + rect.width * 0.34, rect.x + rect.width * 0.66, bottomY, barH, scale);
        drawDxBarcodeSpan(ctx, rect.x + rect.width * 0.84, rect.x + rect.width - 28 * scale, bottomY, barH, scale);
      }
      return;
    }

    if (showFrameNumber) {
      ctx.textAlign = 'left';
      ctx.fillText(baseNum, rect.x + 28 * scale, midY, rect.width * 0.14);
      ctx.textAlign = 'center';
      ctx.fillText(`${rawFrame} ▸`, rect.x + rect.width * 0.5, midY, rect.width * 0.24);
      ctx.textAlign = 'right';
      ctx.fillText(nextBaseNum, rect.x + rect.width - 28 * scale, midY, rect.width * 0.14);
    }
    if (showDx) {
      ctx.globalAlpha = 0.72;
      drawDxBarcodeSpan(ctx, rect.x + rect.width * 0.16, rect.x + rect.width * 0.38, bottomY, barH, scale);
      drawDxBarcodeSpan(ctx, rect.x + rect.width * 0.62, rect.x + rect.width * 0.84, bottomY, barH, scale);
    }
  };

  if (orientation === 'horizontal') {
    renderAlongHorizontalAxis(bandRect);
  } else {
    ctx.translate(bandRect.x + bandRect.width / 2, bandRect.y + bandRect.height / 2);
    ctx.rotate(-Math.PI / 2);
    renderAlongHorizontalAxis({
      x: -bandRect.height / 2,
      y: -bandRect.width / 2,
      width: bandRect.height,
      height: bandRect.width,
    });
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
  const filmLabel = (edgeLabelOverride || getFilmEdgeCode(metadata.filmStock)).toUpperCase();
  const frameCode = showFrameNumber
    ? (metadata.frameNumber.trim().toUpperCase() || '01A')
    : '';
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
    if (frameCode) {
      ctx.textAlign = 'right';
      ctx.fillText(frameCode, stripRect.x + stripRect.width - 22 * scale, y, stripRect.width * 0.3);
    }
  } else {
    const cx = stripRect.x + stripRect.width / 2;
    ctx.translate(cx, stripRect.y + stripRect.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.fillText(`▸ ${filmLabel}`, -stripRect.height / 2 + 22 * scale, 0, stripRect.height * 0.58);
    if (frameCode) {
      ctx.textAlign = 'right';
      ctx.fillText(frameCode, stripRect.height / 2 - 22 * scale, 0, stripRect.height * 0.3);
    }
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
