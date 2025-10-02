import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sewabazaar.settings")
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.conf import settings


def inspect(email: str):
    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        print(f"No user with email: {email}")
        return

    # Ensure test host is allowed
    if 'testserver' not in settings.ALLOWED_HOSTS:
        settings.ALLOWED_HOSTS.append('testserver')
    if 'localhost' not in settings.ALLOWED_HOSTS:
        settings.ALLOWED_HOSTS.append('localhost')

    client = APIClient()
    client.force_authenticate(user)
    client.defaults['HTTP_HOST'] = 'localhost'

    print(f"Inspecting endpoints as: {user.email}")

    def print_response(title: str, resp):
        print(f"\n[{title}]")
        print(resp.status_code)
        try:
            print(resp.json())
        except Exception:
            content = getattr(resp, 'content', b'')
            try:
                print(content.decode('utf-8')[:500])
            except Exception:
                print(str(content)[:200])

    # 1) Earnings overview (provider_earnings)
    resp = client.get('/api/bookings/provider_earnings/earnings_overview/', {'period': 'month'})
    print_response('provider_earnings/earnings_overview', resp)

    # 2) Earnings analytics (provider_dashboard)
    resp = client.get('/api/bookings/provider_dashboard/earnings_analytics/', {'period': 'month'})
    print_response('provider_dashboard/earnings_analytics', resp)

    # 3) Payout summary
    resp = client.get('/api/bookings/provider_earnings/payout_summary/')
    print_response('provider_earnings/payout_summary', resp)

    # 4) Basic earnings (alias)
    resp = client.get('/api/bookings/provider_dashboard/earnings/')
    print_response('provider_dashboard/earnings', resp)

    # 5) Export earnings CSV
    resp = client.get('/api/bookings/provider_dashboard/export_earnings/', {'format': 'csv', 'period': 'month'})
    print_response('provider_dashboard/export_earnings (csv)', resp)

    # 6) Export earnings via provider_earnings (csv/pdf)
    resp = client.get('/api/bookings/provider_earnings/export/', {'format': 'csv', 'period': 'month'})
    print_response('provider_earnings/export (csv)', resp)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python inspect_provider_endpoints.py <email>")
    else:
        inspect(sys.argv[1])


