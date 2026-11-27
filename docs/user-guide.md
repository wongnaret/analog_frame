# Analog Frame — User Guide

## 1. Preparing Film Scans with `fix_exif.ps1` (Optional)
If your lab scans do not contain camera or film metadata, you can tag an entire folder beforehand on Windows using [`fix_exif/fix_exif.ps1`](../fix_exif/fix_exif.ps1):

1. Ensure `exiftool.exe` (and `exiftool_files/`) sits alongside `fix_exif.ps1` locally.
2. Run in PowerShell:
   ```powershell
   .\fix_exif\fix_exif.ps1 -FolderName "4140_ILFORD_HP5_Plus_400" -Date "2026-09-13" -Film "Ilford HP5 Plus 400" -ISO "400" -Camera "Pentax 17" -Lens "25mm F3.5"
   ```
3. You can also skip `fix_exif.ps1` and enter or edit all metadata directly inside Analog Frame.

---

## 2. Framing Photos in the Web App

### Step 1: Upload Photos
- Tap **Choose Photos** or **Add Photos** (or drag and drop files on desktop) to load one photo or an entire roll/carousel set.
- Tap **Try Sample Film Photo** on the welcome screen to test the workflow immediately with an EXIF-tagged sample frame.

### Step 2: Choose a Frame Style (`Frame` Tab)
Pick from 6 authentic analog templates:
- **Minimal Matte** *(Default)*: Clean gallery presentation with subtle shadow and hairline border.
- **35mm Strip**: Black 35mm film border with **8 rounded sprocket holes** per side and outer-margin film emulsion name, frame markers, and DX edge barcode.
- **Film Rebate**: Clean black negative border with film-gate notches and no sprockets.
- **Editorial Card**: Archival spec card featuring bold typography directly under the scan.
- **Half-Frame**: Authentic 35mm half-frame strip with **4 rounded sprocket holes** along the short edges (top/bottom on portrait scans).
- **Half-Frame Diptych**: Side-by-side 2-photo half-frame strip inside a single **8-perforation** 35mm film frame (4 holes per frame), automatically numbering Frame 2 sequentially from Frame 1. Select a second photo from your uploaded batch (or tap **Upload 2nd Photo**).

Use the **-90° / +90° Rotate** buttons below the preview if a scan needs orientation adjustment, or click **Apply to All** in the `Frame` tab to match every photo in your IG Carousel.

### Step 3: Set Instagram Ratio & Matte (`Canvas` Tab)
- **Aspect Ratio**:
  - `3:4 Profile Grid` (`2160 × 2880`) — **Default**, matches Instagram's vertical profile grid cleanly.
  - `4:5 IG Feed` (`2160 × 2700`) — Classic tall feed post.
  - `1:1 Square` (`2160 × 2160`) — Square feed post.
  - `9:16 Story` (`2160 × 3840`) — Instagram Stories & Reels cover.
- **Outer Matte**: Switch between **White** (default), **Warm Paper**, and **Darkroom** black.
- **Footer Watermark & Field Toggles**: The outer matte footer displays labeled values (`CAMERA: ... · LENS: ...` and `SCANNER: ...` on the left, with `FILM: ...` and `ISO: ...` on the right for **Film** photos — or `CAMERA: ...` and `LENS: ...` on the left with `<FOCAL> · <APERTURE> · <SHUTTER>` and `ISO: ...` on the right for **Digital** photos). Edit or toggle **Footer Watermark** directly inside either the **Canvas** or **Metadata** tab (defaults to `ANALOG FRAME`, includes a **Reset** button, and remembers your latest value automatically in browser storage). Optional toggles control `Shooting Date` (Editorial Card), `Frame Number` (35mm film borders), `Photographer / Artist`, and `Custom Caption`. Shooting dates remain preserved in exported JPEG EXIF even when hidden from the frame.
- Tap **Apply to All** to apply the ratio, matte, watermark, and field visibility across all uploaded photos.

