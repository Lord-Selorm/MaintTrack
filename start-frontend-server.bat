@echo off
SET SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%
node frontend-server.js
