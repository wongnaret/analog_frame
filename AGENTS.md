# Project Working Rules — Analog Frame

These rules govern all development and AI-assisted work in this repository.

## 1. Core Principles
- **100% Client-Side & Lean**: All image decoding, EXIF parsing, Canvas 2D framing, EXIF re-injection, and ZIP packaging run in the user's browser with zero backend dependencies. Keep bundle size and runtime memory lean (especially for mobile Safari/Chrome).
- **English UI & Typography**: All web application UI copy, labels, and rendered frame typography must be in English.
- **Film-First Aesthetic**: Respect original scanned film aspect ratios — fit photos cleanly inside frames without cropping by default, and keep typography subtle and authentic.
- **Default Canvas**: `3:4` Profile Grid (`2160 × 2880`) on a crisp white outer matte with the `minimal-matte` frame template and `Noritsu HS-1800` default scanner.

## 2. Never Commit ExifTool Binaries
- `fix_exif/exiftool.exe` and `fix_exif/exiftool_files/` MUST remain ignored in `.gitignore`.
- Only `fix_exif/fix_exif.ps1` is tracked in `fix_exif/`.
- Always verify `git status` and `git ls-files fix_exif/` before committing.

## 3. Modular & Reusable Architecture
- **`src/core/`** must remain **pure, framework-agnostic TypeScript** (no React imports). It encapsulates:
  - `src/core/types/` — shared data models
  - `src/core/exif/` — `fix_exif.ps1`-compatible EXIF reader & JPEG EXIF writer
  - `src/core/presets/` — IG aspect ratios, matte palettes, film stocks, `localStorage` gear history
  - `src/core/templates/` — modular frame template registry and individual frame renderers
  - `src/core/renderer/` — layered HTML5 Canvas 2D layout & typography engine
  - `src/core/export/` — JPEG/PNG encoding, Web Share API, and ZIP batch export
- **`src/state/`** manages React state cleanly on top of `src/core/`.
- **`src/components/`** contains focused, mobile-first UI components.
- Avoid duplicating drawing or formatting logic across templates; share helpers in `src/core/templates/drawFilmHelpers.ts`.

## 4. Documentation-With-Code Rule
- Every architectural decision, feature, template, EXIF tag mapping, and setup step must be documented in `docs/`:
  - [`docs/design.md`](docs/design.md) — Product & visual design specification
  - [`docs/architecture.md`](docs/architecture.md) — Module boundaries, EXIF schema, Canvas pipeline
  - [`docs/user-guide.md`](docs/user-guide.md) — End-user guide for Desktop & Mobile PWA
  - [`docs/setup.md`](docs/setup.md) — Local development, testing, and Firebase Hosting deployment
- **Whenever code behavior, defaults, file structure, or commands change, update the relevant doc(s) and `README.md` in the same commit or milestone.**

## 5. Git Workflow & Verification
- Commit and push frequently in small, atomic, meaningful milestones (`chore:`, `feat:`, `fix:`, `docs:`).
- Before every commit/push, run:
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `git ls-files fix_exif/` (must output only `fix_exif/fix_exif.ps1`)
