@echo off
setlocal
cd /d "%~dp0backend"
if exist ".\.venv\Scripts\python.exe" (
    .\.venv\Scripts\python.exe argus_cli.py %*
) else if exist ".\venv\Scripts\python.exe" (
    .\venv\Scripts\python.exe argus_cli.py %*
) else (
    python argus_cli.py %*
)
