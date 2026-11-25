import { Layers, Upload } from 'lucide-react';
import { useRef } from 'react';
import { TEMPLATES } from '../core/templates/registry';
import type { PhotoItem, TemplateId } from '../core/types';
import { TemplateIcon } from './TemplateIcons';

interface FrameControlsProps {
  photo: PhotoItem;
  photos: PhotoItem[];
  onSelectTemplate: (templateId: TemplateId) => void;
  onSelectDiptychPartner: (partnerId: string | null) => void;
  onUploadDiptychPartner: (file: File) => void;
  onApplyTemplateToAll: () => void;
}

export function FrameControls({
  photo,
  photos,
  onSelectTemplate,
  onSelectDiptychPartner,
  onUploadDiptychPartner,
  onApplyTemplateToAll,
}: FrameControlsProps) {
  const partnerInputRef = useRef<HTMLInputElement>(null);
  const otherPhotos = photos.filter((p) => p.id !== photo.id);
  const isDiptych = photo.settings.templateId === 'half-frame-diptych';

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            Frame Template
          </h3>
          {photos.length > 1 && (
            <button
              type="button"
              onClick={onApplyTemplateToAll}
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

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
          {TEMPLATES.map((template) => {
            const active = photo.settings.templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelectTemplate(template.id)}
                className="flex flex-col items-start rounded-xl border p-3 text-left transition active:scale-[0.98]"
                style={{
                  backgroundColor: active
                    ? 'var(--accent-amber-soft)'
                    : 'var(--bg-elevated)',
                  borderColor: active
                    ? 'var(--accent-amber)'
                    : 'var(--border-subtle)',
                }}
              >
                <div className="mb-2 flex w-full items-start justify-between gap-2">
                  <TemplateIcon templateId={template.id} active={active} />
                  {template.id === 'minimal-matte' && (
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
                <div className="text-xs font-semibold">{template.name}</div>
                <div
                  className="mt-0.5 text-[11px] leading-snug"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {template.shortDescription}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isDiptych && (
        <div
          className="rounded-xl border p-3.5"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider">
              Diptych 2nd Frame
              {otherPhotos.length > 0 && (
                <span
                  className="ml-1.5 font-mono-tech text-[10px] font-normal"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ({otherPhotos.length})
                </span>
              )}
            </h4>
            <input
              ref={partnerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUploadDiptychPartner(file);
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => partnerInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <Upload className="h-3 w-3" />
              <span>Upload 2nd Photo</span>
            </button>
          </div>

          {otherPhotos.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Upload a second photo to pair side-by-side inside this 35mm diptych strip.
            </p>
          ) : (
            <div className="grid max-h-48 grid-cols-5 gap-2 overflow-y-auto p-0.5 pr-1 sm:grid-cols-6">
              {otherPhotos.map((candidate) => {
                const selected = photo.settings.diptychPartnerId === candidate.id;
                const badgeLabel =
                  candidate.metadata.frameNumber ||
                  `#${photos.findIndex((p) => p.id === candidate.id) + 1}`;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    title={candidate.fileName}
                    onClick={() =>
                      onSelectDiptychPartner(selected ? null : candidate.id)
                    }
                    className="relative aspect-square w-full overflow-hidden rounded-lg border-2 transition"
                    style={{
                      borderColor: selected
                        ? 'var(--accent-amber)'
                        : 'var(--border-subtle)',
                    }}
                  >
                    <img
                      src={candidate.objectUrl}
                      alt={candidate.fileName}
                      className="h-full w-full object-cover"
                    />
                    <span className="font-mono-tech absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 py-px text-[9px] font-semibold leading-tight text-white">
                      {badgeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
