# Analog Frame — Setup & Deployment Guide

## 1. Prerequisites
- **Node.js** `22.x` or later (`node -v`)
- **npm** `10.x` or later (`npm -v`)
- **Git**
- **Firebase CLI** (for hosting deployment): `npm install -g firebase-tools`

---

## 2. Local Development
```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server (with HMR & PWA dev preview)
npm run dev

# 3. Run unit tests (Vitest)
npm run test

# 4. Run TypeScript type check
npm run typecheck

# 5. Build production bundle into dist/
npm run build

# 6. Preview production build locally
npm run preview
```

---

## 3. ExifTool Note (`fix_exif/`)
`fix_exif/exiftool.exe` and `fix_exif/exiftool_files/` are intentionally excluded via `.gitignore` and **must never be committed to Git**. If you want to use `fix_exif/fix_exif.ps1` locally on Windows, download the official Windows ExifTool package from `https://exiftool.org/` and place `exiftool.exe` and `exiftool_files/` inside `fix_exif/`.

---

## 4. Deploying to Firebase Hosting (Free Spark Plan)
Because Analog Frame processes everything client-side, it only needs static file hosting on Firebase's free **Spark** tier (10 GB storage, 360 MB/day transfer).

1. **Create a Firebase Project** in the [Firebase Console](https://console.firebase.google.com/) (no billing upgrade required).
2. **Configure `.env`** (`.env` is gitignored; `.env.example` is provided as a template):
   ```bash
   cp .env.example .env
   ```
   Ensure `FIREBASE_PROJECT_ID` is set (default: `analog-frame`), and optionally add `VITE_GA4_MEASUREMENT_ID` (GA4) or `VITE_COFFEE_URL` (header support link):
   ```env
   FIREBASE_PROJECT_ID=analog-frame
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_COFFEE_URL=https://ezdn.app/your-handle
   ```
3. **Authenticate & Deploy**:
   First sign in once with `firebase login`, then run the deployment script for your OS:

   **Windows (PowerShell)**:
   ```powershell
   .\deploy.ps1
   ```
   *(Optional flags: `-ProjectId <id>`, `-SkipChecks`)*

   **macOS / Linux / Git Bash**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
   *(Optional flags: `--project <id>`, `--skip-checks`)*

   Both scripts read `FIREBASE_PROJECT_ID` from `.env`, run `npm run typecheck`, `npm run test`, and `npm run build`, and then run `firebase deploy --only hosting --project <id>`.
4. **Verify**:
   - Open `https://analog-frame.web.app` (or `https://<your-project-id>.web.app`) on desktop and mobile.
   - Verify PWA installability and offline support (handled by `sw.js` and `manifest.webmanifest` with `no-cache` headers configured in `firebase.json`).
