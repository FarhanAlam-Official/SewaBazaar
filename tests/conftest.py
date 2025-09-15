"""
SewaBazaar Test Configuration
"""

import os
import sys
import pytest

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Configure Django settings for tests
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.sewabazaar.settings')
os.environ.setdefault('TESTING', 'True')

# Configure default test markers
pytest_plugins = [
    'tests.fixtures.auth_fixtures',
    'tests.fixtures.db_fixtures',
]

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line("markers", "unit: mark a test as a unit test")
    config.addinivalue_line("markers", "integration: mark a test as an integration test")
    config.addinivalue_line("markers", "api: mark a test as an API test")
    config.addinivalue_line("markers", "e2e: mark a test as an end-to-end test")
    config.addinivalue_line("markers", "slow: mark a test as slow running")
