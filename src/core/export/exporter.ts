import { zipSync } from 'fflate';
import { dataUrlToBlob, writeExifToJpegDataUrl } from '../exif/writer';
import { renderFramedPhoto } from '../renderer/renderFramedPhoto';
import type { RenderableImage } from '../templates/types';
import type {
  AspectRatioId,
  ExportFormat,
  ExportOptions,
  PhotoItem,
  TemplateId,
} from '../types';

export function buildExportFilename(
  originalName: string,
  aspectRatioId: AspectRatioId,
  templateId: TemplateId,
  format: ExportFormat,
): string {
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'analog_frame';
  const ratioTag = aspectRatioId.replace(':', 'x');
  const templateTag = templateId
    .replace('35mm-sprocket', '35mm')
    .replace('film-rebate', 'rebate')
    .replace('minimal-matte', 'matte')
    .replace('editorial-card', 'card')
    .replace('half-frame-single', 'half')
    .replace('half-frame-diptych', 'diptych');
  const ext = format === 'png' ? 'png' : 'jpg';
  return `${base}_${ratioTag}_${templateTag}.${ext}`;
}

export async function loadImageElement(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image for rendering'));
    img.src = objectUrl;
  });
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas encoding produced an empty blob'));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export async function renderPhotoToExportBlob(
  photo: PhotoItem,
  partnerPhoto: PhotoItem | null,
  options: ExportOptions,
  reusableCanvas?: HTMLCanvasElement,
): Promise<Blob> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  const primaryEl = await loadImageElement(photo.objectUrl);
  const primaryImage: RenderableImage = {
    source: primaryEl,
    width: photo.width,
    height: photo.height,
    rotation: photo.settings.rotation,
  };

  let secondaryImage: RenderableImage | null = null;
  if (partnerPhoto && photo.settings.templateId === 'half-frame-diptych') {
    const partnerEl = await loadImageElement(partnerPhoto.objectUrl);
    secondaryImage = {
      source: partnerEl,
      width: partnerPhoto.width,
      height: partnerPhoto.height,
      rotation: partnerPhoto.settings.rotation,
    };
  }

  const canvas = renderFramedPhoto({
    primaryImage,
    secondaryImage,
    metadata: photo.metadata,
    settings: photo.settings,
    scale: 1,
    targetCanvas: reusableCanvas,
  });

  if (options.format === 'png') {
    return canvasToBlob(canvas, 'image/png');
  }

  if (options.preserveExif) {
    try {
      const jpegDataUrl = canvas.toDataURL('image/jpeg', options.jpegQuality);
      const taggedDataUrl = writeExifToJpegDataUrl(jpegDataUrl, photo.metadata);
      return dataUrlToBlob(taggedDataUrl);
    } catch {
      // Fallback to plain JPEG blob if EXIF encoding fails
    }
  }

  return canvasToBlob(canvas, 'image/jpeg', options.jpegQuality);
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canShareFiles(file: File): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof navigator.share === 'function' &&
    navigator.canShare({ files: [file] })
  );
}

export async function shareOrDownloadBlob(
  blob: Blob,
  filename: string,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  if (canShareFiles(file)) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall through to standard file download on share failure
    }
  }

  triggerBlobDownload(blob, filename);
  return 'downloaded';
}

export async function exportBatchAsZip(
  photos: PhotoItem[],
  options: ExportOptions,
  onProgress?: (completed: number, total: number) => void,
): Promise<void> {
  const reusableCanvas = document.createElement('canvas');
  const entries: Record<string, Uint8Array> = {};
  const usedNames = new Map<string, number>();

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const partner = photo.settings.diptychPartnerId
      ? photos.find((p) => p.id === photo.settings.diptychPartnerId) ?? null
      : null;

    const blob = await renderPhotoToExportBlob(photo, partner, options, reusableCanvas);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    let filename = buildExportFilename(
      photo.fileName,
      photo.settings.aspectRatioId,
      photo.settings.templateId,
      options.format,
    );
    const count = usedNames.get(filename) ?? 0;
    usedNames.set(filename, count + 1);
    if (count > 0) {
      filename = filename.replace(/(\.[^.]+)$/, `_${count + 1}$1`);
    }

    entries[filename] = bytes;
    onProgress?.(i + 1, photos.length);
  }

  // JPEGs/PNGs are already compressed; store mode (level 0) creates ZIP instantaneously
  const zipBytes = zipSync(entries, { level: 0 });
  const zipBlob = new Blob([zipBytes], { type: 'application/zip' });
  const stamp = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(zipBlob, `analog_frame_${stamp}.zip`);
}
