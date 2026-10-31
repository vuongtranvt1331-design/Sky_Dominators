@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is required. Install the LTS version from https://nodejs.org/
    pause
    exit /b 1
)
node "%~dp0tools\dev-server.cjs" %*
if errorlevel 1 pause
