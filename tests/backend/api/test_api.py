#!/usr/bin/env python3
"""
Simple Backend Test Script
Tests SewaBazaar backend API endpoints without requiring Django setup
Run this from anywhere to test if the backend is working
"""

import requests
import json
import sys
from datetime import datetime, timedelta

class SewaBazaarBackendTester:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def print_result(self, test_name, success, message="", data=None):
        """Print formatted test results"""
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {test_name}")
        if message:
            print(f"   {message}")
        if data and isinstance(data, dict):
            for key, value in data.items():
                print(f"   - {key}: {value}")
        print()

    def test_server_status(self):
        """Test if the Django server is running"""
        print("🔍 Testing Server Connection...")
        try:
            # Test root endpoint (should redirect to swagger)
            response = requests.get(self.base_url, timeout=5)
            if response.status_code in [200, 302]:
                self.print_result("Server Status", True, "Backend server is running")
                return True
            else:
                self.print_result("Server Status", False, f"Server returned status {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            self.print_result("Server Status", False, "Cannot connect to server. Is it running?")
            print("💡 Start the server with: cd backend && python manage.py runserver")
            return False
        except Exception as e:
            self.print_result("Server Status", False, f"Connection error: {str(e)}")
            return False

    def test_services_api(self):
        """Test services-related endpoints"""
        print("🛠️ Testing Services API...")
        
        # Test services list
        try:
            response = requests.get(f"{self.api_url}/services/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                services_count = len(data.get('results', []))
                total_count = data.get('count', services_count)
                
                self.print_result("Services List", True, f"Found {services_count} services (total: {total_count})")
                
                # Test individual service if available
                if services_count > 0:
                    service = data['results'][0]
                    service_id = service.get('id')
                    service_title = service.get('title', 'Unknown')
                    
                    # Test service detail by ID (should convert to slug)
                    detail_response = requests.get(f"{self.api_url}/services/{service_id}/")
                    if detail_response.status_code == 200:
                        self.print_result("Service Detail", True, f"Retrieved details for '{service_title}' via ID {service_id}")
                    else:
                        # Try with slug if available
                        service_slug = service.get('slug')
                        if service_slug:
                            slug_response = requests.get(f"{self.api_url}/services/{service_slug}/")
                            if slug_response.status_code == 200:
                                self.print_result("Service Detail", True, f"Retrieved details for '{service_title}' via slug {service_slug}")
                            else:
                                self.print_result("Service Detail", False, f"Failed with both ID and slug (HTTP {detail_response.status_code}/{slug_response.status_code})")
                        else:
                            self.print_result("Service Detail", False, f"Failed to get details (HTTP {detail_response.status_code})")
                else:
                    self.print_result("Service Detail", False, "No services available to test")
                    
            else:
                self.print_result("Services List", False, f"HTTP {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            self.print_result("Services API", False, f"Error: {str(e)}")

    def test_categories_and_cities(self):
        """Test categories and cities endpoints"""
        print("📋 Testing Categories and Cities...")
        
        # Test categories
        try:
            response = requests.get(f"{self.api_url}/services/categories/")
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else len(data.get('results', []))
                self.print_result("Categories", True, f"Found {count} categories")
            else:
                self.print_result("Categories", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_result("Categories", False, f"Error: {str(e)}")

        # Test cities
        try:
            response = requests.get(f"{self.api_url}/services/cities/")
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else len(data.get('results', []))
                self.print_result("Cities", True, f"Found {count} cities")
            else:
                self.print_result("Cities", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_result("Cities", False, f"Error: {str(e)}")

    def test_booking_endpoints(self):
        """Test booking-related endpoints (public parts)"""
        print("📅 Testing Booking Endpoints...")
        
        # Test payment methods
        try:
            response = requests.get(f"{self.api_url}/bookings/payment-methods/")
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else len(data.get('results', []))
                self.print_result("Payment Methods", True, f"Found {count} payment methods")
            else:
                self.print_result("Payment Methods", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_result("Payment Methods", False, f"Error: {str(e)}")

        # Test booking slots (requires service_id, so this will likely fail without auth)
        try:
            test_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            response = requests.get(
                f"{self.api_url}/bookings/booking-slots/available_slots/",
                params={"service_id": 1, "date": test_date}
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else 0
                self.print_result("Booking Slots", True, f"Found {count} available slots")
            elif response.status_code == 400:
                self.print_result("Booking Slots", True, "Endpoint exists but requires valid service_id")
            else:
                self.print_result("Booking Slots", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_result("Booking Slots", False, f"Error: {str(e)}")

    def test_authentication_endpoints(self):
        """Test authentication endpoints"""
        print("🔐 Testing Authentication...")
        
        # Test login endpoint with invalid credentials (should return 401)
        try:
            response = requests.post(f"{self.api_url}/auth/login/", json={
                "email": "test@example.com",
                "password": "wrongpassword"
            })
            if response.status_code in [400, 401]:
                self.print_result("Login Endpoint", True, "Login endpoint is working (rejected invalid credentials)")
            elif response.status_code == 200:
                self.print_result("Login Endpoint", True, "Login endpoint working (credentials may be valid)")
            else:
                self.print_result("Login Endpoint", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.print_result("Login Endpoint", False, f"Error: {str(e)}")

    def test_swagger_docs(self):
        """Test if API documentation is available"""
        print("📚 Testing API Documentation...")
        
        try:
            response = requests.get(f"{self.base_url}/swagger/")
            if response.status_code == 200:
                self.print_result("Swagger Docs", True, f"Available at {self.base_url}/swagger/")
            else:
                self.print_result("Swagger Docs", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_result("Swagger Docs", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run comprehensive backend tests"""
        print("🧪 SewaBazaar Backend API Test Suite")
        print("=" * 50)
        
        # Test 1: Server Connection
        if not self.test_server_status():
            print("\n❌ Cannot proceed with API tests - server is not running")
            return False
        
        # Test 2: Core APIs
        self.test_services_api()
        self.test_categories_and_cities()
        self.test_booking_endpoints()
        self.test_authentication_endpoints()
        self.test_swagger_docs()
        
        # Summary
        print("📊 Test Summary")
        print("=" * 50)
        print("✅ If most tests passed, your backend is working correctly!")
        print("⚠️  Some endpoints may require authentication to test fully")
        print("📖 Check Swagger docs for complete API documentation")
        print(f"🌐 API Base URL: {self.api_url}")
        
        return True

def main():
    """Main entry point"""
    print("Starting SewaBazaar Backend Tests...\n")
    
    # Allow custom URL via command line
    base_url = "http://127.0.0.1:8000"
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
        print(f"Using custom base URL: {base_url}")
    
    tester = SewaBazaarBackendTester(base_url)
    tester.run_all_tests()

if __name__ == "__main__":
    main()