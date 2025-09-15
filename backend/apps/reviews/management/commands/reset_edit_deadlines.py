from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.reviews.models import Review


class Command(BaseCommand):
    help = 'Reset edit deadlines for reviews (set to 24 hours from now)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Reset deadlines for all reviews, not just expired ones',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without actually updating',
        )
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Set deadline to this many hours from now (default: 24)',
        )

    def handle(self, *args, **options):
        reset_all = options['all']
        dry_run = options['dry_run']
        hours = options['hours']
        
        self.stdout.write(f"Resetting review edit deadlines:")
        self.stdout.write(f"  Reset all: {reset_all}")
        self.stdout.write(f"  Dry run: {dry_run}")
        self.stdout.write(f"  Hours: {hours}")
        
        # Determine which reviews to update
        if reset_all:
            reviews_to_update = Review.objects.all()
            self.stdout.write("Updating deadlines for ALL reviews")
        else:
            # Only update reviews with expired deadlines
            expired_deadline = timezone.now()
            reviews_to_update = Review.objects.filter(edit_deadline__lt=expired_deadline)
            self.stdout.write(f"Updating deadlines for reviews with expired deadlines (before {expired_deadline.strftime('%Y-%m-%d %H:%M')})")
        
        count = reviews_to_update.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS("No reviews match the criteria for deadline reset.")
            )
            return
        
        self.stdout.write(f"Found {count} reviews to update")
        
        # Show sample of reviews to be updated
        sample_reviews = reviews_to_update[:5]
        for review in sample_reviews:
            customer_email = review.customer.email if review.customer else "No customer"
            current_deadline = review.edit_deadline.strftime('%Y-%m-%d %H:%M') if review.edit_deadline else "None"
            self.stdout.write(f"  Review ID {review.id}: {customer_email} (Current deadline: {current_deadline})")
        
        if count > 5:
            self.stdout.write(f"  ... and {count - 5} more")
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f"\nDRY RUN: Would update {count} reviews. Use --no-dry-run to actually update.")
            )
            return
        
        # Confirm update
        self.stdout.write(f"\nAre you sure you want to update {count} reviews? (y/N)")
        confirm = input()
        
        if confirm.lower() != 'y':
            self.stdout.write("Cancelled. No reviews updated.")
            return
        
        # Perform update
        new_deadline = timezone.now() + timedelta(hours=hours)
        updated_count = 0
        
        for review in reviews_to_update:
            try:
                review.edit_deadline = new_deadline
                review.save(update_fields=['edit_deadline'])
                updated_count += 1
                if updated_count % 100 == 0:
                    self.stdout.write(f"Updated {updated_count} reviews...")
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Failed to update review ID {review.id}: {e}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"\nSuccessfully updated {updated_count} reviews!")
        )
        self.stdout.write(f"New edit deadline set to: {new_deadline.strftime('%Y-%m-%d %H:%M')}")