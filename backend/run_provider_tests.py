#!/usr/bin/env python
"""
Comprehensive test runner for Provider Dashboard functionality
Runs all provider-related tests with coverage reporting
"""

import os
import sys
import subprocess
import django
from django.conf import settings
from django.test.utils import get_runner
from django.core.management import execute_from_command_line

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()


def run_tests_with_coverage():
    """Run tests with coverage reporting"""
    
    print("="*80)
    print("PROVIDER DASHBOARD COMPREHENSIVE TESTING")
    print("="*80)
    
    # Test paths updated to use the correct test directory structure
    test_paths = [
        '../tests/backend/unit/accounts',
        '../tests/backend/unit/bookings',
        '../tests/backend/unit/notifications',
    ]
    
    # Coverage command - updated to work with the new structure
    cmd = [
        'python', '-m', 'pytest'
    ] + test_paths + [
        '--cov=apps',
        '--cov-report=term-missing',
        '--cov-report=html',
        '-v',
        '--tb=short'
    ]
    
    print("Running tests with coverage...")
    print(f"Command: {' '.join(cmd)}")
    print("-" * 80)
    
    try:
        # Run tests with coverage
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        print("\n📊 Test Results:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Warnings/Errors:")
            print(result.stderr)
        
        if result.returncode == 0:
            print("\n" + "="*80)
            print("TESTS COMPLETED SUCCESSFULLY!")
            print("="*80)
            
            print("\n📈 Coverage reports generated in htmlcov/")
            return True
        else:
            print("\n" + "="*80)
            print("TESTS FAILED!")
            print("="*80)
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"Error running tests: {e}")
        return False
    except FileNotFoundError:
        print("pytest not found. Please install test dependencies:")
        print("pip install pytest pytest-django pytest-cov factory-boy coverage")
        return False

def run_specific_test_categories():
    """Run specific categories of tests"""
    
    categories = {
        'accounts': [
            '../tests/backend/unit/accounts',
        ],
        'bookings': [
            '../tests/backend/unit/bookings',
        ],
        'notifications': [
            '../tests/backend/unit/notifications',
        ],
        'reviews': [
            '../tests/backend/unit/reviews',
        ],
        'services': [
            '../tests/backend/unit/services',
        ]
    }
    
    print("\nAvailable test categories:")
    for i, category in enumerate(categories.keys(), 1):
        print(f"{i}. {category.upper()}")
    
    print("0. Run all categories")
    
    try:
        choice = input("\nSelect category to run (0-{}): ".format(len(categories)))
        choice = int(choice)
        
        if choice == 0:
            # Run all
            all_paths = []
            for paths in categories.values():
                all_paths.extend(paths)
            return run_test_paths(all_paths, "ALL CATEGORIES")
        elif 1 <= choice <= len(categories):
            category_name = list(categories.keys())[choice - 1]
            paths = categories[category_name]
            return run_test_paths(paths, category_name.upper())
        else:
            print("Invalid choice!")
            return False
            
    except (ValueError, KeyboardInterrupt):
        print("\nOperation cancelled.")
        return False

def run_test_paths(test_paths, category_name):
    """Run tests for specific paths"""
    
    print(f"\nRunning {category_name} tests...")
    print("-" * 60)
    
    cmd = [
        'python', '-m', 'pytest'
    ] + test_paths + [
        '-v',
        '--tb=short'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Warnings:")
            print(result.stderr)
        
        if result.returncode == 0:
            print(f"\n{category_name} tests completed successfully!")
            return True
        else:
            print(f"\n{category_name} tests failed!")
            return False
            
    except Exception as e:
        print(f"Error running {category_name} tests: {e}")
        return False

def run_performance_tests():
    """Run performance-specific tests"""
    
    print("\n" + "="*80)
    print("PERFORMANCE TESTING")
    print("="*80)
    
    # Run with timing
    cmd = [
        'python', '-m', 'pytest',
        '../tests/backend',
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
            
        return result.returncode == 0
    except Exception as e:
        print(f"Error running performance tests: {e}")
        return False

def run_security_tests():
    """Run security-specific tests"""
    
    print("\n" + "="*80)
    print("SECURITY TESTING")
    print("="*80)
    
    cmd = [
        'python', '-m', 'pytest',
        '../tests/backend',
        '-k', 'security',
        '-v'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Warnings:")
            print(result.stderr)
            
        return result.returncode == 0
    except Exception as e:
        print(f"Error running security tests: {e}")
        return False

def generate_test_report():
    """Generate a comprehensive test report"""
    
    print("\n" + "="*80)
    print("GENERATING TEST REPORT")
    print("="*80)
    
    # Run tests with coverage for reporting
    cmd = [
        'python', '-m', 'pytest',
        '../tests/backend',
        '--cov=apps',
        '--cov-report=term-missing',
        '--cov-report=html',
        '-v'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        print("Test execution completed.")
        print(f"Exit code: {result.returncode}")
        
        print("\nTest output:")
        print(result.stdout)
        
        if result.stderr:
            print("\nTest errors:")
            print(result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error generating test report: {e}")
        return False

def main():
    """Main test runner function"""
    
    print("Provider Dashboard Test Suite")
    print("="*50)
    print("1. Run all tests with coverage")
    print("2. Run specific test categories")
    print("3. Run performance tests only")
    print("4. Run security tests only")
    print("5. Generate test report")
    print("0. Exit")
    
    try:
        choice = input("\nSelect option (0-5): ")
        choice = int(choice)
        
        if choice == 1:
            success = run_tests_with_coverage()
        elif choice == 2:
            success = run_specific_test_categories()
        elif choice == 3:
            success = run_performance_tests()
        elif choice == 4:
            success = run_security_tests()
        elif choice == 5:
            success = generate_test_report()
        elif choice == 0:
            print("Goodbye!")
            return
        else:
            print("Invalid choice!")
            return
        
        if success:
            print("\n" + "="*80)
            print("✅ TESTING COMPLETED SUCCESSFULLY!")
            print("="*80)
        else:
            print("\n" + "="*80)
            print("❌ TESTING FAILED!")
            print("="*80)
            sys.exit(1)
            
    except (ValueError, KeyboardInterrupt):
        print("\nOperation cancelled.")
        sys.exit(0)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()