# ================================================================================
# ANC Auto Design System - Standalone Application Build Script
# ================================================================================
# 
# This script automatically performs:
# 1. Build React frontend app
# 2. Copy built files to backend static folder
# 3. Create single exe file with PyInstaller
# 4. Prepare deployment package
#
# ================================================================================

param(
    [switch]$SkipFrontend = $false,  # Skip frontend build (for debugging)
    [switch]$SkipClean = $false       # Skip cleaning existing files
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  ANC Auto Design System - Standalone Application Build" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Working directory setup
$ProjectRoot = $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot "anc-frontend"
$BackendDir = Join-Path $ProjectRoot "anc-backend"
$StaticDir = Join-Path $BackendDir "static"
$DistDir = Join-Path $BackendDir "dist"
$ReleaseDir = Join-Path $ProjectRoot "ANC-Release"

# ================================================================================
# Step 1: Prerequisites Check
# ================================================================================

Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "    Install: winget install OpenJS.NodeJS" -ForegroundColor Yellow
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "  [OK] Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Python is not installed!" -ForegroundColor Red
    Write-Host "    Install: winget install Python.Python.3.11" -ForegroundColor Yellow
    exit 1
}

# Check PyInstaller
try {
    $pyinstallerVersion = python -m PyInstaller --version
    Write-Host "  [OK] PyInstaller: $pyinstallerVersion" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] PyInstaller is not installed. Installing..." -ForegroundColor Yellow
    pip install pyinstaller
}

Write-Host ""

# ================================================================================
# Step 2: Build Frontend
# ================================================================================

if (-not $SkipFrontend) {
    Write-Host "[2/6] Building frontend..." -ForegroundColor Yellow
    
    Set-Location $FrontendDir
    
    # Check node_modules
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Cyan
        npm install
    }
    
    # Run build
    Write-Host "  Building React app... (this may take a while)" -ForegroundColor Cyan
    npm run build
    
    if (-not (Test-Path "build")) {
        Write-Host "  [ERROR] Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  [OK] Frontend build completed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[2/6] Frontend build skipped" -ForegroundColor Gray
    Write-Host ""
}

# ================================================================================
# Step 3: Copy Static Files
# ================================================================================

Write-Host "[3/6] Copying static files..." -ForegroundColor Yellow

# Create static directory (remove existing)
if (Test-Path $StaticDir) {
    if (-not $SkipClean) {
        Write-Host "  Removing existing static folder..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force $StaticDir
    }
}

New-Item -ItemType Directory -Force -Path $StaticDir | Out-Null

