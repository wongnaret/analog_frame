import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import {
  drawEdgeMarkings,
  drawRoundedRectPath,
  drawSprocketRow,
} from './drawFilmHelpers';
import type { FrameTemplate } from './types';

export const halfFrameSingleTemplate: FrameTemplate = {
  id: 'half-frame-single',
  name: 'Half-Frame',
  shortDescription: 'Vertical 17×24mm single half-frame',
  supportsDiptych: false,
  usesCustomFooter: false,
  render(ctx, { frameRegion, scale, primaryImage, metadata, visibility, palette }) {
    const rotDims = getRotatedDimensions(
      primaryImage.width,
      primaryImage.height,
      primaryImage.rotation,
    );

    const sprocketBand = Math.round(86 * scale);
    const textBand = Math.round(38 * scale);
    const vertPad = Math.round(44 * scale);

    // Vertical 35mm half-frame strip: sprockets along left & right edges
    const innerBox = {
      x: frameRegion.x + sprocketBand + textBand,
      y: frameRegion.y + vertPad,
      width: frameRegion.width - (sprocketBand + textBand) * 2,
      height: frameRegion.height - vertPad * 2,
    };

    const photoRect = fitRectInBox(rotDims.width, rotDims.height, innerBox);

    const stripRect = {
      x: photoRect.x - (sprocketBand + textBand),
      y: photoRect.y - vertPad,
      width: photoRect.width + (sprocketBand + textBand) * 2,
      height: photoRect.height + vertPad * 2,
    };

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
    ctx.shadowBlur = 24 * scale;
    ctx.shadowOffsetY = 8 * scale;
    ctx.fillStyle = '#131314';
    drawRoundedRectPath(ctx, stripRect.x, stripRect.y, stripRect.width, stripRect.height, 8 * scale);
    ctx.fill();
    ctx.restore();

    if (palette.id === 'darkroom') {
      ctx.save();
      ctx.strokeStyle = '#2B2B2E';
      ctx.lineWidth = Math.max(1, 2 * scale);
      drawRoundedRectPath(ctx, stripRect.x, stripRect.y, stripRect.width, stripRect.height, 8 * scale);
      ctx.stroke();
      ctx.restore();
    }

    const holeColor = palette.id === 'darkroom' ? '#070708' : palette.background;

    drawSprocketRow(
      ctx,
      { x: stripRect.x + 10 * scale, y: stripRect.y, width: sprocketBand - 16 * scale, height: stripRect.height },
      'vertical',
      holeColor,
      scale,
    );
    drawSprocketRow(
      ctx,
      {
        x: stripRect.x + stripRect.width - sprocketBand + 6 * scale,
        y: stripRect.y,
        width: sprocketBand - 16 * scale,
        height: stripRect.height,
      },
      'vertical',
      holeColor,
      scale,
    );

    const halfLabel = metadata.filmStock
      ? `${metadata.filmStock} · HALF FRAME`
      : 'HALF FRAME 17×24';
    drawEdgeMarkings(
      ctx,
      { x: photoRect.x - textBand, y: stripRect.y, width: textBand, height: stripRect.height },
      'vertical',
      metadata,
      visibility.showFrameNumber,
      scale,
      halfLabel,
    );
    drawEdgeMarkings(
      ctx,
      { x: photoRect.x + photoRect.width, y: stripRect.y, width: textBand, height: stripRect.height },
      'vertical',
      metadata,
      visibility.showFrameNumber,
      scale,
      halfLabel,
    );

    ctx.save();
    drawRoundedRectPath(ctx, photoRect.x, photoRect.y, photoRect.width, photoRect.height, 6 * scale);
    ctx.clip();
    drawRotatedImage(ctx, primaryImage.source, photoRect, primaryImage.rotation);
    ctx.restore();
  },
};
