@echo off
echo ===================================================
echo Starting Pragna Mimir Assistant...
echo ===================================================

echo Starting FastAPI Backend (Mimir)...
start "Pragna-Mimir Backend" cmd /k "cd /d %~dp0backend && (if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) else if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat)) && uvicorn app.main:app --reload --port 8000"

echo Starting React UI (Vite)...
start "Pragna UI" cmd /k "cd /d %~dp0chatbot-ui-vite && npm run dev"

echo.
echo Both servers are launching!
echo UI URL:      http://localhost:5180
echo Backend API: http://localhost:8000
echo ===================================================
