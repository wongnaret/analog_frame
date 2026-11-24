import { Download, Film, Sliders, Tag } from 'lucide-react';
import { useState } from 'react';
import { CanvasControls } from './components/CanvasControls';
import { CanvasPreview } from './components/CanvasPreview';
import { EmptyUploadState } from './components/EmptyUploadState';
import { ExportControls } from './components/ExportControls';
import { FilmstripQueue } from './components/FilmstripQueue';
import { FrameControls } from './components/FrameControls';
import { Header } from './components/Header';
import { MetadataControls } from './components/MetadataControls';
import {
  buildExportFilename,
  exportBatchAsZip,
  renderPhotoToExportBlob,
  shareOrDownloadBlob,
  triggerBlobDownload,
} from './core/export/exporter';
import { generateSamplePhotoFile } from './core/sample/generateSamplePhoto';
import { useAnalogFrameStore } from './state/useAnalogFrameStore';

type InspectorTab = 'frame' | 'canvas' | 'metadata' | 'export';

const TABS: Array<{ id: InspectorTab; label: string; icon: typeof Film }> = [
  { id: 'frame', label: 'Frame', icon: Film },
  { id: 'canvas', label: 'Canvas', icon: Sliders },
  { id: 'metadata', label: 'Metadata', icon: Tag },
  { id: 'export', label: 'Export', icon: Download },
];

