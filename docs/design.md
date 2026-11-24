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
   - Hosts crisp, mobile-legible **English typography** in a split left/right footer region (`Camera · Lens` on line 1 left, `Scanner` on line 2 left; `Film Stock` and `ISO` on the right), except `editorial-card`, which embeds a dedicated spec card directly inside the frame.
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
   - Classic black 35mm film strip with rounded sprocket holes along the long edges, subtle rounded film gate, and edge markings (film stock, frame counter, directional arrows) tinted subtly by film brand (Kodak amber, Fuji green, CineStill tungsten, Ilford silver).
3. **Film Rebate (`film-rebate`)**:
   - Sprocket-free black negative border with subtle film-gate notches and minimal edge markings.
4. **Editorial Spec Card (`editorial-card`)**:
   - Warm archival card framing the photo with a structured, bold typography specification block underneath (`CAMERA`, `LENS`, `FILM`, `ISO`, `DATE`, `ARTIST`).
5. **Half-Frame Single (`half-frame-single`)**:
   - Authentic vertical 35mm half-frame strip (left/right sprockets, Pentax 17-inspired half-frame gate and dual frame markers like `01 / 01A`).
6. **Half-Frame Diptych (`half-frame-diptych`)**:
   - Horizontal 35mm sprocket strip holding **two** half-frame photos side-by-side separated by a crisp black film septum (`septum`), allowing users to pair any two photos from their batch (or upload a second frame directly).

---

## 4. Metadata & Film Presets
- **Primary Fields** (shown on frame): `Camera` (`Make` + `Model`), `Lens`, `Scanner`, `Film Stock`, `ISO`.
- **Optional Toggle Fields**: `Date`, `Artist`, `Frame No.`, `Custom Caption`.
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
  - Thumb-friendly bottom tab bar (`Frame`, `Canvas`, `Metadata`, `Export`).
  - Batch tools: **Apply Style to All**, **Apply Canvas to All**, **Apply Gear to All**, and **Export All as ZIP**.
  - Mobile-native **Web Share API** ("Save / Share Photo") to save directly to Apple Photos / Google Photos with key EXIF preserved.
