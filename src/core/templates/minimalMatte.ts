import { drawRotatedImage, fitRectInBox, getRotatedDimensions } from '../renderer/layout';
import type { FrameTemplate } from './types';

export const minimalMatteTemplate: FrameTemplate = {
  id: 'minimal-matte',
  name: 'Minimal Matte',
  shortDescription: 'Clean gallery print with hairline',
  supportsDiptych: false,
  usesCustomFooter: false,
  render(ctx, { frameRegion, scale, primaryImage, palette }) {
    const rotDims = getRotatedDimensions(
      primaryImage.width,
      primaryImage.height,
      primaryImage.rotation,
    );

    const photoRect = fitRectInBox(rotDims.width, rotDims.height, frameRegion, 16 * scale);

    ctx.save();
    ctx.shadowColor =
      palette.id === 'darkroom' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.14)';
    ctx.shadowBlur = 28 * scale;
    ctx.shadowOffsetY = 10 * scale;
    ctx.fillStyle = palette.cardBg;
    ctx.fillRect(photoRect.x, photoRect.y, photoRect.width, photoRect.height);
    ctx.restore();

    drawRotatedImage(ctx, primaryImage.source, photoRect, primaryImage.rotation);

    // Crisp hairline around print
    ctx.save();
    ctx.strokeStyle = palette.hairline;
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.strokeRect(photoRect.x, photoRect.y, photoRect.width, photoRect.height);
    ctx.restore();
  },
};
