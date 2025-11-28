# Quick Nanonets Setup for Grades Form 1
# This script sets up the environment variables for your specific model

Write-Host "Setting up Nanonets configuration..." -ForegroundColor Cyan

# Set environment variables for current session
$env:NANONETS_API_KEY = "5078eb1d-b0db-11f0-890d-e6e0013317b1"
$env:NANONETS_MODEL_ID = "ab11f2c6-728c-4024-8f33-ed6a25cf0ab0"

Write-Host "✓ Environment variables set for current session" -ForegroundColor Green
Write-Host ""

# Ask if user wants to set permanently
$setPermanent = Read-Host "Do you want to set these permanently? (Y/N)"
if ($setPermanent -eq "Y" -or $setPermanent -eq "y") {
    [System.Environment]::SetEnvironmentVariable("NANONETS_API_KEY", $env:NANONETS_API_KEY, "User")
    [System.Environment]::SetEnvironmentVariable("NANONETS_MODEL_ID", $env:NANONETS_MODEL_ID, "User")
    Write-Host "✓ Environment variables set permanently" -ForegroundColor Green
    Write-Host "  (You may need to restart your terminal/IDE for changes to take effect)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify, run:" -ForegroundColor Cyan
Write-Host "  python test-nanonets.py" -ForegroundColor Gray
Write-Host ""

