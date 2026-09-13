@echo off
echo ===================================================
echo Starting Mimir AI System...
echo ===================================================

echo Starting FastAPI Backend...
start "Mimir Backend" cmd /k "cd /d %~dp0backend && (if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) else if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat)) && uvicorn app.main:app --reload --port 8000"

echo Starting Next.js UI...
start "Mimir Next.js UI" cmd /k "cd /d %~dp0chatbot-ui && npm run dev"

echo.
echo Both servers are launching!
echo UI URL:      http://localhost:3000
echo Backend API: http://localhost:8000
echo ===================================================
