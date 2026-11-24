[CmdletBinding()]
param (
    [Parameter()]
    [string]$ProjectId,

    [Parameter()]
    [switch]$SkipChecks
)

$ErrorActionPreference = 'Stop'
$repoRoot = if ($PSScriptRoot) { $PSScriptRoot } else { $PWD.Path }

Push-Location $repoRoot
try {
    # Load FIREBASE_PROJECT_ID from .env when not passed via -ProjectId
    if (-not $ProjectId) {
        $envFile = Join-Path $repoRoot '.env'
        if (Test-Path -LiteralPath $envFile) {
            foreach ($line in Get-Content -LiteralPath $envFile) {
                $trimmed = $line.Trim()
                if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
                if ($trimmed -match '^FIREBASE_PROJECT_ID\s*=\s*(.+)$') {
                    $ProjectId = $matches[1].Trim().Trim('"', "'")
                    break
                }
            }
        }
    }

    if (-not $ProjectId -and $env:FIREBASE_PROJECT_ID) {
        $ProjectId = $env:FIREBASE_PROJECT_ID.Trim()
    }

    if (-not $ProjectId) {
        Write-Host "[Error] FIREBASE_PROJECT_ID is not set. Add it to .env or pass -ProjectId <id>." -ForegroundColor Red
        exit 1
    }

    if (-not (Get-Command 'npm' -ErrorAction SilentlyContinue)) {
        Write-Host "[Error] npm is not installed or not in PATH." -ForegroundColor Red
        exit 1
    }

    $firebaseCmd = Get-Command 'firebase' -ErrorAction SilentlyContinue
    if (-not $firebaseCmd) {
        Write-Host "[Error] Firebase CLI not found. Install it with: npm install -g firebase-tools" -ForegroundColor Red
        exit 1
    }

    Write-Host "=== Analog Frame -> Firebase Hosting ($ProjectId) ===" -ForegroundColor Cyan

    if (-not $SkipChecks) {
        Write-Host "`n[1/4] Running TypeScript typecheck..." -ForegroundColor Yellow
        npm run typecheck
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

        Write-Host "`n[2/4] Running unit tests..." -ForegroundColor Yellow
        npm run test
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    } else {
        Write-Host "`n[1-2/4] Skipping typecheck & unit tests (-SkipChecks)." -ForegroundColor DarkGray
    }

    Write-Host "`n[3/4] Building production bundle (dist/)..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "`n[4/4] Deploying to Firebase Hosting ($ProjectId)..." -ForegroundColor Yellow
    firebase deploy --only hosting --project $ProjectId
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "`nDeployed successfully: https://$ProjectId.web.app" -ForegroundColor Green
}
finally {
    Pop-Location
}
