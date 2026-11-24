import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import {
  FULL_FRAME_SPROCKET_COUNT,
  computeSprocketBandThickness,
  drawEdgeMarkings,
  drawRoundedRectPath,
  drawSprocketRow,
} from './drawFilmHelpers';
import type { FrameTemplate } from './types';

export const filmStrip35mmTemplate: FrameTemplate = {
  id: '35mm-sprocket',
  name: '35mm Strip',
  shortDescription: '8-perf full-frame strip & edge markings',
  supportsDiptych: false,
  usesCustomFooter: false,
  render(ctx, { frameRegion, scale, primaryImage, metadata, visibility, palette }) {
    const rotDims = getRotatedDimensions(
      primaryImage.width,
      primaryImage.height,
      primaryImage.rotation,
    );
    const isLandscape = rotDims.width >= rotDims.height;

    const textBand = Math.round(42 * scale);
    const sidePad = Math.round(28 * scale);
    const roughPhoto = fitRectInBox(rotDims.width, rotDims.height, frameRegion, 150 * scale);
    const estimatedSpan = isLandscape
      ? roughPhoto.width + sidePad * 2
      : roughPhoto.height + sidePad * 2;
    const maxBandThickness = isLandscape
      ? Math.min(200 * scale, frameRegion.height * 0.18)
      : Math.min(200 * scale, frameRegion.width * 0.18);
    const sprocketBand = computeSprocketBandThickness(
      estimatedSpan,
      FULL_FRAME_SPROCKET_COUNT,
      maxBandThickness,
      scale,
    );

    // Reserve sprocket + marking bands around the photo area to derive strip dimensions
    const innerBox = isLandscape
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

    const stripRect = isLandscape
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
    // Drop shadow subtly separates black film strip on light mattes
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = 24 * scale;
    ctx.shadowOffsetY = 8 * scale;
    ctx.fillStyle = '#131314';
    drawRoundedRectPath(ctx, stripRect.x, stripRect.y, stripRect.width, stripRect.height, 8 * scale);
    ctx.fill();
    ctx.restore();

    // Subtle film sheen border if outer matte is darkroom black
    if (palette.id === 'darkroom') {
      ctx.save();
      ctx.strokeStyle = '#2B2B2E';
      ctx.lineWidth = Math.max(1, 2 * scale);
      drawRoundedRectPath(ctx, stripRect.x, stripRect.y, stripRect.width, stripRect.height, 8 * scale);
      ctx.stroke();
      ctx.restore();
    }

    const holeColor = palette.id === 'darkroom' ? '#070708' : palette.background;

    if (isLandscape) {
      drawSprocketRow(
        ctx,
        { x: stripRect.x, y: stripRect.y + 10 * scale, width: stripRect.width, height: sprocketBand - 14 * scale },
        'horizontal',
        holeColor,
        scale,
        FULL_FRAME_SPROCKET_COUNT,
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
        FULL_FRAME_SPROCKET_COUNT,
      );
      drawEdgeMarkings(
        ctx,
        { x: stripRect.x, y: photoRect.y - textBand, width: stripRect.width, height: textBand },
        'horizontal',
        metadata,
        visibility.showFrameNumber,
        scale,
      );
      drawEdgeMarkings(
        ctx,
        { x: stripRect.x, y: photoRect.y + photoRect.height, width: stripRect.width, height: textBand },
        'horizontal',
        metadata,
        visibility.showFrameNumber,
        scale,
      );
    } else {
      drawSprocketRow(
        ctx,
        { x: stripRect.x + 10 * scale, y: stripRect.y, width: sprocketBand - 14 * scale, height: stripRect.height },
        'vertical',
        holeColor,
        scale,
        FULL_FRAME_SPROCKET_COUNT,
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
        FULL_FRAME_SPROCKET_COUNT,
      );
      drawEdgeMarkings(
        ctx,
        { x: photoRect.x - textBand, y: stripRect.y, width: textBand, height: stripRect.height },
        'vertical',
        metadata,
        visibility.showFrameNumber,
        scale,
      );
      drawEdgeMarkings(
        ctx,
        { x: photoRect.x + photoRect.width, y: stripRect.y, width: textBand, height: stripRect.height },
        'vertical',
        metadata,
        visibility.showFrameNumber,
        scale,
      );
    }

    // Rounded film gate window
    ctx.save();
    drawRoundedRectPath(ctx, photoRect.x, photoRect.y, photoRect.width, photoRect.height, 8 * scale);
    ctx.clip();
    drawRotatedImage(ctx, primaryImage.source, photoRect, primaryImage.rotation);
    ctx.restore();
  },
};
