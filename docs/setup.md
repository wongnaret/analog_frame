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
2. **Copy `.firebaserc.example` to `.firebaserc`** (note: `.firebaserc` is gitignored or can be kept local):
   ```bash
   cp .firebaserc.example .firebaserc
   ```
   Replace `"your-firebase-project-id"` with your real Firebase project ID.
3. **Authenticate & Deploy**:
   ```bash
   firebase login
   npm run build
   firebase deploy --only hosting
   ```
4. **Verify**:
   - Open your `https://<your-project-id>.web.app` URL on desktop and mobile.
   - Verify PWA installability and offline support (handled by `sw.js` and `manifest.webmanifest` with `no-cache` headers configured in `firebase.json`).
