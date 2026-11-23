import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import {
  drawEdgeMarkings,
  drawRoundedRectPath,
  drawSprocketRow,
} from './drawFilmHelpers';
import type { FrameTemplate } from './types';

export const filmStrip35mmTemplate: FrameTemplate = {
  id: '35mm-sprocket',
  name: '35mm Strip',
  shortDescription: 'Sprocket holes & edge markings',
  supportsDiptych: false,
  usesCustomFooter: false,
  render(ctx, { frameRegion, scale, primaryImage, metadata, visibility, palette }) {
    const rotDims = getRotatedDimensions(
      primaryImage.width,
      primaryImage.height,
      primaryImage.rotation,
    );
    const isLandscape = rotDims.width >= rotDims.height;

    const sprocketBand = Math.round(92 * scale);
    const textBand = Math.round(40 * scale);
    const sidePad = Math.round(28 * scale);

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
        { x: stripRect.x, y: stripRect.y + 10 * scale, width: stripRect.width, height: sprocketBand - 16 * scale },
        'horizontal',
        holeColor,
        scale,
      );
      drawSprocketRow(
        ctx,
        {
          x: stripRect.x,
          y: stripRect.y + stripRect.height - sprocketBand + 6 * scale,
          width: stripRect.width,
          height: sprocketBand - 16 * scale,
        },
        'horizontal',
        holeColor,
        scale,
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
