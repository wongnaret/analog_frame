import { BookmarkPlus, CheckCircle2, Layers } from 'lucide-react';
import {
  FILM_STOCK_PRESETS,
  inferIsoFromFilmStock,
} from '../core/presets/filmStocks';
import type { GearHistory, PhotoItem, PhotoMetadata } from '../core/types';
import { WatermarkField } from './WatermarkField';

const DEFAULT_SCANNER_PRESETS = ['Frontier SP-3000', 'Noritsu HS-1800', 'Plustek 8200i'];

interface MetadataControlsProps {
  photo: PhotoItem;
  totalPhotos: number;
  gearHistory: GearHistory;
  onUpdateMetadata: (patch: Partial<PhotoMetadata>) => void;
  onChangeWatermarkText: (watermarkText: string) => void;
  onToggleWatermark: () => void;
  onSaveGearToHistory: () => void;
  onApplyGearToAll: () => void;
}

export function MetadataControls({
  photo,
  totalPhotos,
  gearHistory,
  onUpdateMetadata,
  onChangeWatermarkText,
  onToggleWatermark,
  onSaveGearToHistory,
  onApplyGearToAll,
}: MetadataControlsProps) {
  const { metadata, exifDetected } = photo;
  const anyExifFound = Object.values(exifDetected).some(Boolean);
  const scannerSuggestions = Array.from(
    new Set([...(gearHistory.scanners ?? []), ...DEFAULT_SCANNER_PRESETS]),
  ).slice(0, 4);

  const handleFilmChange = (value: string) => {
    const inferred = inferIsoFromFilmStock(value);
    if (inferred && !metadata.iso.trim()) {
      onUpdateMetadata({ filmStock: value, iso: inferred });
    } else {
      onUpdateMetadata({ filmStock: value });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2
            className="h-3.5 w-3.5"
            style={{
              color: anyExifFound
                ? 'var(--accent-amber)'
                : 'var(--text-secondary)',
            }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {anyExifFound
              ? 'EXIF detected from file'
              : 'No EXIF found — fill manually'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSaveGearToHistory}
            title="Remember current Camera, Lens, Film & Artist"
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <BookmarkPlus className="h-3 w-3" />
            <span>Save Gear</span>
          </button>

          {totalPhotos > 1 && (
            <button
              type="button"
              onClick={onApplyGearToAll}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition hover:opacity-80"
              style={{
                backgroundColor: 'var(--accent-amber-soft)',
                color: 'var(--accent-amber)',
              }}
            >
              <Layers className="h-3 w-3" />
              <span>Apply Gear to All</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
            <span>Camera</span>
            {exifDetected.camera && (
              <span className="font-mono-tech text-[10px]" style={{ color: 'var(--accent-amber)' }}>
                EXIF
              </span>
            )}
          </span>
          <input
            type="text"
            value={metadata.camera}
            onChange={(e) => onUpdateMetadata({ camera: e.target.value })}
            placeholder="e.g. Pentax 17, Leica M6"
            className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
          {gearHistory.cameras.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {gearHistory.cameras.slice(0, 4).map((cam) => (
                <button
                  key={cam}
                  type="button"
                  onClick={() => onUpdateMetadata({ camera: cam })}
                  className="rounded border px-1.5 py-0.5 text-[10px] transition hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {cam}
                </button>
              ))}
            </div>
          )}
        </label>

        <label className="block">
          <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
            <span>Lens</span>
            {exifDetected.lens && (
              <span className="font-mono-tech text-[10px]" style={{ color: 'var(--accent-amber)' }}>
                EXIF
              </span>
            )}
          </span>
          <input
            type="text"
            value={metadata.lens}
            onChange={(e) => onUpdateMetadata({ lens: e.target.value })}
            placeholder="e.g. 25mm F3.5, 50mm f/1.8"
            className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
          {gearHistory.lenses.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {gearHistory.lenses.slice(0, 4).map((lens) => (
                <button
                  key={lens}
                  type="button"
                  onClick={() => onUpdateMetadata({ lens })}
                  className="rounded border px-1.5 py-0.5 text-[10px] transition hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {lens}
                </button>
              ))}
            </div>
          )}
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
            <span>Scanner</span>
            {exifDetected.scanner && (
              <span className="font-mono-tech text-[10px]" style={{ color: 'var(--accent-amber)' }}>
                EXIF
              </span>
            )}
          </span>
          <input
            type="text"
            value={metadata.scanner ?? ''}
            onChange={(e) => onUpdateMetadata({ scanner: e.target.value })}
            placeholder="e.g. Frontier SP-3000, Noritsu HS-1800"
            className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {scannerSuggestions.map((scanner) => (
              <button
                key={scanner}
                type="button"
                onClick={() => onUpdateMetadata({ scanner })}
                className="rounded border px-1.5 py-0.5 text-[10px] transition hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {scanner}
              </button>
            ))}
          </div>
        </label>

        <div className="sm:col-span-2">
          <span className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
            <span>Film Stock</span>
            {exifDetected.filmStock && (
              <span className="font-mono-tech text-[10px]" style={{ color: 'var(--accent-amber)' }}>
                EXIF
              </span>
            )}
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={metadata.filmStock}
              onChange={(e) => handleFilmChange(e.target.value)}
              placeholder="e.g. Ilford HP5 Plus 400"
              className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            />
            <select
              aria-label="Choose preset film stock"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const preset = FILM_STOCK_PRESETS.find((f) => f.name === e.target.value);
                  onUpdateMetadata({
                    filmStock: e.target.value,
                    iso: preset ? preset.defaultIso : metadata.iso,
                  });
                }
              }}
              className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Quick pick film stock...</option>
              {FILM_STOCK_PRESETS.map((film) => (
                <option key={film.name} value={film.name}>
                  {film.name} ({film.type})
                </option>
              ))}
            </select>
          </div>
          {gearHistory.filmStocks.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {gearHistory.filmStocks.slice(0, 4).map((stock) => (
                <button
                  key={stock}
                  type="button"
                  onClick={() => handleFilmChange(stock)}
                  className="rounded border px-1.5 py-0.5 text-[10px] transition hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {stock}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider">
            ISO / EI
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={metadata.iso}
            onChange={(e) => onUpdateMetadata({ iso: e.target.value })}
            placeholder="400"
            className="font-mono-tech w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider">
            Shooting Date
          </span>
          <input
            type="date"
            value={metadata.date}
            onChange={(e) => {
              const nextDate = e.target.value;
              onUpdateMetadata({
                date: nextDate,
                exifDateTime: nextDate ? `${nextDate.replace(/-/g, ':')} 12:00:00` : '',
              });
            }}
            className="font-mono-tech w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider">
            Artist / Credit
          </span>
          <input
            type="text"
            value={metadata.artist}
            onChange={(e) => onUpdateMetadata({ artist: e.target.value })}
            placeholder="Photographer name"
            className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider">
            Frame No.
          </span>
          <input
            type="text"
            value={metadata.frameNumber}
            onChange={(e) => onUpdateMetadata({ frameNumber: e.target.value })}
            placeholder="01A"
            className="font-mono-tech w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider">
            Custom Caption
          </span>
          <input
            type="text"
            value={metadata.caption}
            onChange={(e) => onUpdateMetadata({ caption: e.target.value })}
            placeholder="Optional note (enable Caption in Canvas tab)"
            className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          />
        </label>
      </div>

      <WatermarkField
        watermarkText={photo.settings.watermarkText}
        showWatermark={photo.settings.visibility.showWatermark}
        onChangeWatermarkText={onChangeWatermarkText}
        onToggleWatermark={onToggleWatermark}
      />
    </div>
  );
}
