export type AspectRatioId = '3:4' | '4:5' | '1:1' | '9:16';

export type MattePaletteId = 'white' | 'warm-paper' | 'darkroom';

export type TemplateId =
  | '35mm-sprocket'
  | 'film-rebate'
  | 'minimal-matte'
  | 'editorial-card'
  | 'half-frame-single'
  | 'half-frame-diptych';

export type RotationDegrees = 0 | 90 | 180 | 270;

export type ExportFormat = 'jpeg' | 'png';

export interface AspectRatioPreset {
  id: AspectRatioId;
  label: string;
  shortLabel: string;
  width: number;
  height: number;
  description: string;
}

export interface MattePalette {
  id: MattePaletteId;
  label: string;
  background: string;
  primaryText: string;
  secondaryText: string;
  hairline: string;
  cardBg: string;
  swatchHex: string;
}

export interface FilmStockPreset {
  name: string;
  brand: 'Kodak' | 'Ilford' | 'Fujifilm' | 'CineStill' | 'Harman' | 'Other';
  defaultIso: string;
  type: 'Color Negative' | 'B&W' | 'Cinema' | 'Slide';
}

export interface PhotoMetadata {
  camera: string;
  lens: string;
  filmStock: string;
  iso: string;
  date: string; // YYYY-MM-DD
  exifDateTime: string; // YYYY:MM:DD HH:MM:SS
  artist: string;
  frameNumber: string;
  caption: string;
}

export interface MetadataVisibility {
  showDate: boolean;
  showArtist: boolean;
  showFrameNumber: boolean;
  showCaption: boolean;
  showWatermark: boolean;
}

export interface FrameSettings {
  templateId: TemplateId;
  aspectRatioId: AspectRatioId;
  matteId: MattePaletteId;
  rotation: RotationDegrees;
  visibility: MetadataVisibility;
  watermarkText: string;
  diptychPartnerId: string | null;
}

export interface ExifDetectedFlags {
  camera: boolean;
  lens: boolean;
  filmStock: boolean;
  iso: boolean;
  date: boolean;
  artist: boolean;
}

export interface PhotoItem {
  id: string;
  fileName: string;
  fileSize: number;
  objectUrl: string;
  width: number;
  height: number;
  exifDetected: ExifDetectedFlags;
  metadata: PhotoMetadata;
  settings: FrameSettings;
}

export interface ExportOptions {
  format: ExportFormat;
  jpegQuality: number;
  preserveExif: boolean;
}

export interface GearHistory {
  cameras: string[];
  lenses: string[];
  filmStocks: string[];
  artists: string[];
}
