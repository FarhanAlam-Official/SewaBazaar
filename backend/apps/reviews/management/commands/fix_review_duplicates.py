from django.core.management.base import BaseCommand
from apps.reviews.models import Review
from collections import Counter


class Command(BaseCommand):
    help = 'Check for duplicate booking_ids in reviews and fix them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Actually fix the duplicates by removing older reviews',
        )

    def handle(self, *args, **options):
        self.stdout.write("Checking for duplicate booking_ids in reviews...")
        
        # Get all reviews with their booking_ids
        reviews = Review.objects.all()
        booking_counts = Counter(review.booking_id for review in reviews if review.booking_id)
        
        # Find duplicates
        duplicates = {booking_id: count for booking_id, count in booking_counts.items() if count > 1}
        
        if not duplicates:
            self.stdout.write(
                self.style.SUCCESS("No duplicate booking_ids found! Migration should work.")
            )
            return
        
        self.stdout.write(
            self.style.WARNING(f"Found {len(duplicates)} booking_ids with duplicates:")
        )
        
        total_duplicates_to_remove = 0
        for booking_id, count in duplicates.items():
            self.stdout.write(f"  Booking ID {booking_id}: {count} reviews")
            total_duplicates_to_remove += count - 1  # Keep one, remove the rest
        
        self.stdout.write(f"\nTotal duplicate reviews to remove: {total_duplicates_to_remove}")
        
        if options['fix']:
            self.stdout.write("\nFixing duplicates by keeping the most recent review for each booking...")
            
            removed_count = 0
            for booking_id in duplicates.keys():
                # Get all reviews for this booking, ordered by creation date (newest first)
                duplicate_reviews = Review.objects.filter(booking_id=booking_id).order_by('-created_at')
                
                # Keep the first (newest) and delete the rest
                reviews_to_delete = duplicate_reviews[1:]  # Skip the first one
                
                for review in reviews_to_delete:
                    self.stdout.write(f"  Removing review ID {review.id} (created {review.created_at})")
                    review.delete()
                    removed_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f"\nSuccessfully removed {removed_count} duplicate reviews!")
            )
            self.stdout.write("You can now run the migration: python manage.py migrate")
            
        else:
            self.stdout.write(
                self.style.WARNING("\nTo fix these duplicates, run: python manage.py fix_review_duplicates --fix")
            )