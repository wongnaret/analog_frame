import type { AspectRatioId, AspectRatioPreset } from '../types';

export const DEFAULT_ASPECT_RATIO_ID: AspectRatioId = '3:4';

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  {
    id: '3:4',
    label: '3:4 Profile Grid',
    shortLabel: '3:4',
    width: 2160,
    height: 2880,
    description: 'Instagram vertical grid & feed default (2160 × 2880)',
  },
  {
    id: '4:5',
    label: '4:5 IG Feed',
    shortLabel: '4:5',
    width: 2160,
    height: 2700,
    description: 'Classic tall Instagram feed post (2160 × 2700)',
  },
  {
    id: '1:1',
    label: '1:1 Square',
    shortLabel: '1:1',
    width: 2160,
    height: 2160,
    description: 'Balanced square gallery post (2160 × 2160)',
  },
  {
    id: '9:16',
    label: '9:16 Story',
    shortLabel: '9:16',
    width: 2160,
    height: 3840,
    description: 'Full-screen Instagram Stories & Reels cover (2160 × 3840)',
  },
];

export function getAspectRatioPreset(id: AspectRatioId): AspectRatioPreset {
  return (
    ASPECT_RATIO_PRESETS.find((preset) => preset.id === id) ??
    ASPECT_RATIO_PRESETS[0]
  );
}
