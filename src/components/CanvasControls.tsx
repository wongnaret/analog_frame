import { Layers } from 'lucide-react';
import { ASPECT_RATIO_PRESETS } from '../core/presets/aspectRatios';
import { MATTE_PALETTES } from '../core/presets/mattePalettes';
import type {
  AspectRatioId,
  MattePaletteId,
  MetadataVisibility,
  PhotoItem,
} from '../core/types';
import { WatermarkField } from './WatermarkField';

interface CanvasControlsProps {
  photo: PhotoItem;
  totalPhotos: number;
  onChangeRatio: (aspectRatioId: AspectRatioId) => void;
  onChangeMatte: (matteId: MattePaletteId) => void;
  onToggleVisibility: (key: keyof MetadataVisibility) => void;
  onToggleWatermark: () => void;
  onChangeWatermarkText: (watermarkText: string) => void;
  onApplyCanvasToAll: () => void;
}

const VISIBILITY_OPTIONS: Array<{
  key: keyof MetadataVisibility;
  label: string;
  hint: string;
}> = [
  { key: 'showDate', label: 'Shooting Date', hint: 'Shown on Editorial Card' },
  { key: 'showFrameNumber', label: 'Frame Number', hint: 'Edge counter on 35mm film borders' },
  { key: 'showArtist', label: 'Photographer / Artist', hint: 'Credit on frame' },
  { key: 'showCaption', label: 'Custom Caption', hint: 'Italic note below specs' },
];

export function CanvasControls({
  photo,
  totalPhotos,
  onChangeRatio,
  onChangeMatte,
  onToggleVisibility,
  onToggleWatermark,
  onChangeWatermarkText,
  onApplyCanvasToAll,
}: CanvasControlsProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            Instagram Aspect Ratio
          </h3>
          {totalPhotos > 1 && (
            <button
              type="button"
              onClick={onApplyCanvasToAll}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition hover:opacity-80"
              style={{
                backgroundColor: 'var(--accent-amber-soft)',
                color: 'var(--accent-amber)',
              }}
            >
              <Layers className="h-3 w-3" />
              <span>Apply to All</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ASPECT_RATIO_PRESETS.map((preset) => {
            const active = photo.settings.aspectRatioId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeRatio(preset.id)}
                className="rounded-xl border p-3 text-left transition active:scale-[0.98]"
                style={{
                  backgroundColor: active
                    ? 'var(--accent-amber-soft)'
                    : 'var(--bg-elevated)',
                  borderColor: active
                    ? 'var(--accent-amber)'
                    : 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{preset.label}</span>
                  {preset.id === '3:4' && (
                    <span
                      className="font-mono-tech rounded px-1.5 py-0.5 text-[9px] uppercase"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>
                <div
                  className="font-mono-tech mt-1 text-[11px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {preset.width} × {preset.height}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider">
          Outer Matte Paper
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {MATTE_PALETTES.map((palette) => {
            const active = photo.settings.matteId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => onChangeMatte(palette.id)}
                className="flex items-center gap-2 rounded-xl border p-2.5 text-left transition"
                style={{
                  backgroundColor: active
                    ? 'var(--accent-amber-soft)'
                    : 'var(--bg-elevated)',
                  borderColor: active
                    ? 'var(--accent-amber)'
                    : 'var(--border-subtle)',
                }}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border"
                  style={{
                    backgroundColor: palette.swatchHex,
                    borderColor: 'var(--border-subtle)',
                  }}
                />
                <span className="truncate text-xs font-medium">{palette.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <WatermarkField
        watermarkText={photo.settings.watermarkText}
        showWatermark={photo.settings.visibility.showWatermark}
        onChangeWatermarkText={onChangeWatermarkText}
        onToggleWatermark={onToggleWatermark}
      />

      <div>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider">
          Frame Typography Fields
        </h3>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map(({ key, label, hint }) => {
            const enabled = photo.settings.visibility[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleVisibility(key)}
                className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div>
                  <div className="text-xs font-medium">{label}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {hint}
                  </div>
                </div>
                <span
                  className="flex h-5 w-9 items-center rounded-full p-0.5 transition"
                  style={{
                    backgroundColor: enabled
                      ? 'var(--accent-amber)'
                      : 'var(--border-subtle)',
                  }}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
