import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import {
  FULL_FRAME_SPROCKET_COUNT,
  computeSprocketBandThickness,
  drawFilmDxAndFrameMarkers,
  drawFilmEdgeStockHeader,
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

    const outerTextBand = Math.round(44 * scale);
    const innerGap = Math.round(18 * scale);
    const sidePad = Math.round(28 * scale);
    const roughPhoto = fitRectInBox(rotDims.width, rotDims.height, frameRegion, 150 * scale);
    const estimatedSpan = isLandscape
      ? roughPhoto.width + sidePad * 2
      : roughPhoto.height + sidePad * 2;
    const maxBandThickness = isLandscape
      ? Math.min(185 * scale, frameRegion.height * 0.16)
      : Math.min(185 * scale, frameRegion.width * 0.16);
    const sprocketBand = computeSprocketBandThickness(
      estimatedSpan,
      FULL_FRAME_SPROCKET_COUNT,
      maxBandThickness,
      scale,
    );
    const totalEdgeBand = outerTextBand + sprocketBand + innerGap;

    const innerBox = isLandscape
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

    const stripRect = isLandscape
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
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
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

    if (isLandscape) {
      // Top: film edge code outside sprockets
      drawFilmEdgeStockHeader(
        ctx,
        { x: stripRect.x, y: stripRect.y, width: stripRect.width, height: outerTextBand },
        'horizontal',
        metadata.filmStock,
        scale,
        true,
      );
      drawSprocketRow(
        ctx,
        { x: stripRect.x, y: stripRect.y + outerTextBand, width: stripRect.width, height: sprocketBand },
        'horizontal',
        holeColor,
        scale,
        FULL_FRAME_SPROCKET_COUNT,
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
        FULL_FRAME_SPROCKET_COUNT,
      );
      // Bottom: DX barcode + frame markers outside sprockets
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
      // Left: film edge code outside sprockets
      drawFilmEdgeStockHeader(
        ctx,
        { x: stripRect.x, y: stripRect.y, width: outerTextBand, height: stripRect.height },
        'vertical',
        metadata.filmStock,
        scale,
        true,
      );
      drawSprocketRow(
        ctx,
        { x: stripRect.x + outerTextBand, y: stripRect.y, width: sprocketBand, height: stripRect.height },
        'vertical',
        holeColor,
        scale,
        FULL_FRAME_SPROCKET_COUNT,
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
        FULL_FRAME_SPROCKET_COUNT,
      );
      // Right: DX barcode + frame markers outside sprockets
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

    // Rounded film gate window
    ctx.save();
    drawRoundedRectPath(ctx, photoRect.x, photoRect.y, photoRect.width, photoRect.height, 8 * scale);
    ctx.clip();
    drawRotatedImage(ctx, primaryImage.source, photoRect, primaryImage.rotation);
    ctx.restore();
  },
};
