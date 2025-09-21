#!/usr/bin/env python
"""
Simple script to show all registered URLs in Django
"""

import os
import sys
import django
from django.urls import get_resolver
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

def show_urls():
    """Show all registered URLs"""
    print("All registered URLs in the application:")
    print("=" * 60)
    
    resolver = get_resolver()
    urls = []
    
    def extract_urls(patterns, prefix=''):
        for pattern in patterns:
            if hasattr(pattern, 'url_patterns'):
                # This is an include
                new_prefix = prefix + str(pattern.pattern)
                extract_urls(pattern.url_patterns, new_prefix)
            else:
                # This is a regular pattern
                url_pattern = prefix + str(pattern.pattern)
                urls.append({
                    'pattern': url_pattern,
                    'name': getattr(pattern, 'name', None),
                    'callback': getattr(pattern.callback, '__name__', str(pattern.callback)) if hasattr(pattern, 'callback') else 'Unknown'
                })
    
    extract_urls(resolver.url_patterns)
    
    # Filter for bookings related URLs
    bookings_urls = [url for url in urls if 'bookings' in url['pattern']]
    
    print("Booking related URLs:")
    print("-" * 40)
    for url in bookings_urls:
        print(f"Pattern: {url['pattern']}")
        print(f"  Name: {url['name']}")
        print(f"  Callback: {url['callback']}")
        print()
    
    # Specifically look for provider bookings URLs
    provider_booking_urls = [url for url in urls if 'provider_bookings' in url['pattern']]
    
    print("Provider Booking URLs:")
    print("-" * 40)
    for url in provider_booking_urls:
        print(f"Pattern: {url['pattern']}")
        print(f"  Name: {url['name']}")
        print(f"  Callback: {url['callback']}")
        print()

if __name__ == '__main__':
    show_urls()