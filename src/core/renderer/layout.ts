import type { AspectRatioId, RotationDegrees } from '../types';
import { getAspectRatioPreset } from '../presets/aspectRatios';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasLayout {
  width: number;
  height: number;
  scale: number;
  outerRect: Rect;
  frameRegion: Rect;
  footerRegion: Rect;
}

export function getRotatedDimensions(
  width: number,
  height: number,
  rotation: RotationDegrees,
): { width: number; height: number } {
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

export function fitRectInBox(
  sourceWidth: number,
  sourceHeight: number,
  box: Rect,
  padding = 0,
): Rect {
  const safeW = Math.max(1, box.width - padding * 2);
  const safeH = Math.max(1, box.height - padding * 2);
  const srcW = Math.max(1, sourceWidth);
  const srcH = Math.max(1, sourceHeight);

  const scale = Math.min(safeW / srcW, safeH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;

  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  };
}

export function computeCanvasLayout(
  aspectRatioId: AspectRatioId,
  scale = 1,
  usesCustomFooter = false,
): CanvasLayout {
  const preset = getAspectRatioPreset(aspectRatioId);
  const width = Math.round(preset.width * scale);
  const height = Math.round(preset.height * scale);

  const sideMargin = Math.round(width * 0.068);
  const topMargin = Math.round(height * (aspectRatioId === '9:16' ? 0.08 : 0.058));
  const bottomMargin = Math.round(height * (aspectRatioId === '9:16' ? 0.075 : 0.042));

  const footerHeight = usesCustomFooter
    ? Math.round(height * 0.015)
    : Math.round(Math.max(210 * scale, height * 0.115));

  const frameRegion: Rect = {
    x: sideMargin,
    y: topMargin,
    width: width - sideMargin * 2,
    height: Math.max(100, height - topMargin - bottomMargin - footerHeight),
  };

  const footerRegion: Rect = {
    x: sideMargin,
    y: frameRegion.y + frameRegion.height + Math.round(14 * scale),
    width: width - sideMargin * 2,
    height: Math.max(0, height - (frameRegion.y + frameRegion.height) - bottomMargin),
  };

  return {
    width,
    height,
    scale,
    outerRect: { x: 0, y: 0, width, height },
    frameRegion,
    footerRegion,
  };
}

export function drawRotatedImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  destRect: Rect,
  rotation: RotationDegrees,
): void {
  ctx.save();
  const cx = destRect.x + destRect.width / 2;
  const cy = destRect.y + destRect.height / 2;
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);

  const drawW = rotation === 90 || rotation === 270 ? destRect.height : destRect.width;
  const drawH = rotation === 90 || rotation === 270 ? destRect.width : destRect.height;

  ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}
