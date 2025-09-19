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

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()


def run_tests_with_coverage():
    """Run tests with coverage reporting"""
    
    print("="*80)
    print("PROVIDER DASHBOARD COMPREHENSIVE TESTING")
    print("="*80)
    
    # Test modules to run
    test_modules = [
        'apps.notifications.tests',
        'apps.bookings.test_provider_dashboard',
        'apps.accounts.test_provider_features',
        'apps.bookings.tests',  # Existing tests
        'apps.accounts.tests',  # If they exist
    ]
    
    # Coverage command
    coverage_cmd = [
        'coverage', 'run', '--source=.',
        '--omit=venv/*,*/migrations/*,*/tests/*,*/test_*,manage.py,sewabazaar/settings.py,*/venv/*',
        'manage.py', 'test'
    ] + test_modules
    
    print("Running tests with coverage...")
    print(f"Command: {' '.join(coverage_cmd)}")
    print("-" * 80)
    
    try:
        # Run tests with coverage
        result = subprocess.run(coverage_cmd, capture_output=False, text=True)
        
        if result.returncode == 0:
            print("\n" + "="*80)
            print("TESTS COMPLETED SUCCESSFULLY!")
            print("="*80)
            
            # Generate coverage report
            print("\nGenerating coverage report...")
            subprocess.run(['coverage', 'report', '--show-missing'], check=True)
            
            print("\nGenerating HTML coverage report...")
            subprocess.run(['coverage', 'html'], check=True)
            
            print("\nCoverage reports generated:")
            print("- Console report: shown above")
            print("- HTML report: htmlcov/index.html")
            
            # Show coverage summary
            print("\n" + "="*80)
            print("COVERAGE SUMMARY")
            print("="*80)
            subprocess.run(['coverage', 'report', '--skip-covered'], check=True)
            
        else:
            print("\n" + "="*80)
            print("TESTS FAILED!")
            print("="*80)
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"Error running tests: {e}")
        return False
    except FileNotFoundError:
        print("Coverage not installed. Installing...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'coverage'], check=True)
        print("Please run the script again.")
        return False
    
    return True


def run_specific_test_categories():
    """Run specific categories of tests"""
    
    categories = {
        'models': [
            'apps.notifications.tests.NotificationModelTest',
            'apps.notifications.tests.UserNotificationSettingModelTest',
            'apps.accounts.test_provider_features.ProviderProfileModelTest',
            'apps.accounts.test_provider_features.PortfolioMediaModelTest',
        ],
        'api': [
            'apps.notifications.tests.NotificationAPITest',
            'apps.notifications.tests.NotificationPreferencesAPITest',
            'apps.bookings.test_provider_dashboard.ProviderDashboardAPITest',
            'apps.bookings.test_provider_dashboard.ProviderBookingManagementAPITest',
            'apps.accounts.test_provider_features.ProviderProfileAPITest',
        ],
        'permissions': [
            'apps.bookings.test_provider_dashboard.ProviderPermissionTest',
            'apps.accounts.test_provider_features.ProviderAuthenticationTest',
            'apps.accounts.test_provider_features.ProviderSecurityTest',
        ],
        'performance': [
            'apps.notifications.tests.NotificationPerformanceTest',
            'apps.bookings.test_provider_dashboard.ProviderDashboardPerformanceTest',
        ],
        'serializers': [
            'apps.notifications.tests.NotificationSerializerTest',
            'apps.accounts.test_provider_features.ProviderSerializerTest',
        ]
    }
    
    print("\nAvailable test categories:")
    for i, (category, tests) in enumerate(categories.items(), 1):
        print(f"{i}. {category.upper()} ({len(tests)} test classes)")
    
    print("0. Run all categories")
    
    try:
        choice = input("\nSelect category to run (0-{}): ".format(len(categories)))
        choice = int(choice)
        
        if choice == 0:
            # Run all
            all_tests = []
            for tests in categories.values():
                all_tests.extend(tests)
            return run_test_list(all_tests, "ALL CATEGORIES")
        elif 1 <= choice <= len(categories):
            category_name = list(categories.keys())[choice - 1]
            tests = categories[category_name]
            return run_test_list(tests, category_name.upper())
        else:
            print("Invalid choice!")
            return False
            
    except (ValueError, KeyboardInterrupt):
        print("\nOperation cancelled.")
        return False


def run_test_list(test_list, category_name):
    """Run a specific list of tests"""
    
    print(f"\nRunning {category_name} tests...")
    print("-" * 60)
    
    cmd = ['python', 'manage.py', 'test'] + test_list + ['-v', '2']
    
    try:
        result = subprocess.run(cmd, capture_output=False, text=True)
        
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
    
    performance_tests = [
        'apps.notifications.tests.NotificationPerformanceTest',
        'apps.bookings.test_provider_dashboard.ProviderDashboardPerformanceTest',
    ]
    
    # Run with timing
    cmd = ['python', 'manage.py', 'test'] + performance_tests + [
        '-v', '2', '--timing', '--parallel'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=False, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"Error running performance tests: {e}")
        return False


def run_security_tests():
    """Run security-specific tests"""
    
    print("\n" + "="*80)
    print("SECURITY TESTING")
    print("="*80)
    
    security_tests = [
        'apps.accounts.test_provider_features.ProviderAuthenticationTest',
        'apps.accounts.test_provider_features.ProviderSecurityTest',
        'apps.bookings.test_provider_dashboard.ProviderPermissionTest',
    ]
    
    cmd = ['python', 'manage.py', 'test'] + security_tests + ['-v', '2']
    
    try:
        result = subprocess.run(cmd, capture_output=False, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"Error running security tests: {e}")
        return False


def generate_test_report():
    """Generate a comprehensive test report"""
    
    print("\n" + "="*80)
    print("GENERATING TEST REPORT")
    print("="*80)
    
    # Run tests with XML output for reporting
    cmd = [
        'python', 'manage.py', 'test',
        '--with-xunit',
        '--xunit-file=test_results.xml',
        '-v', '2'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        print("Test execution completed.")
        print(f"Exit code: {result.returncode}")
        
        if result.stdout:
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