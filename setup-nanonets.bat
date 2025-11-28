@echo off
REM Nanonets Configuration Script for Windows CMD
REM Run this script to set up your Nanonets API credentials

echo ========================================
echo Nanonets API Configuration Setup
echo ========================================
echo.

set /p API_KEY="Enter your Nanonets API Key: "
set /p MODEL_ID="Enter your Nanonets Model ID: "

REM Set for current session
set NANONETS_API_KEY=%API_KEY%
set NANONETS_MODEL_ID=%MODEL_ID%

echo.
echo Environment variables set for current session
echo.

set /p SET_PERM="Do you want to set these permanently? (Y/N): "
if /i "%SET_PERM%"=="Y" (
    setx NANONETS_API_KEY "%API_KEY%"
    setx NANONETS_MODEL_ID "%MODEL_ID%"
    echo.
    echo Environment variables set permanently
    echo (You may need to restart your terminal for changes to take effect)
)

echo.
echo Configuration complete!
echo.
echo To verify, run:
echo   echo %%NANONETS_API_KEY%%
echo   echo %%NANONETS_MODEL_ID%%
echo.

