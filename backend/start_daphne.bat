@echo off
chcp 65001 >nul
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo 🚀 Starting SewaBazaar with WebSocket Support (Daphne ASGI)
echo ============================================================
echo.
echo 🔍 Checking database migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo ❌ Migration failed.
    pause
    exit /b
)
echo ✅ Database ready
echo 🌐 Starting Daphne ASGI server...
echo    • WebSocket: ws://127.0.0.1:8000/ws/messaging/
echo    • Press Ctrl+C to stop
echo.
daphne -b 127.0.0.1 -p 8000 sewabazaar.asgi:application
pause