from django.core.management.base import BaseCommand
from django.db.models import Avg, Count, Min, Max
from apps.reviews.models import Review
from apps.bookings.models import Booking
from apps.accounts.models import User
from datetime import datetime, timedelta
import json


class Command(BaseCommand):
    help = 'Generate a comprehensive report of reviews statistics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to look back for statistics (default: 30)',
        )
        parser.add_argument(
            '--output',
            type=str,
            help='Output file path for JSON report (optional)',
        )

    def handle(self, *args, **options):
        days = options['days']
        cutoff_date = datetime.now().date() - timedelta(days=days)
        
        self.stdout.write(f"Generating reviews report for the last {days} days...")
        self.stdout.write(f"Period: {cutoff_date} to {datetime.now().date()}")
        
        # Overall statistics
        total_reviews = Review.objects.count()
        recent_reviews = Review.objects.filter(created_at__date__gte=cutoff_date)
        recent_count = recent_reviews.count()
        
        self.stdout.write("\n=== OVERALL STATISTICS ===")
        self.stdout.write(f"Total reviews: {total_reviews}")
        self.stdout.write(f"Reviews in last {days} days: {recent_count}")
        
        # Rating distribution
        rating_distribution = Review.objects.values('rating').annotate(
            count=Count('rating')
        ).order_by('-rating')
        
        self.stdout.write("\n=== RATING DISTRIBUTION ===")
        for item in rating_distribution:
            percentage = (item['count'] / total_reviews * 100) if total_reviews > 0 else 0
            self.stdout.write(f"  {item['rating']} stars: {item['count']} ({percentage:.1f}%)")
        
        # Initialize variables for recent statistics
        avg_rating = 0
        recent_rating_dist = []
        
        # Recent statistics
        if recent_count > 0:
            avg_rating = recent_reviews.aggregate(Avg('rating'))['rating__avg']
            self.stdout.write(f"\n=== RECENT ({days} DAYS) STATISTICS ===")
            self.stdout.write(f"Average rating: {avg_rating:.2f}")
            
            # Recent rating distribution
            recent_rating_dist = recent_reviews.values('rating').annotate(
                count=Count('rating')
            ).order_by('-rating')
            
            self.stdout.write("Rating distribution:")
            for item in recent_rating_dist:
                percentage = (item['count'] / recent_count * 100) if recent_count > 0 else 0
                self.stdout.write(f"  {item['rating']} stars: {item['count']} ({percentage:.1f}%)")
        else:
            self.stdout.write(f"\n=== RECENT ({days} DAYS) STATISTICS ===")
            self.stdout.write("No recent reviews found")
        
        # Provider statistics
        provider_stats = Review.objects.values(
            'provider__id', 
            'provider__email',
            'provider__first_name',
            'provider__last_name'
        ).annotate(
            review_count=Count('id'),
            avg_rating=Avg('rating'),
            min_rating=Min('rating'),
            max_rating=Max('rating')
        ).order_by('-review_count')
        
        self.stdout.write("\n=== TOP PROVIDERS BY REVIEW COUNT ===")
        for i, provider in enumerate(provider_stats[:10], 1):
            name = f"{provider['provider__first_name']} {provider['provider__last_name']}".strip() or provider['provider__email']
            self.stdout.write(f"  {i}. {name} - {provider['review_count']} reviews (avg: {provider['avg_rating']:.2f})")
        
        # Customer statistics
        customer_stats = Review.objects.values(
            'customer__id',
            'customer__email',
            'customer__first_name',
            'customer__last_name'
        ).annotate(
            review_count=Count('id'),
            avg_rating=Avg('rating')
        ).order_by('-review_count')
        
        self.stdout.write("\n=== TOP CUSTOMERS BY REVIEW COUNT ===")
        for i, customer in enumerate(customer_stats[:10], 1):
            name = f"{customer['customer__first_name']} {customer['customer__last_name']}".strip() or customer['customer__email']
            self.stdout.write(f"  {i}. {name} - {customer['review_count']} reviews (avg: {customer['avg_rating']:.2f})")
        
        # Prepare data for JSON output
        report_data = {
            'generated_at': datetime.now().isoformat(),
            'period_days': days,
            'period_start': cutoff_date.isoformat(),
            'period_end': datetime.now().date().isoformat(),
            'overall': {
                'total_reviews': total_reviews,
                'rating_distribution': list(rating_distribution)
            },
            'recent': {
                'review_count': recent_count,
                'average_rating': float(avg_rating) if recent_count > 0 else 0,
                'rating_distribution': list(recent_rating_dist) if recent_count > 0 else []
            },
            'top_providers': list(provider_stats[:20]),
            'top_customers': list(customer_stats[:20])
        }
        
        # Output to file if specified
        if options['output']:
            try:
                with open(options['output'], 'w') as f:
                    json.dump(report_data, f, indent=2, default=str)
                self.stdout.write(
                    self.style.SUCCESS(f"\nReport saved to {options['output']}")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"\nFailed to save report to {options['output']}: {e}")
                )
        else:
            self.stdout.write(
                self.style.SUCCESS("\nReport generation completed!")
            )