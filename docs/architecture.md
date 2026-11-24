# Analog Frame — System Architecture

## 1. Directory Structure
```text
analog_frame/
├── .gitignore                  # Excludes fix_exif binaries, node_modules, dist, .firebase
├── AGENTS.md                   # Repository engineering rules
├── README.md                   # Project overview & quick links
├── firebase.json               # Firebase Hosting SPA & cache configuration
├── .firebaserc.example         # Template Firebase project mapping
├── docs/                       # Product, architecture, user, and setup docs
├── fix_exif/
│   └── fix_exif.ps1            # PowerShell ExifTool batch tagging script
├── public/                     # PWA icons (icon.svg, icon-192.png, icon-512.png)
└── src/
    ├── core/                   # Framework-agnostic TypeScript modules (reusable)
    │   ├── types/              # Shared TypeScript interfaces and types
    │   ├── exif/               # EXIF parser (exifr) & JPEG EXIF writer (piexifjs)
    │   ├── presets/            # Aspect ratios, matte palettes, film stocks, localStorage gear
    │   ├── templates/          # Modular frame template registry & 6 renderers
    │   ├── renderer/           # Layered Canvas 2D engine, fit math & typography
    │   ├── export/             # JPEG/PNG encoder, Web Share API, ZIP bundler
    │   └── sample/             # In-browser sample film scan generator with EXIF
    ├── state/                  # React store hook (useAnalogFrameStore)
    ├── components/             # Mobile-first Darkroom UI components
    ├── App.tsx                 # Responsive studio shell (Desktop 2-col / Mobile tabs)
    ├── main.tsx                # Application bootstrap
    └── index.css               # Tailwind CSS v4 + Darkroom theme variables
```

---

## 2. Module Boundaries & Reusability
`src/core/` has **zero dependencies on React or DOM UI components**. Any module under `src/core/` can be imported into another frontend framework, Web Worker, or CLI/test harness:

- **`src/core/exif/parser.ts`**: Pure function `parseAnalogExif(raw)` converts raw EXIF/XMP dictionaries into normalized `PhotoMetadata`.
- **`src/core/exif/reader.ts`**: Browser wrapper calling `exifr.parse(file, { tiff: true, exif: true, xmp: true, userComment: true })`.
- **`src/core/exif/writer.ts`**: Injects key metadata back into exported JPEG Data URLs/Blobs using `piexifjs`, sanitizing ASCII-only tags safely.
- **`src/core/presets/gearStorage.ts`**: Persists previously used `cameras`, `lenses`, `scanners`, `filmStocks`, `artists`, and the last-edited footer `watermarkText` in `localStorage`.
- **`src/core/presets/cookieConsent.ts`**: Persists and reads cookie/local-storage consent (`accepted` or `essential`) across `localStorage` and `document.cookie`.
- **`src/core/renderer/layout.ts`**: Pure geometry (`computeCanvasLayout`, `fitRectInBox`, `getRotatedDimensions`, `drawRotatedImage`) ensuring zero-crop fitting at any scale.
- **`src/core/templates/registry.ts`**: Central template registry (`TEMPLATES`, `getTemplate`). Adding a new frame style only requires implementing `FrameTemplate` and registering it here.
- **`src/core/export/exporter.ts`**: Handles high-resolution rendering (`scale = 1`), EXIF re-injection, `navigator.share({ files })` on mobile, and sequential low-memory ZIP creation via `fflate`.

---

## 3. EXIF Schema Compatibility (`fix_exif.ps1`)
`fix_exif/fix_exif.ps1` writes film metadata into standard EXIF & XMP tags. Analog Frame reads and writes these exact tags:

