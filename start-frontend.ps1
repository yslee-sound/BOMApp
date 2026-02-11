# Frontend 실행 스크립트

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ANC Frontend Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$frontendPath = "d:\Workspace\260211_BOM App\anc-frontend"

if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies... (This may take a few minutes)" -ForegroundColor Yellow
        npm install
    }
    
    Write-Host ""
    Write-Host "Starting React development server..." -ForegroundColor Green
    Write-Host "App: http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    
    npm start
} else {
    Write-Host "Error: Frontend directory not found!" -ForegroundColor Red
    Write-Host "Path: $frontendPath" -ForegroundColor Red
}
