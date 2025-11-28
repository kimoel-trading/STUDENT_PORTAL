@echo off
cd /d "%~dp0"
echo Starting AI Validator Service...
ai-venv\Scripts\uvicorn ai.api:app --host 127.0.0.1 --port 5001
pause













