#!/usr/bin/env python
"""
Test runner script for SewaBazaar backend
Runs all tests with coverage reporting
"""

import os
import sys
import subprocess
import django
from django.conf import settings

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
    django.setup()

def run_tests():
    """Run all tests with coverage"""
    print("🚀 Starting SewaBazaar Backend Tests...")
    print("=" * 50)
    
    # Run tests with coverage
    cmd = [
        'python', '-m', 'pytest',
        '--cov=apps',
        '--cov-report=html',
        '--cov-report=term-missing',
        '--cov-fail-under=80',
        '-v',
        '--tb=short'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        print("📊 Test Results:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Warnings/Errors:")
            print(result.stderr)
        
        if result.returncode == 0:
            print("✅ All tests passed!")
            print("📈 Coverage report generated in htmlcov/")
        else:
            print("❌ Some tests failed!")
            sys.exit(1)
            
    except FileNotFoundError:
        print("❌ pytest not found. Please install test dependencies:")
        print("pip install pytest pytest-django pytest-cov factory-boy coverage")
        sys.exit(1)

def run_specific_tests():
    """Run specific test categories"""
    print("🎯 Running Specific Test Categories...")
    print("=" * 50)
    
    test_categories = [
        ('accounts', 'User and Authentication Tests'),
        ('services', 'Service Management Tests'),
        ('bookings', 'Booking System Tests'),
        ('reviews', 'Review System Tests'),
    ]
    
    for app, description in test_categories:
        print(f"\n🔍 {description}")
        print("-" * 30)
        
        cmd = [
            'python', '-m', 'pytest',
            f'apps/{app}/',
            '--cov=apps.' + app,
            '--cov-report=term-missing',
            '-v',
            '--tb=short'
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            print(result.stdout)
            
            if result.stderr:
                print("⚠️  Warnings:")
                print(result.stderr)
                
        except FileNotFoundError:
            print("❌ pytest not found")

def run_performance_tests():
    """Run performance tests"""
    print("⚡ Running Performance Tests...")
    print("=" * 50)
    
    cmd = [
        'python', '-m', 'pytest',
        '-k', 'Performance',
        '--durations=10',
        '-v'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Warnings:")
            print(result.stderr)
            
    except FileNotFoundError:
        print("❌ pytest not found")

def main():
    """Main function"""
    setup_django()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'all':
            run_tests()
        elif command == 'specific':
            run_specific_tests()
        elif command == 'performance':
            run_performance_tests()
        else:
            print("Usage: python run_tests.py [all|specific|performance]")
            print("  all: Run all tests with coverage")
            print("  specific: Run tests by category")
            print("  performance: Run performance tests")
    else:
        run_tests()

if __name__ == '__main__':
    main()

