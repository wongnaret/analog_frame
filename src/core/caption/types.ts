import type { PhotoMetadata, TemplateId } from '../types';

export type CaptionMoodId =
  | 'auto'
  | 'stoic'
  | 'light'
  | 'street'
  | 'mechanical'
  | 'night'
  | 'monochrome';

export interface CaptionMoodOption {
  id: CaptionMoodId;
  label: string;
}

export interface CaptionPreferences {
  includeOpeningLine: boolean;
  includeScanner: boolean;
  mood: CaptionMoodId;
  customHashtags: string[];
  geminiApiKey: string;
}

export interface CaptionDraft {
  openingLine: string;
  hashtags: string[];
  hasCustomHashtags: boolean;
  contextNote: string;
  text: string;
  isManuallyEdited: boolean;
}

export interface FormatCaptionParams {
  openingLine: string;
  includeOpeningLine: boolean;
  includeScanner: boolean;
  metadata: PhotoMetadata;
  hashtags: string[];
}

export interface GenerateAiCaptionParams {
  apiKey: string;
  objectUrl: string;
  metadata: PhotoMetadata;
  templateId: TemplateId;
  contextNote: string;
  includeOpeningLine: boolean;
  includeScanner: boolean;
}
