@echo off
setlocal
cd /d "%~dp0"
.\venv\Scripts\python.exe argus_cli.py %*
