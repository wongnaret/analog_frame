import { getMattePalette } from '../presets/mattePalettes';
import { getTemplate } from '../templates/registry';
import type { RenderableImage } from '../templates/types';
import type { FrameSettings, PhotoMetadata } from '../types';
import { computeCanvasLayout } from './layout';
import { drawOuterTypography } from './typography';

export interface RenderFramedPhotoParams {
  primaryImage: RenderableImage;
  secondaryImage?: RenderableImage | null;
  metadata: PhotoMetadata;
  settings: FrameSettings;
  scale?: number;
  targetCanvas?: HTMLCanvasElement;
}

export function renderFramedPhoto({
  primaryImage,
  secondaryImage = null,
  metadata,
  settings,
  scale = 1,
  targetCanvas,
}: RenderFramedPhotoParams): HTMLCanvasElement {
  const template = getTemplate(settings.templateId);
  const palette = getMattePalette(settings.matteId);
  const layout = computeCanvasLayout(
    settings.aspectRatioId,
    scale,
    template.usesCustomFooter,
  );

  const canvas = targetCanvas ?? document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Layer 1: Outer IG canvas matte background
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, layout.width, layout.height);

  // Layer 2: Inner film frame template
  template.render(ctx, {
    frameRegion: layout.frameRegion,
    scale,
    primaryImage,
    secondaryImage,
    metadata,
    visibility: settings.visibility,
    palette,
  });

  // Layer 3: Outer matte typography (unless template renders its own spec card)
  if (!template.usesCustomFooter) {
    drawOuterTypography(
      ctx,
      layout.footerRegion,
      metadata,
      settings.visibility,
      palette,
      scale,
    );
  }

  return canvas;
}
