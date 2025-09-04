import subprocess
import time

print("🚀 Starting development environment...")

# Start Backend
print("▶️ Starting backend server...")
subprocess.Popen(
    'start cmd /k "cd backend && .\\venv\\Scripts\\activate && python manage.py runserver"',
    shell=True
)

time.sleep(1)  # small delay so logs don't overlap

# Start Frontend
print("▶️ Starting frontend server...")
subprocess.Popen(
    'start cmd /k "cd frontend && npm run dev"',
    shell=True
)

print("✅ Both backend and frontend have been launched in separate terminals.")
print("🔗 Backend: http://127.0.0.1:8000/")
print("🔗 Frontend: http://localhost:5173/")
