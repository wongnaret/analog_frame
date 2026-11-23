import type { MattePalette, MetadataVisibility, PhotoMetadata } from '../types';
import type { Rect } from './layout';

export function formatFooterLines(
  metadata: PhotoMetadata,
  visibility: MetadataVisibility,
): {
  primaryLine: string;
  filmLine: string;
  detailLine: string;
  captionLine: string;
} {
  const primaryParts = [metadata.camera.trim(), metadata.lens.trim()].filter(Boolean);
  const filmParts = [
    metadata.filmStock.trim(),
    metadata.iso.trim() ? `EI ${metadata.iso.trim()}` : '',
  ].filter(Boolean);

  const detailParts: string[] = [];
  if (visibility.showDate && metadata.date.trim()) {
    detailParts.push(metadata.date.trim());
  }
  if (visibility.showArtist && metadata.artist.trim()) {
    detailParts.push(metadata.artist.trim());
  }
  if (visibility.showFrameNumber && metadata.frameNumber.trim()) {
    detailParts.push(`#${metadata.frameNumber.trim()}`);
  }

  const captionLine =
    visibility.showCaption && metadata.caption.trim() ? metadata.caption.trim() : '';

  return {
    primaryLine: primaryParts.join('  ·  ').toUpperCase(),
    filmLine: filmParts.join('  ·  ').toUpperCase(),
    detailLine: detailParts.join('  ·  '),
    captionLine,
  };
}

function drawFittedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontTemplate: (size: number) => string,
  baseSize: number,
  minSize: number,
): void {
  let size = baseSize;
  ctx.font = fontTemplate(size);
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1.5;
    ctx.font = fontTemplate(size);
  }
  ctx.fillText(text, x, y, maxWidth);
}

export function drawOuterTypography(
  ctx: CanvasRenderingContext2D,
  footer: Rect,
  metadata: PhotoMetadata,
  visibility: MetadataVisibility,
  palette: MattePalette,
  scale: number,
): void {
  const { primaryLine, filmLine, detailLine, captionLine } = formatFooterLines(
    metadata,
    visibility,
  );

  if (!primaryLine && !filmLine && !detailLine && !captionLine) {
    return;
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const centerX = footer.x + footer.width / 2;
  const maxWidth = footer.width * 0.94;

  // Compute total stack height to center cleanly inside footerRegion
  const primaryGap = primaryLine ? 42 * scale : 0;
  const filmGap = filmLine ? 34 * scale : 0;
  const detailGap = detailLine ? 28 * scale : 0;
  const captionGap = captionLine ? 34 * scale : 0;
  const totalHeight = primaryGap + filmGap + detailGap + captionGap;

  let cursorY = footer.y + Math.max(14 * scale, (footer.height - totalHeight) / 2);

  if (primaryLine) {
    cursorY += 18 * scale;
    ctx.fillStyle = palette.primaryText;
    drawFittedCenteredText(
      ctx,
      primaryLine,
      centerX,
      cursorY,
      maxWidth,
      (s) => `600 ${s}px "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif`,
      34 * scale,
      18 * scale,
    );
    cursorY += 24 * scale;
  }

  if (filmLine) {
    cursorY += 14 * scale;
    ctx.fillStyle = palette.secondaryText;
    drawFittedCenteredText(
      ctx,
      filmLine,
      centerX,
      cursorY,
      maxWidth,
      (s) => `500 ${s}px "JetBrains Mono", ui-monospace, monospace`,
      24 * scale,
      14 * scale,
    );
    cursorY += 20 * scale;
  }

  if (detailLine) {
    cursorY += 12 * scale;
    ctx.fillStyle = palette.secondaryText;
    drawFittedCenteredText(
      ctx,
      detailLine,
      centerX,
      cursorY,
      maxWidth,
      (s) => `400 ${s}px "JetBrains Mono", ui-monospace, monospace`,
      20 * scale,
      12 * scale,
    );
    cursorY += 16 * scale;
  }

  if (captionLine) {
    cursorY += 16 * scale;
    ctx.fillStyle = palette.primaryText;
    drawFittedCenteredText(
      ctx,
      `“${captionLine}”`,
      centerX,
      cursorY,
      maxWidth,
      (s) => `italic 400 ${s}px "Newsreader", Georgia, serif`,
      26 * scale,
      14 * scale,
    );
  }

  ctx.restore();
}
