# Nanonets Configuration Script for Windows PowerShell
# Run this script to set up your Nanonets API credentials

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nanonets API Configuration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for API Key
$apiKey = Read-Host "Enter your Nanonets API Key" -AsSecureString
$apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
)

# Prompt for Model ID
$modelId = Read-Host "Enter your Nanonets Model ID"

# Set environment variables for current session
$env:NANONETS_API_KEY = $apiKeyPlain
$env:NANONETS_MODEL_ID = $modelId

Write-Host ""
Write-Host "✓ Environment variables set for current session" -ForegroundColor Green
Write-Host ""

# Ask if user wants to set permanently
$setPermanent = Read-Host "Do you want to set these permanently? (Y/N)"
if ($setPermanent -eq "Y" -or $setPermanent -eq "y") {
    [System.Environment]::SetEnvironmentVariable("NANONETS_API_KEY", $apiKeyPlain, "User")
    [System.Environment]::SetEnvironmentVariable("NANONETS_MODEL_ID", $modelId, "User")
    Write-Host "✓ Environment variables set permanently" -ForegroundColor Green
    Write-Host "  (You may need to restart your terminal/IDE for changes to take effect)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify, run:" -ForegroundColor Cyan
Write-Host "  echo `$env:NANONETS_API_KEY" -ForegroundColor Gray
Write-Host "  echo `$env:NANONETS_MODEL_ID" -ForegroundColor Gray
Write-Host ""

# Clear sensitive data from memory
$apiKeyPlain = $null
$apiKey = $null

