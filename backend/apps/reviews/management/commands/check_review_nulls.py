from django.core.management.base import BaseCommand
from apps.reviews.models import Review
from apps.bookings.models import Booking


class Command(BaseCommand):
    help = 'Check and fix null booking references in reviews'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Actually fix the null booking references',
        )

    def handle(self, *args, **options):
        self.stdout.write("Checking for reviews with null booking references...")
        
        # Check for null booking fields
        null_booking_reviews = Review.objects.filter(booking__isnull=True)
        null_provider_reviews = Review.objects.filter(provider__isnull=True)
        
        self.stdout.write(f"Reviews with null booking: {null_booking_reviews.count()}")
        self.stdout.write(f"Reviews with null provider: {null_provider_reviews.count()}")
        
        if null_booking_reviews.exists():
            self.stdout.write("\nReviews with null booking:")
            for review in null_booking_reviews:
                self.stdout.write(f"  Review ID {review.id}: customer={review.customer.email}, service={getattr(review, 'service', 'None')}")
        
        if null_provider_reviews.exists():
            self.stdout.write("\nReviews with null provider:")
            for review in null_provider_reviews:
                self.stdout.write(f"  Review ID {review.id}: customer={review.customer.email}")
        
        if options['fix']:
            if null_booking_reviews.exists() or null_provider_reviews.exists():
                self.stdout.write(
                    self.style.WARNING("Found reviews with null references. These need to be fixed manually or deleted.")
                )
                self.stdout.write("Do you want to delete these problematic reviews? (y/N)")
                confirm = input()
                
                if confirm.lower() == 'y':
                    deleted_count = 0
                    for review in null_booking_reviews:
                        self.stdout.write(f"Deleting review ID {review.id}")
                        review.delete()
                        deleted_count += 1
                    
                    for review in null_provider_reviews:
                        self.stdout.write(f"Deleting review ID {review.id}")
                        review.delete()
                        deleted_count += 1
                    
                    self.stdout.write(
                        self.style.SUCCESS(f"Deleted {deleted_count} problematic reviews")
                    )
                else:
                    self.stdout.write("Cancelled. No reviews deleted.")
            else:
                self.stdout.write(
                    self.style.SUCCESS("No problematic reviews found!")
                )