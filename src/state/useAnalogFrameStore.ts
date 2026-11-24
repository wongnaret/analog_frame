import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SCANNER } from '../core/exif/parser';
import { readExifFromFile } from '../core/exif/reader';
import { DEFAULT_ASPECT_RATIO_ID } from '../core/presets/aspectRatios';
import { inferIsoFromFilmStock } from '../core/presets/filmStocks';
import {
  loadGearHistory,
  loadSavedWatermarkText,
  recordMetadataInGearHistory,
  saveWatermarkText,
} from '../core/presets/gearStorage';
import { DEFAULT_MATTE_ID } from '../core/presets/mattePalettes';
import { DEFAULT_WATERMARK_TEXT } from '../core/renderer/typography';
import { DEFAULT_TEMPLATE_ID } from '../core/templates/registry';
import type {
  ExportOptions,
  FrameSettings,
  GearHistory,
  PhotoItem,
  PhotoMetadata,
  RotationDegrees,
} from '../core/types';

const THEME_STORAGE_KEY = 'analog_frame_theme_v1';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `frame_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function readImageDimensions(
  objectUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not load image dimensions'));
    img.src = objectUrl;
  });
}

function loadInitialTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  return 'dark';
}

export function useAnalogFrameStore() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(loadInitialTheme);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [gearHistory, setGearHistory] = useState<GearHistory>(() => loadGearHistory());
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'jpeg',
    jpegQuality: 0.95,
    preserveExif: true,
  });

  const photosRef = useRef<PhotoItem[]>(photos);
  photosRef.current = photos;

  // Sync HTML root class for Tailwind & CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Revoke remaining object URLs on unmount
  useEffect(() => {
    return () => {
      for (const item of photosRef.current) {
        URL.revokeObjectURL(item.objectUrl);
      }
    };
  }, []);

  const selectedPhoto = useMemo(
    () => photos.find((p) => p.id === selectedId) ?? photos[0] ?? null,
    [photos, selectedId],
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const addFiles = useCallback(
    async (
      fileInput: FileList | File[],
      options: { selectAdded?: boolean } = {},
    ): Promise<PhotoItem[]> => {
      const files = Array.from(fileInput).filter(
        (file) =>
          file.type.startsWith('image/') ||
          /\.(jpe?g|png|webp|tiff?)$/i.test(file.name),
      );
      if (files.length === 0) return [];

      setIsLoadingFiles(true);
      try {
        const startCount = photosRef.current.length;
        const defaultTemplate =
          photosRef.current[0]?.settings.templateId ?? DEFAULT_TEMPLATE_ID;
        const defaultRatio =
          photosRef.current[0]?.settings.aspectRatioId ?? DEFAULT_ASPECT_RATIO_ID;
        const defaultMatte =
          photosRef.current[0]?.settings.matteId ?? DEFAULT_MATTE_ID;
        const defaultWatermark =
          photosRef.current[0]?.settings.watermarkText ??
          loadSavedWatermarkText(DEFAULT_WATERMARK_TEXT);
        const defaultVisibility = photosRef.current[0]?.settings.visibility ?? {
          showDate: false,
          showArtist: false,
          showFrameNumber: true,
          showCaption: false,
          showWatermark: true,
        };

        const loadedItems: PhotoItem[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const objectUrl = URL.createObjectURL(file);
          try {
            const [dims, exif] = await Promise.all([
              readImageDimensions(objectUrl),
              readExifFromFile(file),
            ]);

            const seqNum = String(startCount + i + 1).padStart(2, '0');
            const inferredIso =
              exif.metadata.iso || inferIsoFromFilmStock(exif.metadata.filmStock) || '';

            loadedItems.push({
              id: createId(),
              fileName: file.name,
              fileSize: file.size,
              objectUrl,
              width: dims.width,
              height: dims.height,
              exifDetected: exif.detected,
              metadata: {
                ...exif.metadata,
                scanner: exif.metadata.scanner || DEFAULT_SCANNER,
                iso: inferredIso,
                frameNumber: exif.metadata.frameNumber || `${seqNum}A`,
              },
              settings: {
                templateId: defaultTemplate,
                aspectRatioId: defaultRatio,
                matteId: defaultMatte,
                rotation: 0,
                visibility: { ...defaultVisibility },
                watermarkText: defaultWatermark,
                diptychPartnerId: null,
              },
            });
          } catch {
            URL.revokeObjectURL(objectUrl);
          }
        }

        if (loadedItems.length > 0) {
          setPhotos((prev) => [...prev, ...loadedItems]);
          if (options.selectAdded !== false) {
            setSelectedId((prevSelected) => prevSelected ?? loadedItems[0].id);
            if (options.selectAdded === true) {
              setSelectedId(loadedItems[0].id);
            }
          }
          // Record detected gear into history
          setGearHistory((prev) => {
            let next = prev;
            for (const item of loadedItems) {
              if (
                item.metadata.camera ||
                item.metadata.lens ||
                item.metadata.scanner ||
                item.metadata.filmStock ||
                item.metadata.artist
              ) {
                next = recordMetadataInGearHistory(next, item.metadata);
              }
            }
            return next;
          });
        }

        return loadedItems;
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [],
  );

  const addPartnerPhotoForSelected = useCallback(
    async (file: File) => {
      const targetId = selectedPhoto?.id;
      if (!targetId) return;
      const added = await addFiles([file], { selectAdded: false });
      if (added.length > 0) {
        const partnerId = added[0].id;
        setPhotos((prev) =>
          prev.map((item) =>
            item.id === targetId
              ? {
                  ...item,
                  settings: {
                    ...item.settings,
                    templateId: 'half-frame-diptych',
                    diptychPartnerId: partnerId,
                  },
                }
              : item,
          ),
        );
      }
    },
    [addFiles, selectedPhoto?.id],
  );

  const updateMetadata = useCallback(
    (id: string, patch: Partial<PhotoMetadata>) => {
      setPhotos((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, metadata: { ...item.metadata, ...patch } }
            : item,
        ),
      );
    },
    [],
  );

  const updateSettings = useCallback(
    (id: string, patch: Partial<FrameSettings>) => {
      if (patch.watermarkText !== undefined) {
        saveWatermarkText(patch.watermarkText);
      }
      setPhotos((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                settings: {
                  ...item.settings,
                  ...patch,
                  visibility: patch.visibility
                    ? { ...item.settings.visibility, ...patch.visibility }
                    : item.settings.visibility,
                },
              }
            : item,
        ),
      );
    },
    [],
  );

  const rotatePhoto = useCallback((id: string, delta: 90 | -90) => {
    setPhotos((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextRot = (((item.settings.rotation + delta) % 360) + 360) % 360;
        return {
          ...item,
          settings: {
            ...item.settings,
            rotation: nextRot as RotationDegrees,
          },
        };
      }),
    );
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.objectUrl);
      }
      const next = prev
        .filter((p) => p.id !== id)
        .map((p) =>
          p.settings.diptychPartnerId === id
            ? { ...p, settings: { ...p.settings, diptychPartnerId: null } }
            : p,
        );

      setSelectedId((cur) => {
        if (cur !== id) return cur;
        return next[0]?.id ?? null;
      });
      return next;
    });
  }, []);

  const applyTemplateToAll = useCallback((sourceId: string) => {
    setPhotos((prev) => {
      const source = prev.find((p) => p.id === sourceId);
      if (!source) return prev;
      return prev.map((item) => ({
        ...item,
        settings: {
          ...item.settings,
          templateId: source.settings.templateId,
        },
      }));
    });
  }, []);

  const applyCanvasToAll = useCallback((sourceId: string) => {
    setPhotos((prev) => {
      const source = prev.find((p) => p.id === sourceId);
      if (!source) return prev;
      return prev.map((item) => ({
        ...item,
        settings: {
          ...item.settings,
          aspectRatioId: source.settings.aspectRatioId,
          matteId: source.settings.matteId,
          visibility: { ...source.settings.visibility },
          watermarkText: source.settings.watermarkText,
        },
      }));
    });
  }, []);

  const applyGearToAll = useCallback((sourceId: string) => {
    setPhotos((prev) => {
      const source = prev.find((p) => p.id === sourceId);
      if (!source) return prev;
      return prev.map((item) => ({
        ...item,
        metadata: {
          ...item.metadata,
          camera: source.metadata.camera,
          lens: source.metadata.lens,
          scanner: source.metadata.scanner,
          filmStock: source.metadata.filmStock,
          iso: source.metadata.iso,
          artist: source.metadata.artist,
        },
      }));
    });
  }, []);

  const savePhotoGearToHistory = useCallback((id: string) => {
    const photo = photosRef.current.find((p) => p.id === id);
    if (!photo) return;
    setGearHistory((prev) => recordMetadataInGearHistory(prev, photo.metadata));
  }, []);

  return {
    photos,
    selectedId: selectedPhoto?.id ?? null,
    selectedPhoto,
    theme,
    isLoadingFiles,
    gearHistory,
    exportOptions,
    setSelectedId,
    setExportOptions,
    toggleTheme,
    addFiles,
    addPartnerPhotoForSelected,
    updateMetadata,
    updateSettings,
    rotatePhoto,
    removePhoto,
    applyTemplateToAll,
    applyCanvasToAll,
    applyGearToAll,
    savePhotoGearToHistory,
  };
}
