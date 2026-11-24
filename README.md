# Analog Frame

A lean, 100% browser-side, mobile-first PWA for framing scanned analog film photos into Instagram-ready aspect ratios — complete with automatic EXIF parsing compatible with [`fix_exif/fix_exif.ps1`](fix_exif/fix_exif.ps1), 6 modular film frame templates, batch carousel editing, and JPEG EXIF re-injection on export.

## Highlights
- **Zero Backend / Free Hosting**: Runs entirely in the browser using HTML5 Canvas 2D; ready to deploy on Firebase Hosting's free Spark tier.
- **Instagram Aspect Ratios (2× High-Res)**: Defaults to **`3:4` Profile Grid (`2160 × 2880`)**, with `4:5` Feed (`2160 × 2700`), `1:1` Square (`2160 × 2160`), and `9:16` Story (`2160 × 3840`).
- **6 Analog Frame Templates**: Defaults to **`Minimal Matte`**, plus `35mm Film Strip`, `Film Rebate`, `Editorial Spec Card`, `Half-Frame Single`, and `Half-Frame Diptych`.
- **Split Typography & Footer Watermark**: Large, mobile-readable labeled footer placing `CAMERA: ... · LENS: ...` (line 1) and `SCANNER: ...` (line 2) on the left, with `FILM: ...` and `ISO: ...` on the right, paired with an editable footer watermark (`ANALOG FRAME` by default, remembered in `localStorage`).
- **No-Crop Fit + Rotation**: Keeps your full scanned frame intact with 90° rotation support.
- **EXIF Read & Re-Inject**: Reads `Make`, `Model`, `LensModel`, `ISO`, `DateTimeOriginal`, `Artist`, and `Film: <stock> | EI: <iso>` tags, lets you fill missing fields with curated film presets & saved gear, and writes key EXIF back into exported JPEGs so photo libraries preserve shooting dates.
- **Mobile-First PWA**: Installable on iOS/Android, works offline, supports native **Web Share** ("Save Image") and **Batch ZIP** export.

## Quick Start
```bash
npm install
npm run dev
```

## Documentation
- [Product & Visual Design](docs/design.md)
- [System Architecture & Module Guide](docs/architecture.md)
- [User Guide (Desktop & Mobile PWA)](docs/user-guide.md)
- [Setup & Firebase Deployment](docs/setup.md)
- [Project Engineering Rules](AGENTS.md)
