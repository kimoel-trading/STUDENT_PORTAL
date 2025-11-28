# Setup script for all three Nanonets models
# This sets up environment variables for Grades Form 1, JHS Form 137, and SHS Form 137

Write-Host "Setting up all three Nanonets models..." -ForegroundColor Cyan
Write-Host ""

# Set environment variables for current session
$env:NANONETS_API_KEY = "5078eb1d-b0db-11f0-890d-e6e0013317b1"
$env:NANONETS_MODEL_ID_GRADES_FORM_1 = "ab11f2c6-728c-4024-8f33-ed6a25cf0ab0"
$env:NANONETS_MODEL_ID_JHS_137 = "4b96dc43-641d-4c60-99cd-c73e89e5f765"
$env:NANONETS_MODEL_ID_SHS_137 = "be5fec5f-0dec-43ad-8ba3-2344ce3a78bf"

Write-Host "[OK] Environment variables set for current session:" -ForegroundColor Green
Write-Host "  - NANONETS_API_KEY" -ForegroundColor Gray
Write-Host "  - NANONETS_MODEL_ID_GRADES_FORM_1" -ForegroundColor Gray
Write-Host "  - NANONETS_MODEL_ID_JHS_137" -ForegroundColor Gray
Write-Host "  - NANONETS_MODEL_ID_SHS_137" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to set permanently
$setPermanent = Read-Host "Do you want to set these permanently? (Y/N)"
if ($setPermanent -eq "Y" -or $setPermanent -eq "y") {
    [System.Environment]::SetEnvironmentVariable("NANONETS_API_KEY", $env:NANONETS_API_KEY, "User")
    [System.Environment]::SetEnvironmentVariable("NANONETS_MODEL_ID_GRADES_FORM_1", $env:NANONETS_MODEL_ID_GRADES_FORM_1, "User")
    [System.Environment]::SetEnvironmentVariable("NANONETS_MODEL_ID_JHS_137", $env:NANONETS_MODEL_ID_JHS_137, "User")
    [System.Environment]::SetEnvironmentVariable("NANONETS_MODEL_ID_SHS_137", $env:NANONETS_MODEL_ID_SHS_137, "User")
    Write-Host "[OK] Environment variables set permanently" -ForegroundColor Green
    Write-Host "  (You may need to restart your terminal/IDE for changes to take effect)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify, run:" -ForegroundColor Cyan
Write-Host "  python test-all-nanonets-models.py" -ForegroundColor Gray
Write-Host ""