# Copy build files
$BuildDir = Join-Path $FrontendDir "build"
if (Test-Path $BuildDir) {
    Write-Host "  Copying frontend build files..." -ForegroundColor Cyan
    Copy-Item -Recurse -Force "$BuildDir\*" $StaticDir
    Write-Host "  [OK] Static files copied" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Build files not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ================================================================================
# Step 4: Build with PyInstaller
# ================================================================================

Write-Host "[4/6] Creating exe with PyInstaller..." -ForegroundColor Yellow

Set-Location $BackendDir

# Remove existing build files
if (-not $SkipClean) {
    if (Test-Path $DistDir) {
        Write-Host "  Removing existing dist folder..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force $DistDir
    }
    if (Test-Path "build") {
        Remove-Item -Recurse -Force "build"
    }
}

# Run PyInstaller
Write-Host "  Running PyInstaller... (this may take a long time)" -ForegroundColor Cyan

# Use .spec file if exists, otherwise use command line
if (Test-Path "ANC-AutoDesign.spec") {
    python -m PyInstaller --clean --noconfirm ANC-AutoDesign.spec
} else {
    python -m PyInstaller --name="ANC-AutoDesign" `
        --onefile `
        --console `
        --add-data="static;static" `
        --hidden-import=uvicorn.logging `
        --hidden-import=uvicorn.loops `
        --hidden-import=uvicorn.loops.auto `
        --hidden-import=uvicorn.protocols `
        --hidden-import=uvicorn.protocols.http `
        --hidden-import=uvicorn.protocols.http.auto `
        --hidden-import=uvicorn.protocols.http.h11_impl `
        --hidden-import=uvicorn.protocols.websockets `
        --hidden-import=uvicorn.protocols.websockets.auto `
        --hidden-import=uvicorn.lifespan `
        --hidden-import=uvicorn.lifespan.on `
        --hidden-import=sqlalchemy.sql.default_comparator `
        --clean `
        --noconfirm `
        app/main.py
}

# Verify build
$ExePath = Join-Path $DistDir "ANC-AutoDesign.exe"
if (Test-Path $ExePath) {
    $ExeSize = (Get-Item $ExePath).Length / 1MB
    $ExeSizeRounded = [math]::Round($ExeSize, 2)
    Write-Host "  [OK] exe file created: ANC-AutoDesign.exe ($ExeSizeRounded MB)" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] exe file creation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ================================================================================
# Step 5: Prepare Deployment Package
# ================================================================================

Write-Host "[5/6] Preparing deployment package..." -ForegroundColor Yellow

Set-Location $ProjectRoot

# Create Release directory
if (Test-Path $ReleaseDir) {
    Remove-Item -Recurse -Force $ReleaseDir
}
New-Item -ItemType Directory -Force -Path $ReleaseDir | Out-Null

# Copy exe file
Copy-Item $ExePath $ReleaseDir
Write-Host "  [OK] exe file copied" -ForegroundColor Green

# Create README file
$ReadmeContent = @"
========================================
ANC Auto Design System v1.0
========================================

HOW TO RUN:
  1. Double-click ANC-AutoDesign.exe
  2. Browser will open automatically (http://localhost:8000)
  3. If browser doesn't open, manually open the URL

HOW TO STOP:
  - Close the browser and terminate process in Task Manager
  - Or press Ctrl+C if console window is visible

NOTES:
  - Do not move the exe file while it's running
  - Port 8000 must be available
  - Firewall or antivirus may block it (allow if needed)

TROUBLESHOOTING:
  
  Won't run:
    - If Windows Defender SmartScreen warning appears:
      Click "More info" -> "Run anyway"
    
  Port conflict:
    - Close programs using port 8000
    - Check: netstat -ano | findstr :8000
  
  Reset data:
    - Delete .db files in the same folder as exe

DATA STORAGE:
  - Program data is stored in the same folder as exe
  - Backup .db files if needed

VERSION INFO:
  - Version: 1.0.0
  - Build date: $(Get-Date -Format "yyyy-MM-dd")

========================================
"@

$ReadmeContent | Out-File -FilePath (Join-Path $ReleaseDir "README.txt") -Encoding UTF8
Write-Host "  [OK] README.txt created" -ForegroundColor Green

Write-Host ""

# ================================================================================
# Step 6: Create ZIP Archive
# ================================================================================

Write-Host "[6/6] Creating ZIP file..." -ForegroundColor Yellow

$ZipPath = Join-Path $ProjectRoot "ANC-AutoDesign-v1.0.zip"

if (Test-Path $ZipPath) {
    Remove-Item -Force $ZipPath
}

Compress-Archive -Path "$ReleaseDir\*" -DestinationPath $ZipPath

$ZipSize = (Get-Item $ZipPath).Length / 1MB
$ZipSizeRounded = [math]::Round($ZipSize, 2)
Write-Host "  [OK] ZIP file created: ANC-AutoDesign-v1.0.zip ($ZipSizeRounded MB)" -ForegroundColor Green

Write-Host ""

# ================================================================================
# Complete
# ================================================================================

Write-Host "================================================================================" -ForegroundColor Green
Write-Host "  BUILD COMPLETE!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment files location:" -ForegroundColor Cyan
Write-Host "  ZIP file: $ZipPath" -ForegroundColor White
Write-Host "  Folder: $ReleaseDir" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the exe in '$ReleaseDir' folder" -ForegroundColor White
Write-Host "  2. If everything works, deploy the ZIP file" -ForegroundColor White
Write-Host "  3. Users: Extract ZIP and run the exe" -ForegroundColor White
Write-Host ""
Write-Host "Test run:" -ForegroundColor Cyan
Write-Host "  cd '$ReleaseDir'" -ForegroundColor White
Write-Host "  .\ANC-AutoDesign.exe" -ForegroundColor White
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Green
