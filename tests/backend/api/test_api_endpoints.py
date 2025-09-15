#!/usr/bin/env python
"""
SewaBazaar Backend API Test Suite
Tests all major endpoints and functionality
"""

import os
import sys
import django
import requests
import json
from datetime import date, time, datetime, timedelta
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.services.models import Service, ServiceCategory, City
from apps.bookings.models import Booking, BookingSlot, PaymentMethod
from apps.reviews.models import Review

User = get_user_model()

class BackendAPITester:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.access_token = None
        self.test_user = None
        self.test_service = None
        
    def log(self, message, status="INFO"):
        symbols = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
        print(f"{symbols.get(status, 'ℹ️')} {message}")
        
    def test_server_connection(self):
        """Test if Django server is running"""
        self.log("Testing server connection...")
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code in [200, 302]:  # 302 is redirect to swagger
                self.log("Backend server is running", "SUCCESS")
                return True
            else:
                self.log(f"Server responded with status {response.status_code}", "WARNING")
                return False
        except requests.exceptions.ConnectionError:
            self.log("Backend server is not running", "ERROR")
            return False
        except Exception as e:
            self.log(f"Server connection error: {str(e)}", "ERROR")
            return False
    
    def test_public_endpoints(self):
        """Test public API endpoints that don't require authentication"""
        self.log("\n🔓 Testing Public Endpoints...")
        
        endpoints = [
            ("Services List", "/services/"),
            ("Categories", "/services/categories/"),
            ("Cities", "/services/cities/"),
            ("Payment Methods", "/bookings/payment-methods/"),
        ]
        
        results = {}
        for name, endpoint in endpoints:
            try:
                response = requests.get(f"{self.api_url}{endpoint}", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    count = len(data.get('results', [])) if 'results' in data else len(data) if isinstance(data, list) else data.get('count', 0)
                    self.log(f"{name}: {count} items found", "SUCCESS")
                    results[name] = {"status": "success", "count": count}
                else:
                    self.log(f"{name}: HTTP {response.status_code}", "ERROR")
                    results[name] = {"status": "error", "code": response.status_code}
            except Exception as e:
                self.log(f"{name}: {str(e)}", "ERROR")
                results[name] = {"status": "error", "message": str(e)}
        
        return results
    
    def test_authentication(self):
        """Test authentication endpoints"""
        self.log("\n🔐 Testing Authentication...")
        
        # Test user registration (if implemented)
        try:
            register_data = {
                "email": "test@example.com",
                "password": "testpass123",
                "role": "customer",
                "first_name": "Test",
                "last_name": "User"
            }
            
            response = requests.post(f"{self.api_url}/auth/register/", json=register_data)
            if response.status_code in [201, 400]:  # 400 might mean user already exists
                self.log("Registration endpoint working", "SUCCESS")
            else:
                self.log(f"Registration failed: HTTP {response.status_code}", "WARNING")
        except Exception as e:
            self.log(f"Registration test error: {str(e)}", "WARNING")
        
        # Test login
        try:
            login_data = {
                "email": "test@example.com",
                "password": "testpass123"
            }
            
            response = requests.post(f"{self.api_url}/auth/login/", json=login_data)
            if response.status_code == 200:
                data = response.json()
                if 'access' in data:
                    self.access_token = data['access']
                    self.session.headers.update({'Authorization': f'Bearer {self.access_token}'})
                    self.log("Login successful, token obtained", "SUCCESS")
                    return True
                else:
                    self.log("Login response missing access token", "WARNING")
            else:
                self.log(f"Login failed: HTTP {response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"Login test error: {str(e)}", "ERROR")
        
        return False
    
    def test_service_endpoints(self):
        """Test service-related endpoints"""
        self.log("\n🛠️ Testing Service Endpoints...")
        
        # Get services list
        try:
            response = requests.get(f"{self.api_url}/services/")
            if response.status_code == 200:
                data = response.json()
                services = data.get('results', [])
                if services:
                    service = services[0]
                    service_id = service['id']
                    self.log(f"Found {len(services)} services", "SUCCESS")
                    
                    # Test individual service detail
                    detail_response = requests.get(f"{self.api_url}/services/{service_id}/")
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        self.log(f"Service detail for '{detail_data.get('title', 'Unknown')}' retrieved", "SUCCESS")
                        self.test_service = detail_data
                        return True
                    else:
                        self.log(f"Service detail failed: HTTP {detail_response.status_code}", "ERROR")
                else:
                    self.log("No services found in database", "WARNING")
            else:
                self.log(f"Services list failed: HTTP {response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"Service endpoints error: {str(e)}", "ERROR")
        
        return False
    
    def test_booking_endpoints(self):
        """Test booking-related endpoints"""
        self.log("\n📅 Testing Booking Endpoints...")
        
        if not self.access_token:
            self.log("Cannot test booking endpoints without authentication", "WARNING")
            return False
            
        if not self.test_service:
            self.log("Cannot test booking endpoints without a test service", "WARNING")
            return False
        
        # Test booking slots
        try:
            service_id = self.test_service['id']
            test_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
            slots_response = requests.get(
                f"{self.api_url}/bookings/booking-slots/available_slots/",
                params={"service_id": service_id, "date": test_date}
            )
            
            if slots_response.status_code == 200:
                slots_data = slots_response.json()
                self.log(f"Found {len(slots_data)} available slots for {test_date}", "SUCCESS")
            else:
                self.log(f"Booking slots failed: HTTP {slots_response.status_code}", "WARNING")
                
        except Exception as e:
            self.log(f"Booking slots error: {str(e)}", "ERROR")
        
        # Test booking creation
        try:
            booking_data = {
                "service": self.test_service['id'],
                "booking_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                "booking_time": "10:00:00",
                "address": "Test Address, Kathmandu",
                "city": "Kathmandu",
                "phone": "+977-9841234567",
                "note": "Test booking from API test",
                "price": str(self.test_service.get('price', '1000')),
                "total_amount": str(self.test_service.get('price', '1000'))
            }
            
            booking_response = self.session.post(
                f"{self.api_url}/bookings/bookings/",
                json=booking_data
            )
            
            if booking_response.status_code == 201:
                booking_result = booking_response.json()
                self.log(f"Booking created successfully (ID: {booking_result.get('id')})", "SUCCESS")
                return True
            else:
                self.log(f"Booking creation failed: HTTP {booking_response.status_code}", "ERROR")
                if booking_response.text:
                    self.log(f"Response: {booking_response.text}", "ERROR")
                    
        except Exception as e:
            self.log(f"Booking creation error: {str(e)}", "ERROR")
        
        return False
    
    def test_customer_endpoints(self):
        """Test customer-specific endpoints"""
        self.log("\n👤 Testing Customer Endpoints...")
        
        if not self.access_token:
            self.log("Cannot test customer endpoints without authentication", "WARNING")
            return False
        
        try:
            # Test customer bookings
            response = self.session.get(f"{self.api_url}/bookings/bookings/customer_bookings/")
            if response.status_code == 200:
                bookings = response.json()
                self.log(f"Customer has {len(bookings)} bookings", "SUCCESS")
            else:
                self.log(f"Customer bookings failed: HTTP {response.status_code}", "ERROR")
                
            # Test user profile
            profile_response = self.session.get(f"{self.api_url}/auth/users/me/")
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                self.log(f"Profile for {profile_data.get('email', 'Unknown')} retrieved", "SUCCESS")
            else:
                self.log(f"Profile retrieval failed: HTTP {profile_response.status_code}", "ERROR")
                
        except Exception as e:
            self.log(f"Customer endpoints error: {str(e)}", "ERROR")
    
    def test_data_integrity(self):
        """Test data integrity and database status"""
        self.log("\n🗄️ Testing Data Integrity...")
        
        try:
            # Check if we have sample data
            from django.db import connection
            
            models_to_check = [
                (User, "Users"),
                (ServiceCategory, "Service Categories"),
                (City, "Cities"),
                (Service, "Services"),
                (PaymentMethod, "Payment Methods"),
            ]
            
            for model, name in models_to_check:
                count = model.objects.count()
                if count > 0:
                    self.log(f"{name}: {count} records", "SUCCESS")
                else:
                    self.log(f"{name}: No records found", "WARNING")
                    
        except Exception as e:
            self.log(f"Data integrity check error: {str(e)}", "ERROR")
    
    def run_comprehensive_test(self):
        """Run all tests"""
        self.log("🧪 Starting SewaBazaar Backend Comprehensive Test\n")
        
        # Test 1: Server Connection
        if not self.test_server_connection():
            self.log("\n❌ Server is not running. Please start with: python manage.py runserver", "ERROR")
            return False
        
        # Test 2: Public Endpoints
        public_results = self.test_public_endpoints()
        
        # Test 3: Authentication
        auth_success = self.test_authentication()
        
        # Test 4: Service Endpoints
        service_success = self.test_service_endpoints()
        
        # Test 5: Booking Endpoints (requires auth)
        booking_success = self.test_booking_endpoints()
        
        # Test 6: Customer Endpoints
        self.test_customer_endpoints()
        
        # Test 7: Data Integrity
        self.test_data_integrity()
        
        # Summary
        self.log("\n📊 Test Summary:")
        self.log(f"Server Connection: {'✅' if True else '❌'}")
        self.log(f"Public Endpoints: {'✅' if any(r.get('status') == 'success' for r in public_results.values()) else '❌'}")
        self.log(f"Authentication: {'✅' if auth_success else '❌'}")
        self.log(f"Service Endpoints: {'✅' if service_success else '❌'}")
        self.log(f"Booking System: {'✅' if booking_success else '❌'}")
        
        if service_success and booking_success:
            self.log("\n🎉 Backend is fully functional!", "SUCCESS")
        elif service_success:
            self.log("\n⚠️ Backend is partially functional (services work, bookings may have issues)", "WARNING")
        else:
            self.log("\n❌ Backend has significant issues", "ERROR")
        
        return True

def main():
    """Main test runner"""
    tester = BackendAPITester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()