| Analog Frame Field | Read Priority (`exifr` tags) | Written Back to Exported JPEG (`piexifjs`) |
| :--- | :--- | :--- |
| `camera` | `Make` + `Model` (deduplicated if `Model` already starts with `Make`) | `0th.Make` + `0th.Model` (split on first whitespace) |
| `lens` | `LensModel`, `Lens` | `Exif.LensModel` (`0xA434`) |
| `filmStock` | `Film: <stock> \| EI: <iso>` parsed from `ImageDescription`, `UserComment`, `XMP:Description` | `0th.ImageDescription` & `Exif.UserComment` (`Film: <stock> \| EI: <iso> \| Frame: <no>`) |
| `iso` | `EI` from `Film: ... \| EI: ...`, fallback to `ISO` / `ISOSpeedRatings` / `PhotographicSensitivity` | `Exif.ISOSpeedRatings` (integer) |
| `frameNumber` | `ImageNumber` (`0x9211`), `FrameNumber`, `Frame: <no>` in comment, or lab-scan filename fallback | `0th.ImageNumber` (`0x9211`) & `Frame: <no>` in `Exif.UserComment` |
| `date` / `exifDateTime` | `DateTimeOriginal`, `CreateDate`, `ModifyDate` (formatted in local wall-clock time to prevent UTC shifts) | `0th.DateTime`, `Exif.DateTimeOriginal`, `Exif.DateTimeDigitized` |
| `artist` | `Artist`, `Copyright` | `0th.Artist`, `0th.Copyright` |

### Why Preserve EXIF on Export?
HTML5 `<canvas>.toBlob()` strips all metadata from exported images. Re-injecting `DateTimeOriginal`, `Make`, `Model`, `LensModel`, `ISO`, `ImageDescription`, and `Artist` into exported JPEGs ensures that saving frames into **Apple Photos** or **Google Photos** sorts them chronologically by the original shooting date rather than today's export date.

---

## 4. Canvas 2D Rendering Pipeline
```text
PhotoItem + Optional Diptych Partner
   │
   ▼
computeCanvasLayout(aspectRatioId, scale, usesCustomFooter)
   ├── outerCanvasRect  (e.g. 2160 × 2880 at scale=1, or capped <=1200px in preview)
   ├── frameRegionRect  (safe inset area for inner film template)
   ├── footerRegionRect (split left/right outer matte typography region)
   └── watermarkRegion  (subtle bottom footer watermark strip)
   │
   ▼
1. Fill Outer Matte Background (White / Warm Paper / Darkroom)
2. Invoke FrameTemplate.render(ctx, params)
   ├── Draw film border / sprockets / notches / hairline / spec card
   ├── Fit & draw rotated photo(s) without cropping
   └── Draw authentic film edge markings (using getFilmAccentColor)
3. Unless template.usesCustomFooter === true:
   └── drawOuterTypography(ctx, footerRegionRect, metadata, visibility, palette)
4. drawFooterWatermark(ctx, watermarkRegion, watermarkText, showWatermark, palette)
```

### Memory Management on Mobile
- **Preview**: `CanvasPreview` renders at a capped display scale (`<= 1200px` max side, scaled by `devicePixelRatio`) so scrubbing edits on phones stays smooth at 60fps.
- **Batch ZIP Export**: `exportBatchAsZip` reuses a **single** offscreen `<canvas>` sequentially across photos and bundles JPEG bytes with `fflate.zipSync(..., { level: 0 })` (store mode, zero re-compression CPU overhead).

---

## 5. Adding a New Frame Template
1. Create `src/core/templates/myNewTemplate.ts` implementing `FrameTemplate`:
   - `id`, `name`, `shortDescription`, `supportsDiptych`, `usesCustomFooter`, and `render(ctx, params)`.
   - Reuse helpers from `src/core/templates/drawFilmHelpers.ts`.
2. Add the new `TemplateId` union member in `src/core/types/index.ts`.
3. Register the template in `src/core/templates/registry.ts`.
4. Add an icon representation in `src/components/TemplateIcons.tsx`.
5. Update `docs/design.md` and `docs/architecture.md` per `AGENTS.md`.
