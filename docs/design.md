# Analog Frame — Product & Visual Design Specification

## 1. Vision
**Analog Frame** is a lean, mobile-first Progressive Web App (PWA) crafted for film photographers who scan their negatives and want to publish authentic, EXIF-annotated frames to Instagram without desktop bloat or cloud upload costs.

All processing happens **100% locally in the browser** via HTML5 Canvas 2D, `exifr`, `piexifjs`, and `fflate`, making the app fast, private, and free to host on Firebase Hosting's Spark tier.

---

## 2. Layered Canvas Model
Every exported image combines two distinct visual layers inside an Instagram-exact output canvas:

1. **Layer 1 — Outer IG Canvas & Matte**:
   - Guarantees an exact Instagram-friendly aspect ratio regardless of the scanned photo's proportions (35mm 3:2, half-frame 3:4, medium format 6×6 / 6×7, or panoramic).
   - **Never crops** the film scan; the inner frame fits cleanly inside the matte with balanced margins.
   - Hosts crisp, mobile-legible **English typography** in a labeled split left/right footer region (`CAMERA: ... · LENS: ...` and `SCANNER: ...` on the left; `FILM: ...` and `ISO: ...` on the right for **Film** mode — or `CAMERA: ...` / `LENS: ...` on the left and `<FOCAL> · <APERTURE> · <SHUTTER>` / `ISO: ...` on the right for **Digital** mode), except `editorial-card`, which embeds a dedicated spec card directly inside the frame.
   - Displays a subtle tracked **Footer Watermark** (`ANALOG FRAME` by default, customizable and remembered in `localStorage`) along the bottom edge.
2. **Layer 2 — Inner Film Frame Template**:
   - Renders authentic analog borders around the scanned photo (sprockets, rebate notches, edge markings, matte hairlines, or half-frame diptych septum).

### Instagram Aspect Ratio Presets
| Preset ID | Label | Output Resolution | Default |
| :--- | :--- | :--- | :--- |
| `3:4` | `3:4 Profile Grid` | `2160 × 2880` px | **Yes** |
| `4:5` | `4:5 IG Feed` | `2160 × 2700` px | No |
| `1:1` | `1:1 Square` | `2160 × 2160` px | No |
| `9:16` | `9:16 Story` | `2160 × 3840` px | No |

### Outer Matte Palettes
- **White** (`white`, default): `#FFFFFF` gallery paper with `#141414` primary ink and `#666666` secondary ink.
- **Warm Paper** (`warm-paper`): `#F5F1E8` cotton stock with `#1C1A17` primary ink and `#6F6A61` secondary ink.
- **Darkroom** (`darkroom`): `#101010` matte black with `#F2F0EB` primary ink and `#96928A` secondary ink.

---

## 3. Frame Templates (v1)
1. **Minimal Matte (`minimal-matte`)** *(default)*:
   - Clean gallery presentation with a subtle drop shadow and crisp hairline border on the outer matte.
2. **35mm Film Strip (`35mm-sprocket`)**:
   - Classic black 35mm film strip with **8 rounded ISO 1007 sprocket holes** per long edge, subtle rounded film gate, and authentic outer-margin edge markings (film emulsion code such as `KODAK GB 200-7` or `ILFORD HP5 PLUS`, frame counter + arrow, and DX edge barcode on color/cinema stocks) tinted by film brand.
3. **Film Rebate (`film-rebate`)**:
   - Sprocket-free black negative border with subtle film-gate notches and minimal edge markings.
4. **Editorial Spec Card (`editorial-card`)**:
   - Warm archival card framing the photo with a structured, bold typography specification block underneath (`CAMERA`, `LENS`, `FILM`, `ISO`, `DATE`, `ARTIST` in Film mode; `CAMERA`, `LENS`, `FOCAL`, `APERTURE`, `SHUTTER`, `ISO`, `DATE`, `ARTIST` in Digital mode).
