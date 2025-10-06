"""
ASGI config for sewabazaar project with WebSocket support.
"""

import os
import django
from django.core.asgi import get_asgi_application

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')

# Initialize Django BEFORE importing anything that uses models
django.setup()

# Now we can safely import Django and Channels components
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from apps.messaging.consumers import MessagingConsumer

# Get the Django ASGI application
django_asgi_app = get_asgi_application()

# Define the ASGI application
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter([
            re_path(r"ws/messaging/$", MessagingConsumer.as_asgi()),
        ])
    ),
})