export function App() {
  const store = useAnalogFrameStore();
  const [activeTab, setActiveTab] = useState<InspectorTab>('frame');
  const [isExporting, setIsExporting] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedPhoto = store.selectedPhoto;
  const partnerPhoto =
    selectedPhoto?.settings.diptychPartnerId
      ? store.photos.find((p) => p.id === selectedPhoto.settings.diptychPartnerId) ??
        null
      : null;

  const handleLoadSample = async () => {
    const file = await generateSamplePhotoFile();
    await store.addFiles([file], { selectAdded: true });
  };

  const handleExportCurrent = async (mode: 'share-or-download' | 'download') => {
    if (!selectedPhoto) return;
    setIsExporting(true);
    setStatusMessage('Rendering 2× Instagram frame...');
    try {
      const blob = await renderPhotoToExportBlob(
        selectedPhoto,
        partnerPhoto,
        store.exportOptions,
      );
      const filename = buildExportFilename(
        selectedPhoto.fileName,
        selectedPhoto.settings.aspectRatioId,
        selectedPhoto.settings.templateId,
        store.exportOptions.format,
      );

      if (mode === 'download') {
        triggerBlobDownload(blob, filename);
        setStatusMessage(`Downloaded ${filename}`);
      } else {
        const outcome = await shareOrDownloadBlob(blob, filename);
        setStatusMessage(
          outcome === 'shared'
            ? `Shared ${filename}`
            : outcome === 'cancelled'
              ? 'Share cancelled'
              : `Saved ${filename}`,
        );
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Export failed',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllZip = async () => {
    if (store.photos.length === 0) return;
    setIsExporting(true);
    setZipProgress({ completed: 0, total: store.photos.length });
    setStatusMessage('Building ZIP archive...');
    try {
      await exportBatchAsZip(store.photos, store.exportOptions, (completed, total) => {
        setZipProgress({ completed, total });
      });
      setStatusMessage(`Exported ${store.photos.length} frames to ZIP`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'ZIP export failed',
      );
    } finally {
      setIsExporting(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      <Header
        photoCount={store.photos.length}
        theme={store.theme}
        onToggleTheme={store.toggleTheme}
        onAddFiles={(files) => void store.addFiles(files)}
        onQuickExport={() => void handleExportCurrent('share-or-download')}
        isExporting={isExporting}
      />

      {!selectedPhoto ? (
        <EmptyUploadState
          isLoading={store.isLoadingFiles}
          onAddFiles={(files) => void store.addFiles(files)}
          onLoadSample={() => void handleLoadSample()}
        />
      ) : (
        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pt-4 lg:grid-cols-12 lg:pt-6">
          {/* Left Column: Live Canvas Preview & Filmstrip Queue */}
          <section className="lg:sticky lg:top-20 lg:col-span-7 lg:self-start">
            <CanvasPreview
              photo={selectedPhoto}
              partnerPhoto={partnerPhoto}
              onRotate={(delta) => store.rotatePhoto(selectedPhoto.id, delta)}
            />

            <FilmstripQueue
              photos={store.photos}
              selectedId={selectedPhoto.id}
              onSelect={store.setSelectedId}
              onRemove={store.removePhoto}
              onAddFiles={(files) => void store.addFiles(files)}
            />
          </section>

          {/* Right Column: Inspector Tabs & Controls */}
          <section className="lg:col-span-5">
            <div
              className="rounded-2xl border p-4 sm:p-5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Desktop Tab Bar */}
              <div
                className="mb-5 hidden grid-cols-4 gap-1 rounded-xl border p-1 lg:grid"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {TABS.map(({ id, label, icon: Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition"
                      style={{
                        backgroundColor: active
                          ? 'var(--bg-surface)'
                          : 'transparent',
                        color: active
                          ? 'var(--accent-amber)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {activeTab === 'frame' && (
                <FrameControls
                  photo={selectedPhoto}
                  photos={store.photos}
                  onSelectTemplate={(templateId) =>
                    store.updateSettings(selectedPhoto.id, { templateId })
                  }
                  onSelectDiptychPartner={(diptychPartnerId) =>
                    store.updateSettings(selectedPhoto.id, { diptychPartnerId })
                  }
                  onUploadDiptychPartner={(file) =>
                    void store.addPartnerPhotoForSelected(file)
                  }
                  onApplyTemplateToAll={() =>
                    store.applyTemplateToAll(selectedPhoto.id)
                  }
                />
              )}

              {activeTab === 'canvas' && (
                <CanvasControls
                  photo={selectedPhoto}
                  totalPhotos={store.photos.length}
                  onChangeRatio={(aspectRatioId) =>
                    store.updateSettings(selectedPhoto.id, { aspectRatioId })
                  }
                  onChangeMatte={(matteId) =>
                    store.updateSettings(selectedPhoto.id, { matteId })
                  }
                  onToggleVisibility={(key) =>
                    store.updateSettings(selectedPhoto.id, {
                      visibility: {
                        ...selectedPhoto.settings.visibility,
                        [key]: !selectedPhoto.settings.visibility[key],
                      },
                    })
                  }
                  onChangeWatermarkText={(watermarkText) =>
                    store.updateSettings(selectedPhoto.id, { watermarkText })
                  }
                  onApplyCanvasToAll={() =>
                    store.applyCanvasToAll(selectedPhoto.id)
                  }
                />
              )}

              {activeTab === 'metadata' && (
                <MetadataControls
                  photo={selectedPhoto}
                  totalPhotos={store.photos.length}
                  gearHistory={store.gearHistory}
                  onUpdateMetadata={(patch) =>
                    store.updateMetadata(selectedPhoto.id, patch)
                  }
                  onSaveGearToHistory={() =>
                    store.savePhotoGearToHistory(selectedPhoto.id)
                  }
                  onApplyGearToAll={() =>
                    store.applyGearToAll(selectedPhoto.id)
                  }
                />
              )}

              {activeTab === 'export' && (
                <ExportControls
                  photo={selectedPhoto}
                  totalPhotos={store.photos.length}
                  exportOptions={store.exportOptions}
                  isExporting={isExporting}
                  zipProgress={zipProgress}
                  statusMessage={statusMessage}
                  onChangeOptions={(patch) =>
                    store.setExportOptions((prev) => ({ ...prev, ...patch }))
                  }
                  onShareOrSaveCurrent={() =>
                    void handleExportCurrent('share-or-download')
                  }
                  onDownloadCurrent={() => void handleExportCurrent('download')}
                  onExportAllZip={() => void handleExportAllZip()}
                />
              )}
            </div>
          </section>
        </main>
      )}

      {/* Mobile Sticky Bottom Tab Bar */}
      {selectedPhoto && (
        <nav
          aria-label="Editor tabs"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t backdrop-blur-md lg:hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-app) 92%, transparent)',
            borderColor: 'var(--border-subtle)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition"
                style={{
                  color: active
                    ? 'var(--accent-amber)'
                    : 'var(--text-secondary)',
                }}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default App;
