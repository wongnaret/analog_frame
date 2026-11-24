#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
SKIP_CHECKS=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project|-p)
      PROJECT_ID="${2:-}"
      shift 2
      ;;
    --skip-checks)
      SKIP_CHECKS=true
      shift
      ;;
    *)
      if [[ -z "$PROJECT_ID" ]]; then
        PROJECT_ID="$1"
      fi
      shift
      ;;
  esac
done

# Load FIREBASE_PROJECT_ID from .env if not provided via flag or environment
if [[ -z "$PROJECT_ID" && -f "$SCRIPT_DIR/.env" ]]; then
  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    line="${raw_line%$'\r'}"
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    if [[ "$line" =~ ^FIREBASE_PROJECT_ID[[:space:]]*=[[:space:]]*(.+)$ ]]; then
      val="${BASH_REMATCH[1]}"
      val="${val%\"}"
      val="${val#\"}"
      val="${val%\'}"
      val="${val#\'}"
      PROJECT_ID="$(printf '%s' "$val" | xargs)"
      break
    fi
  done < "$SCRIPT_DIR/.env"
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "[Error] FIREBASE_PROJECT_ID is not set. Add it to .env or pass --project <id>." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[Error] npm is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v firebase >/dev/null 2>&1; then
  echo "[Error] Firebase CLI not found. Install it with: npm install -g firebase-tools" >&2
  exit 1
fi

echo "=== Analog Frame -> Firebase Hosting ($PROJECT_ID) ==="

if [[ "$SKIP_CHECKS" == false ]]; then
  echo ""
  echo "[1/4] Running TypeScript typecheck..."
  npm run typecheck

  echo ""
  echo "[2/4] Running unit tests..."
  npm run test
else
  echo ""
  echo "[1-2/4] Skipping typecheck & unit tests (--skip-checks)."
fi

echo ""
echo "[3/4] Building production bundle (dist/)..."
npm run build

echo ""
echo "[4/4] Deploying to Firebase Hosting ($PROJECT_ID)..."
firebase deploy --only hosting --project "$PROJECT_ID"

echo ""
echo "Deployed successfully: https://${PROJECT_ID}.web.app"
