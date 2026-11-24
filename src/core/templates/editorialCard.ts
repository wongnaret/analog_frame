import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import { getFilmAccentColor } from '../presets/filmStocks';
import type { FrameTemplate } from './types';

export const editorialCardTemplate: FrameTemplate = {
  id: 'editorial-card',
  name: 'Editorial Card',
  shortDescription: 'Archival spec sheet & bold typography',
  supportsDiptych: false,
  usesCustomFooter: true,
  render(ctx, { frameRegion, scale, primaryImage, metadata, visibility, palette }) {
    const rotDims = getRotatedDimensions(
      primaryImage.width,
      primaryImage.height,
      primaryImage.rotation,
    );

    const cardPad = Math.round(36 * scale);
    const specBlockH = Math.round(380 * scale);

    const innerPhotoBox = {
      x: frameRegion.x + cardPad,
      y: frameRegion.y + cardPad,
      width: frameRegion.width - cardPad * 2,
      height: Math.max(120, frameRegion.height - cardPad * 2 - specBlockH),
    };

    const photoRect = fitRectInBox(rotDims.width, rotDims.height, innerPhotoBox);

    // Card bounds closely wrap the fitted photo width (with minimum readable width)
    const minCardWidth = Math.min(frameRegion.width, Math.round(frameRegion.width * 0.78));
    const cardWidth = Math.max(photoRect.width + cardPad * 2, minCardWidth);
    const cardX = frameRegion.x + (frameRegion.width - cardWidth) / 2;
    const cardY = photoRect.y - cardPad;
    const cardHeight = photoRect.height + cardPad * 2 + specBlockH;

    // Archival card surface
    ctx.save();
    ctx.shadowColor =
      palette.id === 'darkroom' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 32 * scale;
    ctx.shadowOffsetY = 10 * scale;
    ctx.fillStyle = palette.id === 'white' ? '#F7F4ED' : palette.cardBg;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = palette.hairline;
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
    ctx.restore();

    // Draw photo
    drawRotatedImage(ctx, primaryImage.source, photoRect, primaryImage.rotation);

    // Spec typography block below photo
    const specLeft = cardX + cardPad;
    const specWidth = cardWidth - cardPad * 2;
    let cursorY = photoRect.y + photoRect.height + 42 * scale;

    // Film brand accent rule
    ctx.save();
    ctx.fillStyle = getFilmAccentColor(metadata.filmStock);
    ctx.fillRect(specLeft, cursorY - 20 * scale, Math.round(74 * scale), Math.round(6 * scale));

    // Title (Camera or Film)
    const headline = (metadata.filmStock.trim() || metadata.camera.trim() || 'ANALOG ARCHIVE').toUpperCase();
    ctx.fillStyle = palette.primaryText;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let titleSize = 52 * scale;
    ctx.font = `700 ${titleSize}px "Space Grotesk", sans-serif`;
    while (titleSize > 24 * scale && ctx.measureText(headline).width > specWidth) {
      titleSize -= 2;
      ctx.font = `700 ${titleSize}px "Space Grotesk", sans-serif`;
    }
    ctx.fillText(headline, specLeft, cursorY, specWidth);
    cursorY += titleSize + 20 * scale;

    // 2-column spec rows
    const specs: Array<[string, string]> = [
      ['CAMERA', metadata.camera.trim() || '—'],
      ['LENS', metadata.lens.trim() || '—'],
      ['EXPOSURE', metadata.iso.trim() ? `ISO ${metadata.iso.trim()}` : '—'],
    ];

    if (metadata.scanner?.trim()) {
      specs.push(['SCANNER', metadata.scanner.trim()]);
    }

    if (visibility.showDate && metadata.date.trim()) {
      specs.push(['DATE', metadata.date.trim()]);
    }
    if (visibility.showArtist && metadata.artist.trim()) {
      specs.push(['ARTIST', metadata.artist.trim()]);
    }
    if (visibility.showFrameNumber && metadata.frameNumber.trim()) {
      specs.push(['FRAME', `#${metadata.frameNumber.trim()}`]);
    }

    const rowFontSize = Math.max(13, 28 * scale);
    const rowStep = rowFontSize + 16 * scale;
    const colGap = 24 * scale;
    const colWidth = (specWidth - colGap) / 2;

    specs.slice(0, 6).forEach(([label, value], idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = specLeft + col * (colWidth + colGap);
      const y = cursorY + row * rowStep;

      ctx.fillStyle = palette.secondaryText;
      ctx.font = `600 ${Math.round(rowFontSize * 0.78)}px "JetBrains Mono", monospace`;
      ctx.fillText(label, x, y);

      const labelW = ctx.measureText(label).width + 14 * scale;
      ctx.fillStyle = palette.primaryText;
      ctx.font = `500 ${rowFontSize}px "JetBrains Mono", monospace`;
      ctx.fillText(value, x + labelW, y - 2 * scale, Math.max(40, colWidth - labelW));
    });

    if (visibility.showCaption && metadata.caption.trim()) {
      const captionY = cursorY + Math.ceil(Math.min(specs.length, 6) / 2) * rowStep + 10 * scale;
      ctx.fillStyle = palette.secondaryText;
      ctx.font = `italic 400 ${Math.round(23 * scale)}px "Newsreader", Georgia, serif`;
      ctx.fillText(`“${metadata.caption.trim()}”`, specLeft, captionY, specWidth);
    }

    ctx.restore();
  },
};
