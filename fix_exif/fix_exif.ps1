[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$FolderName,

    [Parameter()]
    [string]$Date,

    [Parameter()]
    [string]$Time,

    [Parameter()]
    [string]$Film,

    [Parameter()]
    [string]$ISO,

    [Parameter()]
    [string]$Camera,

    [Parameter()]
    [string]$Lens,

    [Parameter()]
    [string]$Artist
)

# ตั้งค่า Console Encoding ให้รองรับ UTF-8 ภาษาไทย
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { $PWD.Path }

if (-not $FolderName) {
    Write-Host "`n=== เลือกระบุโฟลเดอร์รูปภาพ ===" -ForegroundColor Cyan
    
    # แสดงโฟลเดอร์ที่มีในไดเรกทอรีปัจจุบันเพื่อความสะดวก
    $subDirs = @(Get-ChildItem -LiteralPath $scriptDir -Directory | 
        Where-Object { $_.Name -ne 'exiftool_files' } | 
        Select-Object -ExpandProperty Name)
    if ($subDirs.Count -gt 0) {
        Write-Host "โฟลเดอร์ที่พบในตำแหน่งนี้:" -ForegroundColor Gray
        foreach ($dirName in $subDirs) {
            Write-Host "  - $dirName" -ForegroundColor Gray
        }
        Write-Host ""
    }

    $FolderName = Read-Host "ระบุชื่อโฟลเดอร์ย่อย (เช่น 4140_ILLFORD_HP5_Plus_400-EddWedding_1)"
}

if ([string]::IsNullOrWhiteSpace($FolderName)) {
    Write-Host "[Error] ไม่ได้ระบุโฟลเดอร์" -ForegroundColor Red
    exit 1
}

