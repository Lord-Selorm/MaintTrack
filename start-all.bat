@echo off
REM start-all.bat - Starts backend server and opens frontend HTML
SET SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%

IF NOT EXIST "backend\node_modules" (
  echo Installing backend dependencies...
  pushd backend
  npm install
  popd
)

echo Starting backend server...
start cmd /k "cd /d %SCRIPT_DIR%backend && call npm.cmd start"

echo Starting frontend server...
start cmd /k "cd /d %SCRIPT_DIR% && node frontend-server.js"

start "" "http://localhost:8000/maintenance_tracker.html"
