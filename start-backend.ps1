# 실행 스크립트

## Backend 실행

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ANC Backend Server Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = "d:\Workspace\260211_BOM App\anc-backend"

if (Test-Path $backendPath) {
    Set-Location $backendPath
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    
    Write-Host ""
    Write-Host "Starting FastAPI server..." -ForegroundColor Green
    Write-Host "API: http://localhost:8000" -ForegroundColor Green
    Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
    Write-Host ""
    
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
} else {
    Write-Host "Error: Backend directory not found!" -ForegroundColor Red
    Write-Host "Path: $backendPath" -ForegroundColor Red
}