5. **Half-Frame Single (`half-frame-single`)**:
   - Authentic 35mm half-frame strip featuring **4 rounded sprocket holes** along the narrow 17–18 mm edges (top/bottom on portrait half-frames, left/right on rotated landscape half-frames) with outer-margin film emulsion name and frame markers.
6. **Half-Frame Diptych (`half-frame-diptych`)**:
   - Horizontal 35mm **8-perforation** rounded sprocket strip (4 holes aligned over each half-frame) holding **two** half-frame photos side-by-side separated by a crisp black film septum (`septum`), with outer-margin film codes and sequential frame numbers (`N`, `N+1` continuing from the first photo).

---

## 4. Metadata & Film Presets
- **Capture Modes (`Film` | `Digital`)**: Auto-detected from EXIF (`Film` when `Film:`/`Scanner` markers exist or when no digital exposure/body markers are found; `Digital` when known digital models or electronic exposure telemetry `FocalLength` / `FNumber` / `ExposureTime` exist without film/scanner markers), with a manual toggle in the `Metadata` tab.
- **Primary Fields (Film Mode)**: `Camera` (`Make` + `Model`), `Lens`, `Scanner` (defaults to `Noritsu HS-1800`), `Film Stock`, `ISO`.
- **Primary Fields (Digital Mode)**: `Camera`, `Lens`, `Focal` (`35mm`), `Aperture` (`f/1.4`), `Shutter` (`1/500s`), `ISO` (`Scanner`, `Film Stock`, and `Frame No.` are hidden).
- **Optional Toggle Fields**: `Date`, `Artist`, `Frame No.` (Film mode), `Custom Caption`.
- **EXIF Auto-Detection**: Automatically parses tags written by `fix_exif/fix_exif.ps1` (`Film: <stock> | EI: <iso>` inside `ImageDescription` / `UserComment` / `XMP:Description`) as well as standard camera EXIF.
- **Quick-Fill & Gear Memory**:
  - Curated dropdown of ~20 popular 35mm/120 film stocks with automatic ISO inference.
  - `localStorage` remembers previously entered cameras, lenses, film stocks, and artists for one-tap filling.

---

## 5. UI Aesthetic & Mobile UX
- **Darkroom Minimal Theme**: Deep charcoal workspace (`#0E0E10`) by default so white outer mattes and film scans pop with accurate contrast, paired with a Light theme toggle.
- **Typography**: `Space Grotesk` for crisp technical headings, `JetBrains Mono` for EXIF/EI specs, and `Newsreader` for optional editorial captions.
- **Mobile-First Layout**:
  - Sticky live canvas preview at the top + compact scrollable filmstrip queue.
  - Thumb-friendly bottom tab bar (`Frame`, `Canvas`, `Metadata`, `Caption`, `Export`).
  - Batch tools: **Apply Style to All**, **Apply Canvas to All**, **Apply Gear to All**, and **Export All as ZIP**.
  - **IG Caption Generator (`@flk.analog`)**: Dedicated `Caption` tab + `Copy IG Caption` shortcut in `Export` tab. Formats `Camera / Lens / Film` (or `Camera / Lens / Settings` in Digital mode, with optional `Opening Line` and `Include Scanner` toggles, both OFF by default and persisted in `localStorage`) plus up to 5 sharp core, camera-specific, and film/digital hashtags (matching Instagram's 5-tag limit), editable textarea, removable/addable hashtag chips, and optional BYOK Gemini 2.5 Flash photo analysis.
  - Mobile-native **Web Share API** (**Copy Caption & Share Frame**) to copy the IG caption and open the native share sheet directly to Instagram / Apple Photos / Google Photos with key EXIF preserved.
  - Non-intrusive **Cookie & Browser Storage Consent** banner (`Accept Cookies` / `Essential Only`) positioned cleanly above the mobile tab bar, wired to Google Consent Mode v2 (`VITE_GA4_MEASUREMENT_ID`, disabled on `localhost`) for optional anonymous usage & gear analytics.