### Step 4: Review & Edit EXIF Metadata (`Metadata` Tab)
- **Film / Digital Auto-Detection**: Analog Frame inspects EXIF tags on upload and switches automatically between **Film** mode (when `Film:` / scanner tags are found, or on EXIF-less lab scans) and **Digital** mode (when digital camera models or electronic exposure settings such as `FocalLength`, `FNumber`, and `ExposureTime` are present without film/scanner markers). You can manually switch between `Film` and `Digital` at any time via the **Capture Mode** toggle at the top of the `Metadata` tab.
- **Film Mode Fields**: `Camera`, `Lens`, `Scanner` (defaults to `Noritsu HS-1800` in Film mode, with quick-pick presets such as `Noritsu HS-1800` and `Frontier SP-3000`), `Film Stock` (type freely or pick from the curated film dropdown), `ISO / EI`, `Frame No.`, `Shooting Date`, `Artist / Credit`, `Custom Caption`, and `Footer Watermark`.
- **Digital Mode Fields**: `Camera`, `Lens`, `Focal` (e.g. `35mm`), `Aperture` (e.g. `f/1.4`), `Shutter` (e.g. `1/500s`), `ISO`, `Shooting Date`, `Artist / Credit`, `Custom Caption`, and `Footer Watermark` (`Scanner`, `Film Stock`, and `Frame No.` are hidden).
- Previously used gear is saved locally in your browser (or tap **Save Gear** manually) as quick-pick chips under `Camera`, `Lens`, `Scanner`, and `Film Stock`.
- Tap **Apply Gear to All** to copy `Capture Mode`, `Camera`, `Lens`, `Scanner`, `Film Stock`, `ISO`, and `Artist` across your whole batch while preserving each frame's individual date and frame number.

### Step 5: Generate & Copy IG Caption (`Caption` Tab)
- Open the **Caption** tab to review your auto-generated Instagram caption (`Camera`, `Lens` when filled, plus `Film` + up to 5 sharp analog hashtags in **Film** mode, or `Settings: <focal · aperture · shutter · ISO>` + 5 digital/camera hashtags in **Digital** mode, tailored to Instagram's 5-tag limit).
- Toggle **Opening Line** *(default OFF)* to add a stoic/vintage English opening line, pick a **Vibe / Mood** (`Auto`, `Stoic`, `Light`, `Street`, `Mechanical`, `Night`, `B&W`), shuffle lines, or optionally enter a personal **Gemini API Key (BYOK)** to analyze the photo directly from your browser.
- Toggle **Include Scanner** *(default OFF)* if you want `Scanner:` included in the caption text.
- Edit any text freely in the **Instagram Caption** textarea, click `×` on hashtag chips to remove tags, or add custom `#hashtags` (saved locally for quick reuse).
- Tap **Copy IG Caption** (also available as a shortcut inside the **Export** tab).

### Step 6: Export for Instagram (`Export` Tab)
- Choose **JPEG (95%)** *(recommended)* or **PNG (Lossless)**.
- Keep **Preserve EXIF in JPEG** enabled so saved photos retain their original shooting date and camera/film tags in Apple Photos or Google Photos.
- **Single Photo**:
  - On mobile (iOS/Android), tap **Copy Caption & Share Frame** to copy your IG caption to the clipboard and open the native share sheet directly to Instagram (or tap **Save Image**).
  - On desktop, click **Copy Caption & Share Frame** or **Download File Directly**.
- **Batch Carousel**:
  - Tap **Export All N Photos as ZIP** to render every photo in the queue at full resolution (`2160px` width) and download a single `.zip` archive.

---

## 3. Installing as a Mobile App (PWA)
Analog Frame works offline once loaded:
- **iOS (Safari)**: Open the site → tap the **Share** icon → **Add to Home Screen**.
- **Android (Chrome)**: Open the site → tap the menu (`⋮`) → **Install app** / **Add to Home screen**.
