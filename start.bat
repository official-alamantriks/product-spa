@echo off
cd /d "%~dp0"
echo Запуск...
call npm install
if errorlevel 1 (
    echo Ошибка при установке зависимостей!
    pause
    exit /b 1
)
echo.
echo Запуск сервера...
call npm run dev
pause

