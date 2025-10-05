import subprocess
import time
import os
import sys

# --- Optional: enable UTF-8 in Windows console ---
if sys.platform.startswith("win"):
    os.system("chcp 65001 >NUL")

def safe_print(msg):
    """Ensure emoji/unicode-safe print for all systems."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode("utf-8", "ignore").decode("utf-8"))

safe_print("🚀 Starting development environment...")

def check_backend_dependencies():
    """Check if backend dependencies are available in venv"""
    try:
        backend_path = os.path.join(os.getcwd(), 'backend')
        venv_activate = os.path.join(backend_path, 'venv', 'Scripts', 'activate.bat')

        if not os.path.exists(backend_path):
            return False, "Backend directory not found"

        if not os.path.exists(venv_activate):
            return False, "Virtual environment not found"

        # Check if channels and daphne are available in venv
        check_cmd = f'''cd /d "{backend_path}" && call venv\\Scripts\\activate.bat && python -c "import channels, daphne; print('Channels:', channels.__version__, '| Daphne:', daphne.__version__)"'''

        result = subprocess.run(
            check_cmd,
            shell=True,
            capture_output=True,
            text=True,
            cwd=backend_path
        )

        if result.returncode == 0:
            return True, f"WebSocket support available - {result.stdout.strip()}"
        else:
            pip_check = f'''cd /d "{backend_path}" && call venv\\Scripts\\activate.bat && pip show channels daphne'''
            pip_result = subprocess.run(pip_check, shell=True, capture_output=True, text=True, cwd=backend_path)

            if pip_result.returncode == 0 and 'channels' in pip_result.stdout.lower() and 'daphne' in pip_result.stdout.lower():
                return True, "WebSocket support available (detected via pip)"
            else:
                return False, f"Channels/Daphne not found in venv. Error: {result.stderr.strip()}"

    except Exception as e:
        return False, f"Could not check dependencies: {str(e)}"


def create_and_run_batch(script_path, content):
    """Helper to create and start batch file in a new terminal window"""
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(content.strip())

    # Use "" for title argument to fix 'start' command issue on Windows
    subprocess.Popen(f'start "" cmd /k "{script_path}"', shell=True)


def start_backend_with_websocket():
    """Start backend with Daphne ASGI server for WebSocket support"""
    safe_print("▶️ Starting backend server with WebSocket support (Daphne ASGI)...")

    backend_path = os.path.join(os.getcwd(), 'backend')
    start_script = os.path.join(backend_path, 'start_daphne.bat')

    script_content = r"""
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
"""

    create_and_run_batch(start_script, script_content)


def start_backend_fallback():
    """Fallback to regular Django server with venv"""
    safe_print("▶️ Starting backend server (Django dev server)...")

    backend_path = os.path.join(os.getcwd(), 'backend')
    start_script = os.path.join(backend_path, 'start_django.bat')

    script_content = r"""
@echo off
chcp 65001 >nul
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo 🔍 Checking database migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo ❌ Migration failed.
    pause
    exit /b
)
echo ✅ Database ready
echo 🌐 Starting Django development server...
python manage.py runserver
pause
"""

    create_and_run_batch(start_script, script_content)


# Step 1: Check WebSocket support
safe_print("   🔄 Checking virtual environment and dependencies...")
has_websocket, ws_status = check_backend_dependencies()
safe_print(f"   📡 Status: {ws_status}")

# Step 2: Start appropriate backend
if has_websocket:
    start_backend_with_websocket()
    safe_print("   ✅ Backend started with WebSocket support")
    safe_print("   🔗 WebSocket endpoint: ws://127.0.0.1:8000/ws/messaging/")
else:
    safe_print("   ⚠️  Starting with regular Django server (WebSocket not available)")
    start_backend_fallback()

# Step 3: Delay for readability
time.sleep(2)

# Step 4: Start Frontend
safe_print("▶️ Starting frontend server...")
frontend_path = os.path.join(os.getcwd(), 'frontend')
if os.path.exists(frontend_path):
    subprocess.Popen(
        'start "" cmd /k "cd frontend && npm run dev:turbo"',
        shell=True
    )
else:
    safe_print("⚠️ Frontend directory not found, skipping frontend startup.")

# Step 5: Summary
safe_print("\n" + "="*60)
safe_print("✅ Both backend and frontend have been launched in separate terminals.")
safe_print("🔗 Backend: http://127.0.0.1:8000/")
safe_print("🔗 Frontend: http://localhost:3000/")
if has_websocket:
    safe_print("🔌 WebSocket: ws://127.0.0.1:8000/ws/messaging/")
safe_print("⏹️  Press Ctrl+C in the terminal windows to stop servers")
safe_print("="*60)
