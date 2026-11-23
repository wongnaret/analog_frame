import type {
  MattePalette,
  MetadataVisibility,
  PhotoMetadata,
  RotationDegrees,
  TemplateId,
} from '../types';
import type { Rect } from '../renderer/layout';

export interface RenderableImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  rotation: RotationDegrees;
}

export interface TemplateRenderParams {
  frameRegion: Rect;
  scale: number;
  primaryImage: RenderableImage;
  secondaryImage?: RenderableImage | null;
  metadata: PhotoMetadata;
  visibility: MetadataVisibility;
  palette: MattePalette;
}

export interface FrameTemplate {
  id: TemplateId;
  name: string;
  shortDescription: string;
  supportsDiptych: boolean;
  usesCustomFooter: boolean;
  render: (ctx: CanvasRenderingContext2D, params: TemplateRenderParams) => void;
}
