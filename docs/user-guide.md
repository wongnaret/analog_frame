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
- **35mm Strip**: Black 35mm film border with sprocket holes and film-brand edge markings.
- **Film Rebate**: Clean black negative border with film-gate notches and no sprockets.
- **Minimal Matte**: Gallery presentation with subtle shadow and hairline border.
- **Editorial Card**: Archival spec card featuring bold typography directly under the scan.
- **Half-Frame**: Vertical half-frame 35mm strip (ideal for Pentax 17 / Olympus Pen scans).
- **Half-Frame Diptych**: Side-by-side 2-photo half-frame strip inside a single 35mm film frame. Select a second photo from your uploaded batch (or tap **Upload 2nd Photo**).

Use the **-90° / +90° Rotate** buttons below the preview if a scan needs orientation adjustment, or click **Apply to All** in the `Frame` tab to match every photo in your IG Carousel.

### Step 3: Set Instagram Ratio & Matte (`Canvas` Tab)
- **Aspect Ratio**:
  - `3:4 Profile Grid` (`2160 × 2880`) — **Default**, matches Instagram's vertical profile grid cleanly.
  - `4:5 IG Feed` (`2160 × 2700`) — Classic tall feed post.
  - `1:1 Square` (`2160 × 2160`) — Square feed post.
  - `9:16 Story` (`2160 × 3840`) — Instagram Stories & Reels cover.
- **Outer Matte**: Switch between **White** (default), **Warm Paper**, and **Darkroom** black.
- **Field Toggles**: Show or hide optional `Shooting Date`, `Frame Number`, `Photographer / Artist`, and `Custom Caption`.
- Tap **Apply to All** to apply the ratio, matte, and field visibility across all uploaded photos.

### Step 4: Review & Edit EXIF Metadata (`Metadata` Tab)
- Detected EXIF values populate automatically.
- Fill or adjust `Camera`, `Lens`, `Film Stock` (type freely or pick from the curated film dropdown), `ISO / EI`, `Shooting Date`, `Artist / Credit`, `Frame No.`, and `Custom Caption`.
- Previously used gear is saved locally in your browser (or tap **Save Gear** manually) as quick-pick chips under `Camera`, `Lens`, and `Film Stock`.
- Tap **Apply Gear to All** to copy `Camera`, `Lens`, `Film Stock`, `ISO / EI`, and `Artist` across your whole batch while preserving each frame's individual date and frame number.

### Step 5: Export for Instagram (`Export` Tab)
- Choose **JPEG (95%)** *(recommended)* or **PNG (Lossless)**.
- Keep **Preserve EXIF in JPEG** enabled so saved photos retain their original shooting date and camera/film tags in Apple Photos or Google Photos.
- **Single Photo**:
  - On mobile (iOS/Android), tap **Save / Share Current Frame** to open the native share sheet and tap **Save Image**.
  - On desktop, click **Save / Share Current Frame** or **Download File Directly**.
- **Batch Carousel**:
  - Tap **Export All N Photos as ZIP** to render every photo in the queue at full resolution (`2160px` width) and download a single `.zip` archive.

---

## 3. Installing as a Mobile App (PWA)
Analog Frame works offline once loaded:
- **iOS (Safari)**: Open the site → tap the **Share** icon → **Add to Home Screen**.
- **Android (Chrome)**: Open the site → tap the menu (`⋮`) → **Install app** / **Add to Home screen**.
