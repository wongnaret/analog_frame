import type { MattePalette, MetadataVisibility, PhotoMetadata } from '../types';
import type { Rect } from './layout';

export const DEFAULT_WATERMARK_TEXT = 'ANALOG FRAME';

export interface SplitFooterLines {
  leftPrimary: string;
  leftSecondary: string;
  rightPrimary: string;
  rightSecondary: string;
  captionLine: string;
}

export function formatSplitFooterLines(
  metadata: PhotoMetadata,
  visibility: MetadataVisibility,
): SplitFooterLines {
  const camera = metadata.camera.trim();
  const lens = metadata.lens.trim();
  const artist = visibility.showArtist ? metadata.artist.trim() : '';

  const leftPrimary = (camera || lens).toUpperCase();
  const leftSecondaryParts = camera
    ? [lens, artist].filter(Boolean)
    : [artist].filter(Boolean);

  const rightPrimary = metadata.filmStock.trim().toUpperCase();
  const rightSecondaryParts = [
    metadata.iso.trim() ? `EI ${metadata.iso.trim()}` : '',
    visibility.showDate && metadata.date.trim() ? metadata.date.trim() : '',
    visibility.showFrameNumber && metadata.frameNumber.trim()
      ? `#${metadata.frameNumber.trim()}`
      : '',
  ].filter(Boolean);

  const captionLine =
    visibility.showCaption && metadata.caption.trim()
      ? metadata.caption.trim()
      : '';

  return {
    leftPrimary,
    leftSecondary: leftSecondaryParts.join('  ·  '),
    rightPrimary,
    rightSecondary: rightSecondaryParts.join('  ·  '),
    captionLine,
  };
}

function drawFittedAlignedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  align: CanvasTextAlign,
  fontTemplate: (size: number) => string,
  baseSize: number,
  minSize: number,
): void {
  let size = baseSize;
  ctx.textAlign = align;
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
  const {
    leftPrimary,
    leftSecondary,
    rightPrimary,
    rightSecondary,
    captionLine,
  } = formatSplitFooterLines(metadata, visibility);

  const hasLeft = Boolean(leftPrimary || leftSecondary);
  const hasRight = Boolean(rightPrimary || rightSecondary);

  if (!hasLeft && !hasRight && !captionLine) {
    return;
  }

  ctx.save();
  ctx.textBaseline = 'middle';

  const hasPrimaryRow = Boolean(leftPrimary || rightPrimary);
  const hasSecondaryRow = Boolean(leftSecondary || rightSecondary);
  const splitRowHeight =
    (hasPrimaryRow ? 66 * scale : 0) + (hasSecondaryRow ? 54 * scale : 0);
  const captionHeight = captionLine ? 56 * scale : 0;
  const totalHeight = splitRowHeight + captionHeight;

  let cursorY = footer.y + Math.max(16 * scale, (footer.height - totalHeight) / 2);

  const leftX = footer.x;
  const leftMaxW = footer.width * 0.50;
  const rightX = footer.x + footer.width;
  const rightMaxW = footer.width * 0.46;

  if (hasPrimaryRow) {
    const primaryY = cursorY + 32 * scale;
    if (leftPrimary) {
      ctx.fillStyle = palette.primaryText;
      drawFittedAlignedText(
        ctx,
        leftPrimary,
        leftX,
        primaryY,
        leftMaxW,
        'left',
        (s) => `700 ${s}px "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif`,
        64 * scale,
        30 * scale,
      );
    }
    if (rightPrimary) {
      ctx.fillStyle = palette.primaryText;
      drawFittedAlignedText(
        ctx,
        rightPrimary,
        rightX,
        primaryY,
        rightMaxW,
        'right',
        (s) => `600 ${s}px "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif`,
        56 * scale,
        28 * scale,
      );
    }
    cursorY += 66 * scale;
  }

  if (hasSecondaryRow) {
    const secondaryY = cursorY + 26 * scale;
    if (leftSecondary) {
      ctx.fillStyle = palette.secondaryText;
      drawFittedAlignedText(
        ctx,
        leftSecondary,
        leftX,
        secondaryY,
        leftMaxW,
        'left',
        (s) => `500 ${s}px "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif`,
        40 * scale,
        22 * scale,
      );
    }
    if (rightSecondary) {
      ctx.fillStyle = palette.secondaryText;
      drawFittedAlignedText(
        ctx,
        rightSecondary,
        rightX,
        secondaryY,
        rightMaxW,
        'right',
        (s) => `500 ${s}px "JetBrains Mono", ui-monospace, monospace`,
        34 * scale,
        20 * scale,
      );
    }
    cursorY += 54 * scale;
  }

  if (captionLine) {
    const captionY = cursorY + 28 * scale;
    ctx.fillStyle = palette.secondaryText;
    drawFittedAlignedText(
      ctx,
      `“${captionLine}”`,
      footer.x + footer.width / 2,
      captionY,
      footer.width * 0.92,
      'center',
      (s) => `italic 400 ${s}px "Newsreader", Georgia, serif`,
      38 * scale,
      22 * scale,
    );
  }

  ctx.restore();
}

export function drawFooterWatermark(
  ctx: CanvasRenderingContext2D,
  watermarkRegion: Rect,
  watermarkText: string,
  visible: boolean,
  palette: MattePalette,
  scale: number,
): void {
  const clean = watermarkText.trim();
  if (!visible || !clean) return;

  const label = clean.toUpperCase();
  const fontSize = Math.max(9, 22 * scale);
  const tracking = 4 * scale;

  ctx.save();
  ctx.fillStyle = palette.secondaryText;
  ctx.globalAlpha = 0.45;
  ctx.font = `500 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const chars = Array.from(label);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((acc, w) => acc + w, 0) +
    Math.max(0, chars.length - 1) * tracking;

  const maxWidth = watermarkRegion.width * 0.9;
  const centerY = watermarkRegion.y + watermarkRegion.height / 2;

  if (totalWidth > maxWidth) {
    ctx.textAlign = 'center';
    ctx.fillText(label, watermarkRegion.x + watermarkRegion.width / 2, centerY, maxWidth);
    ctx.restore();
    return;
  }

  let cursorX = watermarkRegion.x + (watermarkRegion.width - totalWidth) / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursorX, centerY);
    cursorX += widths[i] + tracking;
  }

  ctx.restore();
}
