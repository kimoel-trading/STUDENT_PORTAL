@echo off
cd /d "%~dp0"
echo ========================================
echo Starting AI Validator Service with Nanonets
echo ========================================
echo.

REM Set Nanonets environment variables
set NANONETS_API_KEY=5078eb1d-b0db-11f0-890d-e6e0013317b1
set NANONETS_MODEL_ID_GRADES_FORM_1=ab11f2c6-728c-4024-8f33-ed6a25cf0ab0
set NANONETS_MODEL_ID_JHS_137=4b96dc43-641d-4c60-99cd-c73e89e5f765
set NANONETS_MODEL_ID_SHS_137=be5fec5f-0dec-43ad-8ba3-2344ce3a78bf

echo [OK] Nanonets models configured
echo.
echo Starting AI service on http://127.0.0.1:5001
echo Press CTRL+C to stop the service
echo ========================================
echo.

ai-venv\Scripts\uvicorn ai.api:app --host 127.0.0.1 --port 5001
pause

