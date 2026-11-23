import { RotateCcw, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getAspectRatioPreset } from '../core/presets/aspectRatios';
import { renderFramedPhoto } from '../core/renderer/renderFramedPhoto';
import type { RenderableImage } from '../core/templates/types';
import type { PhotoItem } from '../core/types';

interface CanvasPreviewProps {
  photo: PhotoItem;
  partnerPhoto: PhotoItem | null;
  onRotate: (delta: 90 | -90) => void;
}

function useDecodedImage(objectUrl: string | null): HTMLImageElement | null {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!objectUrl) {
      setImageEl(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setImageEl(img);
    };
    img.src = objectUrl;
    return () => {
      cancelled = true;
    };
  }, [objectUrl]);

  return imageEl;
}

export function CanvasPreview({
  photo,
  partnerPhoto,
  onRotate,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const primaryImg = useDecodedImage(photo.objectUrl);
  const partnerImg = useDecodedImage(
    photo.settings.templateId === 'half-frame-diptych'
      ? partnerPhoto?.objectUrl ?? null
      : null,
  );
  const [fontsLoadedTick, setFontsLoadedTick] = useState(0);

  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsLoadedTick((n) => n + 1));
    }
  }, []);

  const preset = getAspectRatioPreset(photo.settings.aspectRatioId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !primaryImg) return;

    const maxPreviewSide = 1100;
    const baseMax = Math.max(preset.width, preset.height);
    const scale = Math.min(1, maxPreviewSide / baseMax);

    const primary: RenderableImage = {
      source: primaryImg,
      width: photo.width,
      height: photo.height,
      rotation: photo.settings.rotation,
    };

    const secondary: RenderableImage | null =
      partnerImg && partnerPhoto
        ? {
            source: partnerImg,
            width: partnerPhoto.width,
            height: partnerPhoto.height,
            rotation: partnerPhoto.settings.rotation,
          }
        : null;

    renderFramedPhoto({
      primaryImage: primary,
      secondaryImage: secondary,
      metadata: photo.metadata,
      settings: photo.settings,
      scale,
      targetCanvas: canvas,
    });
  }, [primaryImg, partnerImg, partnerPhoto, photo, preset, fontsLoadedTick]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex w-full items-center justify-center rounded-2xl border p-3 sm:p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <canvas
          ref={canvasRef}
          className="max-h-[44vh] w-auto max-w-full rounded-md shadow-xl lg:max-h-[66vh]"
        />
      </div>

      <div className="mt-2.5 flex w-full items-center justify-between gap-2 px-1">
        <div
          className="font-mono-tech truncate text-[11px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {preset.label} · {preset.width} × {preset.height}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRotate(-90)}
            title="Rotate 90° counter-clockwise"
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">-90°</span>
          </button>
          <button
            type="button"
            onClick={() => onRotate(90)}
            title="Rotate 90° clockwise"
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">+90°</span>
          </button>
        </div>
      </div>
    </div>
  );
}
