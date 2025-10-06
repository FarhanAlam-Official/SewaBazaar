#!/usr/bin/env python
"""
Redis availability checker for SewaBazaar WebSocket functionality.
"""

import socket
import subprocess
import sys
import os

def check_redis_connection():
    """Check if Redis is available on localhost:6379"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex(('127.0.0.1', 6379))
        sock.close()
        return result == 0
    except:
        return False

def check_redis_installed():
    """Check if Redis is installed"""
    try:
        # Try to run redis-server --version
        result = subprocess.run(['redis-server', '--version'], 
                              capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def main():
    print("🔍 Checking Redis Status for SewaBazaar WebSocket System...")
    print("=" * 60)
    
    # Check if Redis is installed
    redis_installed = check_redis_installed()
    if redis_installed:
        print("✅ Redis is installed")
    else:
        print("❌ Redis is not installed")
    
    # Check if Redis is running
    redis_running = check_redis_connection()
    if redis_running:
        print("✅ Redis server is running on port 6379")
        print("\n🎉 Your WebSocket system should work with Redis!")
    else:
        print("❌ Redis server is not running on port 6379")
        
        if redis_installed:
            print("\n💡 Redis Installation Instructions:")
            print("   Redis is installed but not running. Start it with:")
            print("   • Windows: redis-server")
            print("   • Linux/macOS: redis-server /etc/redis/redis.conf")
        else:
            print("\n💡 Redis Installation Instructions:")
            print("   Redis is not installed. Install it:")
            print("\n   📦 Windows:")
            print("   1. Download from: https://github.com/microsoftarchive/redis/releases")
            print("   2. Or use Chocolatey: choco install redis-64")
            print("   3. Or use Windows Subsystem for Linux (WSL)")
            
            print("\n   🐧 Ubuntu/Debian:")
            print("   sudo apt update && sudo apt install redis-server")
            
            print("\n   🍎 macOS:")
            print("   brew install redis")
            
            print("\n   🐳 Docker (All platforms):")
            print("   docker run -d -p 6379:6379 redis:alpine")
    
    print("\n" + "=" * 60)
    print("📝 Current Status:")
    if redis_running:
        print("   • WebSocket system: ✅ Full functionality with Redis")
        print("   • Message persistence: ✅ Across server restarts") 
        print("   • Multi-user broadcasting: ✅ Supported")
    else:
        print("   • WebSocket system: ⚠️  Using in-memory fallback")
        print("   • Message persistence: ❌ Lost on server restart")
        print("   • Multi-user broadcasting: ⚠️  Limited to single process")
        
    print("\n🚀 Next Steps:")
    print("   1. Start Django server: python manage.py runserver")
    print("   2. Start frontend: cd ../frontend && npm run dev")
    print("   3. Test messaging at: http://localhost:3000")
    
    if not redis_running:
        print("   4. Install and start Redis for full functionality")
    
    return redis_running

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️  Check cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        sys.exit(1)