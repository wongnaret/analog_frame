import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import {
  HALF_FRAME_SPROCKET_COUNT,
  computeSprocketBandThickness,
  drawFilmDxAndFrameMarkers,
  drawFilmEdgeStockHeader,
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

    const outerTextBand = Math.round(44 * scale);
    const innerGap = Math.round(18 * scale);
    const sidePad = Math.round(28 * scale);
    const roughPhoto = fitRectInBox(rotDims.width, rotDims.height, frameRegion, 160 * scale);
    const estimatedSpan = sprocketsTopBottom
      ? roughPhoto.width + sidePad * 2
      : roughPhoto.height + sidePad * 2;
    const maxBandThickness = sprocketsTopBottom
      ? Math.min(205 * scale, frameRegion.height * 0.155)
      : Math.min(205 * scale, frameRegion.width * 0.155);
    const sprocketBand = computeSprocketBandThickness(
      estimatedSpan,
      HALF_FRAME_SPROCKET_COUNT,
      maxBandThickness,
      scale,
    );
    const totalEdgeBand = outerTextBand + sprocketBand + innerGap;

    const innerBox = sprocketsTopBottom
      ? {
          x: frameRegion.x + sidePad,
          y: frameRegion.y + totalEdgeBand,
          width: frameRegion.width - sidePad * 2,
          height: frameRegion.height - totalEdgeBand * 2,
        }
      : {
          x: frameRegion.x + totalEdgeBand,
          y: frameRegion.y + sidePad,
          width: frameRegion.width - totalEdgeBand * 2,
          height: frameRegion.height - sidePad * 2,
        };

    const photoRect = fitRectInBox(rotDims.width, rotDims.height, innerBox);

    const stripRect = sprocketsTopBottom
      ? {
          x: photoRect.x - sidePad,
          y: photoRect.y - totalEdgeBand,
          width: photoRect.width + sidePad * 2,
          height: photoRect.height + totalEdgeBand * 2,
        }
      : {
          x: photoRect.x - totalEdgeBand,
          y: photoRect.y - sidePad,
          width: photoRect.width + totalEdgeBand * 2,
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

    if (sprocketsTopBottom) {
      drawFilmEdgeStockHeader(
        ctx,
        { x: stripRect.x, y: stripRect.y, width: stripRect.width, height: outerTextBand },
        'horizontal',
        metadata.filmStock,
        scale,
        false,
      );
      drawSprocketRow(
        ctx,
        { x: stripRect.x, y: stripRect.y + outerTextBand, width: stripRect.width, height: sprocketBand },
        'horizontal',
        holeColor,
        scale,
        HALF_FRAME_SPROCKET_COUNT,
      );
      drawSprocketRow(
        ctx,
        {
          x: stripRect.x,
          y: stripRect.y + stripRect.height - outerTextBand - sprocketBand,
          width: stripRect.width,
          height: sprocketBand,
        },
        'horizontal',
        holeColor,
        scale,
        HALF_FRAME_SPROCKET_COUNT,
      );
      drawFilmDxAndFrameMarkers(
        ctx,
        {
          x: stripRect.x,
          y: stripRect.y + stripRect.height - outerTextBand,
          width: stripRect.width,
          height: outerTextBand,
        },
        'horizontal',
        metadata,
        visibility.showFrameNumber,
        scale,
        1,
      );
    } else {
      drawFilmEdgeStockHeader(
        ctx,
        { x: stripRect.x, y: stripRect.y, width: outerTextBand, height: stripRect.height },
        'vertical',
        metadata.filmStock,
        scale,
        false,
      );
      drawSprocketRow(
        ctx,
        { x: stripRect.x + outerTextBand, y: stripRect.y, width: sprocketBand, height: stripRect.height },
        'vertical',
        holeColor,
        scale,
        HALF_FRAME_SPROCKET_COUNT,
      );
      drawSprocketRow(
        ctx,
        {
          x: stripRect.x + stripRect.width - outerTextBand - sprocketBand,
          y: stripRect.y,
          width: sprocketBand,
          height: stripRect.height,
        },
        'vertical',
        holeColor,
        scale,
        HALF_FRAME_SPROCKET_COUNT,
      );
      drawFilmDxAndFrameMarkers(
        ctx,
        {
          x: stripRect.x + stripRect.width - outerTextBand,
          y: stripRect.y,
          width: outerTextBand,
          height: stripRect.height,
        },
        'vertical',
        metadata,
        visibility.showFrameNumber,
        scale,
        1,
      );
    }

    ctx.save();
    drawRoundedRectPath(ctx, photoRect.x, photoRect.y, photoRect.width, photoRect.height, 6 * scale);
    ctx.clip();
    drawRotatedImage(ctx, primaryImage.source, photoRect, primaryImage.rotation);
    ctx.restore();
  },
};
