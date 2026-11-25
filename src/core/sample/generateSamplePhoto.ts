import { writeExifToJpegDataUrl } from '../exif/writer';
import type { PhotoMetadata } from '../types';

export const SAMPLE_METADATA: PhotoMetadata = {
  mode: 'film',
  camera: 'Pentax 17',
  lens: '25mm F3.5',
  scanner: 'Noritsu HS-1800',
  filmStock: 'Kodak Portra 400',
  iso: '400',
  focalLength: '',
  aperture: '',
  shutterSpeed: '',
  date: '2026-09-13',
  exifDateTime: '2026:09:13 17:42:00',
  artist: 'Analog Lab',
  frameNumber: '17A',
  caption: 'Late afternoon light on 35mm',
};

export async function generateSamplePhotoFile(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot create sample canvas');
  }

  // Warm golden-hour gradient sky & architectural horizon
  const sky = ctx.createLinearGradient(0, 0, 0, 1600);
  sky.addColorStop(0, '#2C3E55');
  sky.addColorStop(0.45, '#C87E53');
  sky.addColorStop(0.75, '#E9B97A');
  sky.addColorStop(1, '#261E19');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1200, 1600);

  // Sun disc glow
  const sun = ctx.createRadialGradient(780, 620, 20, 780, 620, 420);
  sun.addColorStop(0, 'rgba(255, 244, 212, 0.92)');
  sun.addColorStop(0.35, 'rgba(244, 186, 108, 0.45)');
  sun.addColorStop(1, 'rgba(244, 186, 108, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 1200, 1600);

  // Minimalist foreground silhouette
  ctx.fillStyle = '#1B1614';
  ctx.beginPath();
  ctx.moveTo(0, 1140);
  ctx.lineTo(420, 1060);
  ctx.lineTo(440, 1180);
  ctx.lineTo(1200, 1100);
  ctx.lineTo(1200, 1600);
  ctx.lineTo(0, 1600);
  ctx.closePath();
  ctx.fill();

  // Subtle film grain specks
  ctx.fillStyle = 'rgba(255, 248, 232, 0.05)';
  for (let i = 0; i < 1800; i++) {
    const gx = (i * 7919) % 1200;
    const gy = (i * 104729) % 1600;
    ctx.fillRect(gx, gy, 2, 2);
  }

  const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const taggedDataUrl = writeExifToJpegDataUrl(rawDataUrl, SAMPLE_METADATA);

  const response = await fetch(taggedDataUrl);
  const blob = await response.blob();
  return new File([blob], 'sample_pentax17_portra400.jpg', { type: 'image/jpeg' });
}
