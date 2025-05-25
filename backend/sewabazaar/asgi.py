"""
ASGI config for sewabazaar project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')

application = get_asgi_application()
