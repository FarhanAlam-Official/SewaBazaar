#!/usr/bin/env python
"""
Start SewaBazaar with Daphne ASGI server for WebSocket support
"""

import os
import sys
import subprocess

def main():
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
    
    print("🚀 Starting SewaBazaar with WebSocket Support (Daphne ASGI)")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print("❌ Error: manage.py not found. Please run this from the backend directory.")
        sys.exit(1)
    
    # Check if channels is installed
    try:
        import channels
        import daphne
        print("✅ Django Channels and Daphne are installed")
        print(f"   • Channels version: {channels.__version__}")
        print(f"   • Daphne version: {daphne.__version__}")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install with: pip install channels daphne")
        print("Or run: pip install -r requirements.txt")
        sys.exit(1)
    
    # Check database migrations
    print("🔍 Checking database migrations...")
    try:
        result = subprocess.run([sys.executable, 'manage.py', 'showmigrations', '--plan'], 
                              capture_output=True, text=True, check=True)
        if '[ ]' in result.stdout:
            print("⚠️  Unapplied migrations found. Running migrations...")
            subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
            print("✅ Database migrations completed")
        else:
            print("✅ Database is up to date")
    except subprocess.CalledProcessError:
        print("⚠️  Could not check migrations, continuing anyway...")
    
    print("\n🌐 Starting Daphne ASGI server...")
    print("   • WebSocket support: ✅ Enabled")
    print("   • Server: http://127.0.0.1:8000")
    print("   • WebSocket: ws://127.0.0.1:8000/ws/messaging/")
    print("   • Press Ctrl+C to stop\n")
    
    try:
        # Start Daphne ASGI server
        subprocess.run([
            'daphne', 
            '-b', '127.0.0.1', 
            '-p', '8000',
            'sewabazaar.asgi:application'
        ], check=True)
    except KeyboardInterrupt:
        print("\n⏹️  Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("\n❌ Daphne not found. Install with: pip install daphne")
        sys.exit(1)

if __name__ == "__main__":
    main()