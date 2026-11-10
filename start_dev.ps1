Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "      Starting PulseForge Development Suite    " -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan

$BackendDir = "$PSScriptRoot\api"
$FrontendDir = "$PSScriptRoot\frontend"

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$BackendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; if (Test-Path '.\.venv\Scripts\Activate.ps1') { & '.\.venv\Scripts\Activate.ps1' } elseif (Test-Path '..\.venv\Scripts\Activate.ps1') { & '..\.venv\Scripts\Activate.ps1' }; uvicorn main:app --reload --host 127.0.0.1 --port 8000" -PassThru

Write-Host "[2/2] Starting React + Vite Frontend on http://localhost:5173..." -ForegroundColor Green
$FrontendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; pnpm run dev" -PassThru

Write-Host "`n✓ PulseForge is running!" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  - API Swagger Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Demo login: alex@pulseforge.dev / hackathon123" -ForegroundColor Gray
Write-Host "`nPress any key to stop both servers..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Process -Id $BackendProc.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $FrontendProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "`nServers stopped." -ForegroundColor Red
