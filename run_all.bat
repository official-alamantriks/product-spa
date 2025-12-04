@echo off
cd /d "%~dp0"

REM Backend 
start "Backend" cmd /k cd /d "%~dp0Backend" ^&^& dotnet run

REM Frontend 
start "Frontend" cmd /k cd /d "%~dp0frontend" ^&^& npm install ^&^& npm run dev

echo Открыты два окна:
echo - Backend (dotnet run)
echo - Frontend (npm run dev)
echo Можно закрыть это окно.
exit /b