$cleanFolder = $FolderName.Trim().Trim('"', "'").TrimEnd('\', '/')

# ตรวจสอบและดึงตำแหน่งโฟลเดอร์รูปภาพ
if ([System.IO.Path]::IsPathRooted($cleanFolder) -and (Test-Path -LiteralPath $cleanFolder)) {
    $targetPath = (Get-Item -LiteralPath $cleanFolder).FullName
} elseif (Test-Path -LiteralPath (Join-Path $scriptDir $cleanFolder)) {
    $targetPath = (Get-Item -LiteralPath (Join-Path $scriptDir $cleanFolder)).FullName
} elseif (Test-Path -LiteralPath (Join-Path $PWD.Path $cleanFolder)) {
    $targetPath = (Get-Item -LiteralPath (Join-Path $PWD.Path $cleanFolder)).FullName
} else {
    Write-Host "[Error] ไม่พบโฟลเดอร์: $FolderName" -ForegroundColor Red
    exit 1
}

# ค้นหาไฟล์รูปภาพ
$files = @(Get-ChildItem -LiteralPath $targetPath -File | 
    Where-Object { $_.Extension -match '^\.(jpe?g|png|tiff?)$' } | 
    Sort-Object Name)

if ($files.Count -eq 0) {
    Write-Host "[Warning] ไม่พบไฟล์รูปภาพในโฟลเดอร์ [$targetPath]" -ForegroundColor Yellow
    exit 0
}

Write-Host "`nพบรูปภาพทั้งหมด $($files.Count) รูป ในโฟลเดอร์ [$targetPath]`n" -ForegroundColor Green

# สอบถามข้อมูล EXIF ทีละขั้นตอน
Write-Host "--- ระบุข้อมูลสำหรับเขียนลง EXIF ---" -ForegroundColor Cyan

# [1] วันที่ถ่าย
$parsedDate = [datetime]::MinValue
[string[]]$dateFormats = @('yyyy-MM-dd', 'yyyy/MM/dd', 'yyyy:MM:dd', 'yyyy-M-d', 'yyyy/M/d', 'yyyy:M:d')

if ($Date) {
    $isValidDate = [datetime]::TryParseExact(
        $Date.Trim(), 
        $dateFormats, 
        [System.Globalization.CultureInfo]::InvariantCulture, 
        [System.Globalization.DateTimeStyles]::None, 
        [ref]$parsedDate
    )
    if (-not $isValidDate) {
        Write-Host "   รูปแบบวันที่จากพารามิเตอร์ไม่ถูกต้อง ($Date) ต้องเป็น YYYY-MM-DD" -ForegroundColor Red
        $Date = $null
    }
}

if (-not $Date) {
    do {
        $dateInput = (Read-Host "[1/7] วันที่ถ่ายภาพ (Format: YYYY-MM-DD เช่น 2026-09-13)").Trim()
        $isValidDate = [datetime]::TryParseExact(
            $dateInput, 
            $dateFormats, 
            [System.Globalization.CultureInfo]::InvariantCulture, 
            [System.Globalization.DateTimeStyles]::None, 
            [ref]$parsedDate
        )
        if (-not $isValidDate) {
            Write-Host "   รูปแบบวันที่ไม่ถูกต้อง กรุณากรอกแบบ YYYY-MM-DD (เช่น 2026-09-13)" -ForegroundColor Red
        }
    } until ($isValidDate)
}

# [2] เวลาเริ่มต้น
$parsedTime = [timespan]::Zero
$isValidTime = $false

if ($Time) {
    $timeInput = $Time.Trim()
    if ($timeInput -match '^\d{1,2}:\d{2}$') { $timeInput += ":00" }
    $isValidTime = [timespan]::TryParse($timeInput, [ref]$parsedTime)
    if (-not $isValidTime) {
        Write-Host "   รูปแบบเวลาจากพารามิเตอร์ไม่ถูกต้อง ($Time)" -ForegroundColor Red
        $Time = $null
    }
}

if (-not $Time) {
    do {
        $timeInput = (Read-Host "[2/7] เวลาเริ่มต้นของรูปแรก (Format: HH:mm:ss หรือ HH:mm เช่น 14:30:00 | กด Enter เพื่อใช้ 12:00:00)").Trim()
        if ([string]::IsNullOrWhiteSpace($timeInput)) {
            $parsedTime = [timespan]::FromHours(12)
            $isValidTime = $true
        } else {
            if ($timeInput -match '^\d{1,2}:\d{2}$') { $timeInput += ":00" }
            $isValidTime = [timespan]::TryParse($timeInput, [ref]$parsedTime)
            if (-not $isValidTime) {
                Write-Host "   รูปแบบเวลาไม่ถูกต้อง กรุณากรอกแบบ HH:mm หรือ HH:mm:ss" -ForegroundColor Red
            }
        }
    } until ($isValidTime)
}

$startDate = $parsedDate.Date.Add($parsedTime)

# [3] ฟิล์มที่ใช้
$filmStock = if ($Film) { $Film.Trim() } else { 
    (Read-Host "[3/7] รุ่นฟิล์ม (เช่น Ilford HP5 Plus 400, Kodak Gold 200, Kodak Vision3 250D)").Trim() 
}

# ตรวจสอบ ISO เริ่มต้นจากชื่อฟิล์ม (ถ้ามี)
$defaultIso = if ($filmStock -match '\b(\d{2,4})\b') { $matches[1] } else { "400" }

# [4] ISO / Exposure Index
$isoInput = if ($ISO) { $ISO.Trim() } else { $null }

if ($isoInput -and ($isoInput -notmatch '^\d+$')) {
    Write-Host "   ค่า ISO จากพารามิเตอร์ไม่ถูกต้อง ($ISO) ต้องเป็นตัวเลข" -ForegroundColor Red
    $isoInput = $null
}

if (-not $isoInput) {
    do {
        $isoPrompt = if ($defaultIso) {
            "[4/7] ISO หรือ EI ที่ตั้งค่าถ่าย (ค่าเริ่มต้น: $defaultIso | กด Enter เพื่อใช้ค่านี้)"
        } else {
            "[4/7] ISO หรือ EI ที่ตั้งค่าถ่าย (เช่น 400, 200, 800)"
        }
        $isoInput = (Read-Host $isoPrompt).Trim()
        if ([string]::IsNullOrWhiteSpace($isoInput) -and $defaultIso) {
            $isoInput = $defaultIso
        }
        if ($isoInput -notmatch '^\d+$') {
            Write-Host "   กรุณากรอกตัวเลข ISO เช่น 400" -ForegroundColor Red
        }
    } until ($isoInput -match '^\d+$')
}

# [5] กล้อง
$cameraInput = if ($Camera) { $Camera.Trim() } else {
    (Read-Host "[5/7] กล้องที่ใช้ (เช่น Pentax 17, Olympus OM-1, Leica M6)").Trim()
}

$cameraMake = ""
$cameraModel = $cameraInput
if ($cameraInput -match '^([^\s]+)\s+(.+)$') {
    $cameraMake = $matches[1]
    $cameraModel = $matches[2]
} elseif ($cameraInput) {
    $cameraMake = $cameraInput
}

# [6] เลนส์ (Optional)
$lens = if ($PSBoundParameters.ContainsKey('Lens')) { $Lens.Trim() } else {
    (Read-Host "[6/7] เลนส์ที่ใช้ (เช่น 50mm f/1.8, 25mm F3.5 | กด Enter หากไม่ระบุ)").Trim()
}

# [7] ช่างภาพ / Artist (Optional)
$artist = if ($PSBoundParameters.ContainsKey('Artist')) { $Artist.Trim() } else {
    (Read-Host "[7/7] ชื่อช่างภาพ / ลิขสิทธิ์ (กด Enter เพื่อข้าม)").Trim()
}

# ค้นหาพาธ exiftool.exe
$exifToolPath = Join-Path $scriptDir "exiftool.exe"
if (-not (Test-Path -LiteralPath $exifToolPath)) {
    $localExif = Join-Path $PWD.Path "exiftool.exe"
    if (Test-Path -LiteralPath $localExif) {
        $exifToolPath = $localExif
    } elseif (Get-Command "exiftool" -ErrorAction SilentlyContinue) {
        $exifToolPath = "exiftool"
    } else {
        Write-Host "[Error] ไม่พบไฟล์ exiftool.exe ในโฟลเดอร์เดียวกับสคริปต์ หรือใน PATH" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nกำลังเริ่มเขียนข้อมูลลงในไฟล์รูปภาพ..." -ForegroundColor Cyan

# วนลูปอัปเดตไฟล์ทีละรูป (+1 วินาทีต่อรูป)
$counter = 0
foreach ($file in $files) {
    $newTimestamp = $startDate.AddSeconds($counter).ToString("yyyy:MM:dd HH:mm:ss")
    
    $exifArgs = @(
        "-overwrite_original",
        "-charset", "filename=utf8",
        "-charset", "utf8",
        "-AllDates=$newTimestamp",
        "-FileModifyDate=$newTimestamp",
        "-ISO=$isoInput"
    )

    if ($cameraMake)  { $exifArgs += "-Make=$cameraMake" }
    if ($cameraModel) { $exifArgs += "-Model=$cameraModel" }
    if ($lens)        { $exifArgs += "-LensModel=$lens"; $exifArgs += "-Lens=$lens" }
    
    if ($filmStock) {
        $desc = "Film: $filmStock | EI: $isoInput"
        $exifArgs += "-UserComment=$desc"
        $exifArgs += "-ImageDescription=$desc"
        $exifArgs += "-XMP:Description=$desc"
    }

    if ($artist) {
        $exifArgs += "-Artist=$artist"
        $exifArgs += "-Copyright=$artist"
    }

    & $exifToolPath @exifArgs $file.FullName | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ [$($file.Name)] -> $newTimestamp | $cameraInput | $filmStock" -ForegroundColor Green
    } else {
        Write-Host "✗ [$($file.Name)] เกิดข้อผิดพลาดในการเขียน EXIF" -ForegroundColor Red
    }
    $counter++
}

Write-Host "`nดำเนินการเสร็จสิ้นทั้งหมด $counter ไฟล์!" -ForegroundColor Cyan
