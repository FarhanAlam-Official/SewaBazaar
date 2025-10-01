import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sewabazaar.settings")
django.setup()

from django.utils import timezone
from django.db.models import Sum, Count

from apps.bookings.models import Booking
from apps.accounts.models import User


def inspect(provider_email: str | None = None):
    if provider_email:
        try:
            provider = User.objects.get(email=provider_email)
        except User.DoesNotExist:
            print(f"No provider found with email: {provider_email}")
            return
    else:
        provider = User.objects.filter(role='provider').first()
        if not provider:
            print("No provider users found.")
            return

    print(f"Inspecting provider: {provider.get_full_name()} (id={provider.id}, email={provider.email})")

    qs = Booking.objects.filter(service__provider=provider)
    total = qs.count()
    by_status = qs.values('status').annotate(c=Count('id')).order_by('-c')

    completed_paid = qs.filter(status='completed', payment__status='completed')
    total_earnings = completed_paid.aggregate(total=Sum('total_amount'))['total'] or 0

    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_earnings = completed_paid.filter(created_at__gte=month_start).aggregate(total=Sum('total_amount'))['total'] or 0

    pending_qs = qs.filter(status__in=['service_delivered', 'awaiting_confirmation'])
    pending_amount = pending_qs.aggregate(total=Sum('total_amount'))['total'] or 0

    print("Bookings summary:")
    print(f"  Total bookings: {total}")
    for row in by_status:
        print(f"  {row['status']}: {row['c']}")

    print("\nEarnings:")
    print(f"  Total earnings (completed & paid): {total_earnings}")
    print(f"  This month earnings: {this_month_earnings}")
    print(f"  Pending earnings (awaiting payout statuses): {pending_amount}")

    print("\nRecent completed bookings (5):")
    for b in completed_paid.order_by('-updated_at')[:5]:
        print(f"  #{b.id} {b.service.title} amount={b.total_amount} updated_at={b.updated_at}")


if __name__ == "__main__":
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else None
    inspect(email)


