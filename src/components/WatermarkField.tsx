import { RotateCcw } from 'lucide-react';
import { DEFAULT_WATERMARK_TEXT } from '../core/renderer/typography';

interface WatermarkFieldProps {
  watermarkText: string | undefined;
  showWatermark: boolean | undefined;
  onChangeWatermarkText: (watermarkText: string) => void;
  onToggleWatermark: () => void;
}

export function WatermarkField({
  watermarkText,
  showWatermark,
  onChangeWatermarkText,
  onToggleWatermark,
}: WatermarkFieldProps) {
  const enabled = showWatermark ?? true;
  const currentText = watermarkText ?? DEFAULT_WATERMARK_TEXT;

  return (
    <div
      className="rounded-xl border p-3.5"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider">
            Footer Watermark
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            Saved automatically · shown at bottom edge
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle footer watermark"
          onClick={onToggleWatermark}
          className="flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition"
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
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={currentText}
          onChange={(e) => onChangeWatermarkText(e.target.value)}
          placeholder={DEFAULT_WATERMARK_TEXT}
          aria-label="Footer watermark text"
          className="font-mono-tech w-full rounded-lg border px-3 py-2 text-xs uppercase outline-none focus:ring-1"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            opacity: enabled ? 1 : 0.6,
          }}
        />
        <button
          type="button"
          onClick={() => onChangeWatermarkText(DEFAULT_WATERMARK_TEXT)}
          title={`Reset to ${DEFAULT_WATERMARK_TEXT}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-2 text-[11px] font-medium transition hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
