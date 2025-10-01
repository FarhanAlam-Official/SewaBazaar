#!/usr/bin/env python
"""
pytest configuration for SewaBazaar tests
"""

import os
import sys
import django
from django.conf import settings

# Add project root and backend to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_path)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')

# Setup Django
django.setup()

# pytest configuration
pytest_plugins = [
    # Add any pytest plugins here if needed
]