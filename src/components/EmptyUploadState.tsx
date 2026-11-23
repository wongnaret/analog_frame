import { Camera, Film, Sparkles, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

interface EmptyUploadStateProps {
  isLoading: boolean;
  onAddFiles: (files: FileList | File[]) => void;
  onLoadSample: () => void;
}

export function EmptyUploadState({
  isLoading,
  onAddFiles,
  onLoadSample,
}: EmptyUploadStateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-12 sm:py-20">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) {
            onAddFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className="w-full cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-12"
        style={{
          backgroundColor: isDragging
            ? 'var(--accent-amber-soft)'
            : 'var(--bg-surface)',
          borderColor: isDragging
            ? 'var(--accent-amber)'
            : 'var(--border-subtle)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              onAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{
            backgroundColor: 'var(--accent-amber-soft)',
            borderColor: 'var(--accent-amber)',
            color: 'var(--accent-amber)',
          }}
        >
          <Upload className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Drop your film scans here
        </h2>
        <p
          className="mx-auto mt-2 max-w-md text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Upload one frame or an entire IG Carousel set. EXIF metadata from{' '}
          <code className="font-mono-tech text-xs">fix_exif.ps1</code> is read
          automatically inside your browser.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
            style={{ backgroundColor: 'var(--accent-amber)' }}
          >
            {isLoading ? 'Reading Film Scans...' : 'Choose Photos'}
          </span>

          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample();
            }}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:opacity-85"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--accent-amber)' }} />
            <span>Try Sample Film Photo</span>
          </button>
        </div>
      </div>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            icon: Film,
            title: '6 Film Templates',
            desc: '35mm strips, negative rebates, matte cards & half-frame diptychs.',
          },
          {
            icon: Camera,
            title: 'EXIF Read & Write',
            desc: 'Parses Camera, Lens, Film & EI, and re-injects EXIF on JPEG export.',
          },
          {
            icon: Upload,
            title: '3:4 IG Ready',
            desc: 'Default 2160 × 2880 Profile Grid with zero cropping & batch ZIP.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Icon className="mb-2 h-4 w-4" style={{ color: 'var(--accent-amber)' }} />
            <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
