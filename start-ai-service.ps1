# Start AI Service with Nanonets Configuration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting AI Validator Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set Nanonets environment variables for this process
$env:NANONETS_API_KEY = "5078eb1d-b0db-11f0-890d-e6e0013317b1"
$env:NANONETS_MODEL_ID_GRADES_FORM_1 = "ab11f2c6-728c-4024-8f33-ed6a25cf0ab0"
$env:NANONETS_MODEL_ID_JHS_137 = "4b96dc43-641d-4c60-99cd-c73e89e5f765"
$env:NANONETS_MODEL_ID_SHS_137 = "be5fec5f-0dec-43ad-8ba3-2344ce3a78bf"

Write-Host "[OK] Nanonets models configured" -ForegroundColor Green
Write-Host ""
Write-Host "Starting AI service on http://127.0.0.1:5001" -ForegroundColor Yellow
Write-Host "Press CTRL+C to stop the service" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Activate virtual environment and start uvicorn
& ".\ai-venv\Scripts\python.exe" -m uvicorn ai.api:app --host 127.0.0.1 --port 5001

