import { Plus, X } from 'lucide-react';
import { useRef } from 'react';
import type { PhotoItem } from '../core/types';

interface FilmstripQueueProps {
  photos: PhotoItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddFiles: (files: FileList) => void;
}

export function FilmstripQueue({
  photos,
  selectedId,
  onSelect,
  onRemove,
  onAddFiles,
}: FilmstripQueueProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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

      {photos.map((photo, index) => {
        const isActive = photo.id === selectedId;
        return (
          <div
            key={photo.id}
            className="group relative shrink-0"
          >
            <button
              type="button"
              onClick={() => onSelect(photo.id)}
              className="relative h-16 w-16 overflow-hidden rounded-xl border-2 transition"
              style={{
                borderColor: isActive
                  ? 'var(--accent-amber)'
                  : 'var(--border-subtle)',
              }}
            >
              <img
                src={photo.objectUrl}
                alt={photo.fileName}
                className="h-full w-full object-cover"
              />
              <span className="font-mono-tech absolute bottom-0.5 left-0.5 rounded bg-black/75 px-1 py-0.5 text-[9px] text-white">
                {photo.metadata.frameNumber || String(index + 1).padStart(2, '0')}
              </span>
            </button>

            <button
              type="button"
              aria-label={`Remove ${photo.fileName}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(photo.id);
              }}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white opacity-90 shadow transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Add more photos"
        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-[10px] font-medium transition hover:opacity-80"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <Plus className="h-4 w-4" />
        <span>Add</span>
      </button>
    </div>
  );
}
