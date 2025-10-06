#!/usr/bin/env python
"""
WebSocket integration test for Phase 3C backend integration.
"""

import asyncio
import websockets
import json
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

class WebSocketTester:
    def __init__(self, ws_url="ws://127.0.0.1:8000/ws/messaging/"):
        self.ws_url = ws_url
        self.websocket = None
    
    async def connect(self, user_id=1):
        """Connect to WebSocket with user authentication"""
        url_with_auth = f"{self.ws_url}?user_id={user_id}"
        print(f"Connecting to: {url_with_auth}")
        
        try:
            self.websocket = await websockets.connect(url_with_auth)
            print("✅ WebSocket connected successfully")
            return True
        except Exception as e:
            print(f"❌ WebSocket connection failed: {str(e)}")
            return False
    
    async def send_message(self, message_data):
        """Send a message through WebSocket"""
        if not self.websocket:
            print("❌ WebSocket not connected")
            return False
        
        try:
            await self.websocket.send(json.dumps(message_data))
            print(f"📤 Sent: {json.dumps(message_data, indent=2)}")
            return True
        except Exception as e:
            print(f"❌ Failed to send message: {str(e)}")
            return False
    
    async def receive_message(self, timeout=5):
        """Receive a message from WebSocket"""
        if not self.websocket:
            print("❌ WebSocket not connected")
            return None
        
        try:
            message = await asyncio.wait_for(
                self.websocket.recv(), 
                timeout=timeout
            )
            parsed = json.loads(message)
            print(f"📥 Received: {json.dumps(parsed, indent=2)}")
            return parsed
        except asyncio.TimeoutError:
            print(f"⏰ No message received within {timeout} seconds")
            return None
        except Exception as e:
            print(f"❌ Failed to receive message: {str(e)}")
            return None
    
    async def test_connection(self):
        """Test basic WebSocket connection"""
        print("\n🔍 Testing WebSocket Connection...")
        
        if await self.connect(user_id=1):
            # Wait for connection confirmation
            response = await self.receive_message(timeout=3)
            if response and response.get('type') == 'connection':
                print("✅ Connection confirmed by server")
                return True
            else:
                print("⚠️ No connection confirmation received")
        return False
    
    async def test_heartbeat(self):
        """Test heartbeat/ping functionality"""
        print("\n🔍 Testing Heartbeat...")
        
        heartbeat_msg = {
            "type": "heartbeat",
            "data": {}
        }
        
        if await self.send_message(heartbeat_msg):
            response = await self.receive_message(timeout=3)
            if response and response.get('type') == 'heartbeat':
                print("✅ Heartbeat working correctly")
                return True
            else:
                print("❌ Heartbeat failed")
        return False
    
    async def test_typing_indicator(self):
        """Test typing indicator functionality"""
        print("\n🔍 Testing Typing Indicator...")
        
        typing_msg = {
            "type": "typing",
            "data": {
                "conversation_id": 1,
                "is_typing": True
            }
        }
        
        if await self.send_message(typing_msg):
            print("✅ Typing indicator sent")
            return True
        return False
    
    async def test_chat_message(self):
        """Test chat message sending"""
        print("\n🔍 Testing Chat Message...")
        
        chat_msg = {
            "type": "message",
            "data": {
                "conversation_id": 1,
                "content": "Hello, this is a test message from WebSocket!"
            }
        }
        
        if await self.send_message(chat_msg):
            # Wait for potential echo or confirmation
            response = await self.receive_message(timeout=3)
            print("✅ Chat message sent (check server logs for processing)")
            return True
        return False

    async def test_voice_message_notification(self):
        """Test voice message notification via WebSocket"""
        print("\n🔍 Testing Voice Message Notification...")
        
        voice_msg_notification = {
            "type": "voice_message",
            "data": {
                "conversation_id": 1,
                "sender_id": 1,
                "duration": 15,
                "file_size": "2.3MB",
                "status": "sent"
            }
        }
        
        if await self.send_message(voice_msg_notification):
            response = await self.receive_message(timeout=5)
            if response and response.get('type') == 'voice_message':
                print("✅ Voice message notification handled correctly")
                return True
            else:
                print("⚠️ Voice message notification sent but no response received")
        return False

    async def test_voice_message_status_update(self):
        """Test voice message status updates (delivered, read)"""
        print("\n🔍 Testing Voice Message Status Updates...")
        
        status_update = {
            "type": "message_status",
            "data": {
                "message_id": 1,
                "conversation_id": 1,
                "status": "delivered",
                "message_type": "audio"
            }
        }
        
        if await self.send_message(status_update):
            print("✅ Voice message status update sent")
            return True
        return False
    
    async def cleanup(self):
        """Close WebSocket connection"""
        if self.websocket:
            await self.websocket.close()
            print("🔌 WebSocket connection closed")

async def run_tests():
    """Run all WebSocket integration tests"""
    print("🚀 Starting WebSocket Integration Tests for Phase 3C")
    print("=" * 60)
    
    tester = WebSocketTester()
    
    try:
        # Test basic connection
        if not await tester.test_connection():
            print("\n❌ Basic connection test failed. Is Django server running with WebSocket support?")
            return False
        
        # Test heartbeat
        await tester.test_heartbeat()
        
        # Test typing indicator
        await tester.test_typing_indicator()
        
        # Test chat message
        await tester.test_chat_message()
        
        # Test voice message functionality
        await tester.test_voice_message_notification()
        await tester.test_voice_message_status_update()
        
        print("\n" + "=" * 60)
        print("✅ WebSocket Integration Tests Completed")
        print("\nNext Steps:")
        print("1. Start Django server: python manage.py runserver")
        print("2. Start Next.js frontend: npm run dev")
        print("3. Test real-time messaging in browser")
        print("4. Visit /test/websocket for live testing dashboard")
        print("5. Test voice message recording and playback")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {str(e)}")
        return False
    
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    asyncio.run(run_tests())