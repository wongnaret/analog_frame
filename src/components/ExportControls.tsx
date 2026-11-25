import { Archive, Check, Copy, Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import { getAspectRatioPreset } from '../core/presets/aspectRatios';
import type { ExportFormat, ExportOptions, PhotoItem } from '../core/types';

interface ExportControlsProps {
  photo: PhotoItem;
  totalPhotos: number;
  exportOptions: ExportOptions;
  isExporting: boolean;
  zipProgress: { completed: number; total: number } | null;
  statusMessage: string | null;
  onChangeOptions: (patch: Partial<ExportOptions>) => void;
  onShareOrSaveCurrent: () => void;
  onDownloadCurrent: () => void;
  onExportAllZip: () => void;
  onCopyCaption: () => Promise<boolean>;
}

export function ExportControls({
  photo,
  totalPhotos,
  exportOptions,
  isExporting,
  zipProgress,
  statusMessage,
  onChangeOptions,
  onShareOrSaveCurrent,
  onDownloadCurrent,
  onExportAllZip,
  onCopyCaption,
}: ExportControlsProps) {
  const preset = getAspectRatioPreset(photo.settings.aspectRatioId);
  const [captionCopied, setCaptionCopied] = useState(false);

  const handleCopyCaptionClick = async () => {
    const ok = await onCopyCaption();
    if (ok) {
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border p-3.5"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider">
          Output Specification
        </div>
        <div
          className="font-mono-tech mt-1 text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          {preset.label} · {preset.width} × {preset.height} px (2× IG Ready)
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider">
          File Format
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(['jpeg', 'png'] as ExportFormat[]).map((format) => {
            const active = exportOptions.format === format;
            return (
              <button
                key={format}
                type="button"
                onClick={() => onChangeOptions({ format })}
                className="rounded-xl border p-3 text-left transition"
                style={{
                  backgroundColor: active
                    ? 'var(--accent-amber-soft)'
                    : 'var(--bg-elevated)',
                  borderColor: active
                    ? 'var(--accent-amber)'
                    : 'var(--border-subtle)',
                }}
              >
                <div className="text-xs font-semibold uppercase">
                  {format === 'jpeg' ? 'JPEG (95%)' : 'PNG (Lossless)'}
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {format === 'jpeg'
                    ? 'Best for IG & supports EXIF'
                    : 'Sharpest text, larger file'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {exportOptions.format === 'jpeg' && (
        <button
          type="button"
          onClick={() =>
            onChangeOptions({ preserveExif: !exportOptions.preserveExif })
          }
          className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <div className="text-xs font-medium">Preserve EXIF in JPEG</div>
            <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              Writes DateTimeOriginal, Camera, Lens & Film back to JPEG
            </div>
          </div>
          <span
            className="flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition"
            style={{
              backgroundColor: exportOptions.preserveExif
                ? 'var(--accent-amber)'
                : 'var(--border-subtle)',
            }}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                exportOptions.preserveExif ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </span>
        </button>
      )}

      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          disabled={isExporting}
          onClick={onShareOrSaveCurrent}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-black transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-amber)' }}
        >
          <Share2 className="h-4 w-4" />
          <span>Save / Share Current Frame</span>
        </button>

        <button
          type="button"
          disabled={isExporting}
          onClick={onDownloadCurrent}
          className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:opacity-85 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <Download className="h-4 w-4" />
          <span>Download File Directly</span>
        </button>

        {totalPhotos > 1 && (
          <button
            type="button"
            disabled={isExporting}
            onClick={onExportAllZip}
            className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:opacity-85 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Archive className="h-4 w-4" />
            <span>
              {zipProgress
                ? `Exporting ${zipProgress.completed} / ${zipProgress.total}...`
                : `Export All ${totalPhotos} Photos as ZIP`}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => void handleCopyCaptionClick()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:opacity-85"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: captionCopied ? 'var(--accent-amber)' : 'var(--border-subtle)',
            color: captionCopied ? 'var(--accent-amber)' : 'var(--text-primary)',
          }}
        >
          {captionCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{captionCopied ? 'IG Caption Copied!' : 'Copy IG Caption'}</span>
        </button>
      </div>

      {statusMessage && (
        <p
          className="font-mono-tech rounded-lg border px-3 py-2 text-center text-[11px]"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}
