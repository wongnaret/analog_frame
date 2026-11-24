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

export const halfFrameDiptychTemplate: FrameTemplate = {
  id: 'half-frame-diptych',
  name: 'Half-Frame Diptych',
  shortDescription: '8-perf dual half-frame 35mm diptych',
  supportsDiptych: true,
  usesCustomFooter: false,
  render(ctx, { frameRegion, scale, primaryImage, secondaryImage, metadata, visibility, palette }) {
    const outerTextBand = Math.round(44 * scale);
    const innerGap = Math.round(18 * scale);
    // Keep sidePad = septumGap / 2 so 4 perforations align cleanly over each half-frame
    const septumGap = Math.round(28 * scale);
    const sidePad = Math.round(septumGap / 2);

    const maxStripW = frameRegion.width;
    const maxStripH = Math.min(frameRegion.height, Math.round(frameRegion.width * 0.86));
    const sprocketBand = computeSprocketBandThickness(
      maxStripW,
      FULL_FRAME_SPROCKET_COUNT,
      Math.min(185 * scale, maxStripH * 0.16),
      scale,
    );
    const totalEdgeBand = outerTextBand + sprocketBand + innerGap;

    const stripW = maxStripW;
    const stripH = maxStripH;
    const stripX = frameRegion.x + (frameRegion.width - stripW) / 2;
    const stripY = frameRegion.y + (frameRegion.height - stripH) / 2;

    const stripRect = { x: stripX, y: stripY, width: stripW, height: stripH };

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

    // Top: film edge code repeated cleanly over both half-frames
    drawFilmEdgeStockHeader(
      ctx,
      { x: stripRect.x, y: stripRect.y, width: stripRect.width, height: outerTextBand },
      'horizontal',
      metadata.filmStock,
      scale,
      true,
    );

    // Top & bottom 8-perf sprocket rows (4 perforations per half-frame)
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

    // Bottom: sequential frame numbers (f1, f2 = f1 + 1) & DX barcode outside sprockets
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
      2,
    );

    const contentTop = stripRect.y + totalEdgeBand;
    const contentBottom = stripRect.y + stripRect.height - totalEdgeBand;
    const contentHeight = Math.max(80, contentBottom - contentTop);
    const slotWidth = (stripRect.width - sidePad * 2 - septumGap) / 2;

    const leftSlot = {
      x: stripRect.x + sidePad,
      y: contentTop,
      width: slotWidth,
      height: contentHeight,
    };
    const rightSlot = {
      x: stripRect.x + sidePad + slotWidth + septumGap,
      y: contentTop,
      width: slotWidth,
      height: contentHeight,
    };

    // Slot 1 (primary photo fitted cleanly)
    const rot1 = getRotatedDimensions(primaryImage.width, primaryImage.height, primaryImage.rotation);
    const rect1 = fitRectInBox(rot1.width, rot1.height, leftSlot);
    ctx.save();
    drawRoundedRectPath(ctx, rect1.x, rect1.y, rect1.width, rect1.height, 6 * scale);
    ctx.clip();
    drawRotatedImage(ctx, primaryImage.source, rect1, primaryImage.rotation);
    ctx.restore();

    // Slot 2 (secondary photo or darkroom placeholder)
    if (secondaryImage) {
      const rot2 = getRotatedDimensions(
        secondaryImage.width,
        secondaryImage.height,
        secondaryImage.rotation,
      );
      const rect2 = fitRectInBox(rot2.width, rot2.height, rightSlot);
      ctx.save();
      drawRoundedRectPath(ctx, rect2.x, rect2.y, rect2.width, rect2.height, 6 * scale);
      ctx.clip();
      drawRotatedImage(ctx, secondaryImage.source, rect2, secondaryImage.rotation);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#1E1E21';
      ctx.strokeStyle = '#38383E';
      ctx.lineWidth = Math.max(1, 2 * scale);
      drawRoundedRectPath(
        ctx,
        rightSlot.x,
        rightSlot.y,
        rightSlot.width,
        rightSlot.height,
        6 * scale,
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8B8880';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `500 ${Math.max(10, 22 * scale)}px "JetBrains Mono", monospace`;
      ctx.fillText(
        'SELECT 2ND FRAME',
        rightSlot.x + rightSlot.width / 2,
        rightSlot.y + rightSlot.height / 2,
        rightSlot.width * 0.85,
      );
      ctx.restore();
    }
  },
};
