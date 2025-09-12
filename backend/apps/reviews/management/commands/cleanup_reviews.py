from django.core.management.base import BaseCommand
from apps.reviews.models import Review
from apps.bookings.models import Booking
from django.db.models import Q
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Clean up old or problematic reviews'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--days-old',
            type=int,
            default=365,
            help='Delete reviews older than this many days (default: 365)',
        )
        parser.add_argument(
            '--orphaned',
            action='store_true',
            help='Delete reviews with no associated booking',
        )
        parser.add_argument(
            '--no-customer',
            action='store_true',
            help='Delete reviews with no associated customer',
        )
        parser.add_argument(
            '--no-provider',
            action='store_true',
            help='Delete reviews with no associated provider',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days_old = options['days_old']
        orphaned = options['orphaned']
        no_customer = options['no_customer']
        no_provider = options['no_provider']
        
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        self.stdout.write(f"Review cleanup parameters:")
        self.stdout.write(f"  Dry run: {dry_run}")
        self.stdout.write(f"  Days old: {days_old} (before {cutoff_date.strftime('%Y-%m-%d')})")
        self.stdout.write(f"  Orphaned reviews: {orphaned}")
        self.stdout.write(f"  No customer: {no_customer}")
        self.stdout.write(f"  No provider: {no_provider}")
        
        # Build query based on options
        reviews_to_delete = Review.objects.all()
        
        # Filter by age
        reviews_to_delete = reviews_to_delete.filter(created_at__lt=cutoff_date)
        
        # Filter by orphaned status
        if orphaned:
            reviews_to_delete = reviews_to_delete.filter(booking__isnull=True)
        
        # Filter by missing customer
        if no_customer:
            reviews_to_delete = reviews_to_delete.filter(customer__isnull=True)
        
        # Filter by missing provider
        if no_provider:
            reviews_to_delete = reviews_to_delete.filter(provider__isnull=True)
        
        count = reviews_to_delete.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS("No reviews match the cleanup criteria.")
            )
            return
        
        self.stdout.write(f"\nFound {count} reviews matching cleanup criteria:")
        
        # Show sample of reviews to be deleted
        sample_reviews = reviews_to_delete[:10]
        for review in sample_reviews:
            customer_email = review.customer.email if review.customer else "No customer"
            provider_email = review.provider.email if review.provider else "No provider"
            booking_id = review.booking.id if review.booking else "No booking"
            self.stdout.write(f"  Review ID {review.id}: {customer_email} -> {provider_email} (Booking #{booking_id}) - {review.created_at.strftime('%Y-%m-%d')}")
        
        if count > 10:
            self.stdout.write(f"  ... and {count - 10} more")
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f"\nDRY RUN: Would delete {count} reviews. Use --no-dry-run to actually delete.")
            )
            return
        
        # Confirm deletion
        self.stdout.write(f"\nAre you sure you want to delete {count} reviews? (y/N)")
        confirm = input()
        
        if confirm.lower() != 'y':
            self.stdout.write("Cancelled. No reviews deleted.")
            return
        
        # Perform deletion
        deleted_count = 0
        for review in reviews_to_delete:
            try:
                review_id = review.id
                review.delete()
                deleted_count += 1
                if deleted_count % 100 == 0:
                    self.stdout.write(f"Deleted {deleted_count} reviews...")
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Failed to delete review ID {review.id}: {e}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"\nSuccessfully deleted {deleted_count} reviews!")
        )