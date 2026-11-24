import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import {
  HALF_FRAME_SPROCKET_COUNT,
  computeSprocketBandThickness,
  drawEdgeMarkings,
  drawRoundedRectPath,
  drawSprocketRow,
} from './drawFilmHelpers';
import type { FrameTemplate } from './types';

export const halfFrameSingleTemplate: FrameTemplate = {
  id: 'half-frame-single',
  name: 'Half-Frame',
  shortDescription: '4-perf 17×24mm single half-frame',
  supportsDiptych: false,
  usesCustomFooter: false,
  render(ctx, { frameRegion, scale, primaryImage, metadata, visibility, palette }) {
    const rotDims = getRotatedDimensions(
      primaryImage.width,
      primaryImage.height,
      primaryImage.rotation,
    );
    // On real 35mm half-frame film, the 4 perforations always sit along the 17-18mm short edge
    const sprocketsTopBottom = rotDims.height >= rotDims.width;

    const textBand = Math.round(42 * scale);
    const sidePad = Math.round(28 * scale);
    const roughPhoto = fitRectInBox(rotDims.width, rotDims.height, frameRegion, 160 * scale);
    const estimatedSpan = sprocketsTopBottom
      ? roughPhoto.width + sidePad * 2
      : roughPhoto.height + sidePad * 2;
    const maxBandThickness = sprocketsTopBottom
      ? Math.min(220 * scale, frameRegion.height * 0.17)
      : Math.min(220 * scale, frameRegion.width * 0.17);
    const sprocketBand = computeSprocketBandThickness(
      estimatedSpan,
      HALF_FRAME_SPROCKET_COUNT,
      maxBandThickness,
      scale,
    );

    const innerBox = sprocketsTopBottom
      ? {
          x: frameRegion.x + sidePad,
          y: frameRegion.y + sprocketBand + textBand,
          width: frameRegion.width - sidePad * 2,
          height: frameRegion.height - (sprocketBand + textBand) * 2,
        }
      : {
          x: frameRegion.x + sprocketBand + textBand,
          y: frameRegion.y + sidePad,
          width: frameRegion.width - (sprocketBand + textBand) * 2,
          height: frameRegion.height - sidePad * 2,
        };

    const photoRect = fitRectInBox(rotDims.width, rotDims.height, innerBox);

    const stripRect = sprocketsTopBottom
      ? {
          x: photoRect.x - sidePad,
          y: photoRect.y - (sprocketBand + textBand),
          width: photoRect.width + sidePad * 2,
          height: photoRect.height + (sprocketBand + textBand) * 2,
        }
      : {
          x: photoRect.x - (sprocketBand + textBand),
          y: photoRect.y - sidePad,
          width: photoRect.width + (sprocketBand + textBand) * 2,
          height: photoRect.height + sidePad * 2,
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
    const halfLabel = metadata.filmStock
      ? `${metadata.filmStock} · HALF`
      : 'HALF FRAME 17×24';

    if (sprocketsTopBottom) {
      drawSprocketRow(
        ctx,
        { x: stripRect.x, y: stripRect.y + 10 * scale, width: stripRect.width, height: sprocketBand - 14 * scale },
        'horizontal',
        holeColor,
        scale,
        HALF_FRAME_SPROCKET_COUNT,
      );
      drawSprocketRow(
        ctx,
        {
          x: stripRect.x,
          y: stripRect.y + stripRect.height - sprocketBand + 4 * scale,
          width: stripRect.width,
          height: sprocketBand - 14 * scale,
        },
        'horizontal',
        holeColor,
        scale,
        HALF_FRAME_SPROCKET_COUNT,
      );
      drawEdgeMarkings(
        ctx,
        { x: stripRect.x, y: photoRect.y - textBand, width: stripRect.width, height: textBand },
        'horizontal',
        metadata,
        visibility.showFrameNumber,
        scale,
        halfLabel,
      );
      drawEdgeMarkings(
        ctx,
        { x: stripRect.x, y: photoRect.y + photoRect.height, width: stripRect.width, height: textBand },
        'horizontal',
        metadata,
        visibility.showFrameNumber,
        scale,
        halfLabel,
      );
    } else {
      drawSprocketRow(
        ctx,
        { x: stripRect.x + 10 * scale, y: stripRect.y, width: sprocketBand - 14 * scale, height: stripRect.height },
        'vertical',
        holeColor,
        scale,
        HALF_FRAME_SPROCKET_COUNT,
      );
      drawSprocketRow(
        ctx,
        {
          x: stripRect.x + stripRect.width - sprocketBand + 4 * scale,
          y: stripRect.y,
          width: sprocketBand - 14 * scale,
          height: stripRect.height,
        },
        'vertical',
        holeColor,
        scale,
        HALF_FRAME_SPROCKET_COUNT,
      );
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
    }

    ctx.save();
    drawRoundedRectPath(ctx, photoRect.x, photoRect.y, photoRect.width, photoRect.height, 6 * scale);
    ctx.clip();
    drawRotatedImage(ctx, primaryImage.source, photoRect, primaryImage.rotation);
    ctx.restore();
  },
};
