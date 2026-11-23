import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import {
  drawEdgeMarkings,
  drawFilmGateNotches,
  drawRoundedRectPath,
} from './drawFilmHelpers';
import type { FrameTemplate } from './types';

export const filmRebateTemplate: FrameTemplate = {
  id: 'film-rebate',
  name: 'Film Rebate',
  shortDescription: 'Sprocket-free black negative border',
  supportsDiptych: false,
  usesCustomFooter: false,
  render(ctx, { frameRegion, scale, primaryImage, metadata, visibility, palette }) {
    const rotDims = getRotatedDimensions(
      primaryImage.width,
      primaryImage.height,
      primaryImage.rotation,
    );

    const sideBorder = Math.round(52 * scale);
    const topBottomBorder = Math.round(76 * scale);

    const innerBox = {
      x: frameRegion.x + sideBorder,
      y: frameRegion.y + topBottomBorder,
      width: frameRegion.width - sideBorder * 2,
      height: frameRegion.height - topBottomBorder * 2,
    };

    const photoRect = fitRectInBox(rotDims.width, rotDims.height, innerBox);

    const rebateRect = {
      x: photoRect.x - sideBorder,
      y: photoRect.y - topBottomBorder,
      width: photoRect.width + sideBorder * 2,
      height: photoRect.height + topBottomBorder * 2,
    };

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
    ctx.shadowBlur = 24 * scale;
    ctx.shadowOffsetY = 8 * scale;
    ctx.fillStyle = '#121213';
    drawRoundedRectPath(ctx, rebateRect.x, rebateRect.y, rebateRect.width, rebateRect.height, 4 * scale);
    ctx.fill();
    ctx.restore();

    if (palette.id === 'darkroom') {
      ctx.save();
      ctx.strokeStyle = '#2B2B2E';
      ctx.lineWidth = Math.max(1, 2 * scale);
      drawRoundedRectPath(ctx, rebateRect.x, rebateRect.y, rebateRect.width, rebateRect.height, 4 * scale);
      ctx.stroke();
      ctx.restore();
    }

    drawEdgeMarkings(
      ctx,
      {
        x: rebateRect.x + 12 * scale,
        y: rebateRect.y,
        width: rebateRect.width - 24 * scale,
        height: topBottomBorder * 0.72,
      },
      'horizontal',
      metadata,
      visibility.showFrameNumber,
      scale,
    );

    drawEdgeMarkings(
      ctx,
      {
        x: rebateRect.x + 12 * scale,
        y: photoRect.y + photoRect.height + topBottomBorder * 0.24,
        width: rebateRect.width - 24 * scale,
        height: topBottomBorder * 0.72,
      },
      'horizontal',
      metadata,
      visibility.showFrameNumber,
      scale,
      metadata.iso ? `ISO ${metadata.iso}` : '35MM NEGATIVE',
    );

    ctx.save();
    drawRoundedRectPath(ctx, photoRect.x, photoRect.y, photoRect.width, photoRect.height, 14 * scale);
    ctx.clip();
    drawRotatedImage(ctx, primaryImage.source, photoRect, primaryImage.rotation);
    ctx.restore();

    drawFilmGateNotches(ctx, photoRect, '#121213', scale);
  },
};
