@echo off
echo ===================================================
echo Starting Pragna AI System...
echo ===================================================

echo Starting FastAPI Backend...
start "Pragna Backend" cmd /k "cd /d %~dp0backend && (if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) else if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat)) && uvicorn app.main:app --reload --port 8000"

echo Starting Next.js UI...
start "Pragna Next.js UI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo UI URL:      http://localhost:4028
echo Backend API: http://localhost:8000
echo ===================================================
