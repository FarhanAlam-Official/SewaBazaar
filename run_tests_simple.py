#!/usr/bin/env python
"""
Simple test runner for SewaBazaar backend tests
Sets up Django environment and runs tests
"""

import os
import sys
import django

def setup_django():
    """Setup Django environment"""
    # Add the project root to Python path
    project_root = os.path.dirname(os.path.abspath(__file__))
    backend_path = os.path.join(project_root, 'backend')
    sys.path.insert(0, project_root)
    sys.path.insert(0, backend_path)
    
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
    
    # Setup Django
    django.setup()

def run_single_test():
    """Run a single test to verify our setup works"""
    setup_django()
    
    # Import Django test runner
    from django.test.utils import get_runner
    from django.conf import settings
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # Run a simple test
    failures = test_runner.run_tests(['tests.backend.unit.accounts.tests.UserModelTest.test_create_user'])
    
    if failures:
        print("❌ Test failed!")
        sys.exit(1)
    else:
        print("✅ Test passed!")
        sys.exit(0)

if __name__ == '__main__':
    run_single_test()