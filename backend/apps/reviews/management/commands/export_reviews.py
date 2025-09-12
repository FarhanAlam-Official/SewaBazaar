import csv
import json
from django.core.management.base import BaseCommand
from apps.reviews.models import Review
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Export reviews data to CSV or JSON format'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            default='csv',
            choices=['csv', 'json'],
            help='Export format (default: csv)',
        )
        parser.add_argument(
            '--output',
            type=str,
            required=True,
            help='Output file path',
        )
        parser.add_argument(
            '--days',
            type=int,
            help='Export reviews from the last N days only',
        )
        parser.add_argument(
            '--min-rating',
            type=int,
            help='Export reviews with rating >= this value',
        )
        parser.add_argument(
            '--max-rating',
            type=int,
            help='Export reviews with rating <= this value',
        )

    def handle(self, *args, **options):
        export_format = options['format']
        output_file = options['output']
        days = options['days']
        min_rating = options['min_rating']
        max_rating = options['max_rating']
        
        self.stdout.write(f"Exporting reviews to {export_format.upper()} format...")
        self.stdout.write(f"Output file: {output_file}")
        
        # Build query
        reviews = Review.objects.all()
        
        # Apply date filter
        if days:
            cutoff_date = datetime.now() - timedelta(days=days)
            reviews = reviews.filter(created_at__gte=cutoff_date)
            self.stdout.write(f"Filtering reviews from last {days} days (after {cutoff_date.strftime('%Y-%m-%d')})")
        
        # Apply rating filters
        if min_rating:
            reviews = reviews.filter(rating__gte=min_rating)
            self.stdout.write(f"Filtering reviews with rating >= {min_rating}")
        
        if max_rating:
            reviews = reviews.filter(rating__lte=max_rating)
            self.stdout.write(f"Filtering reviews with rating <= {max_rating}")
        
        count = reviews.count()
        self.stdout.write(f"Found {count} reviews to export")
        
        if count == 0:
            self.stdout.write(
                self.style.WARNING("No reviews match the export criteria.")
            )
            return
        
        # Export based on format
        if export_format == 'csv':
            self.export_to_csv(reviews, output_file)
        elif export_format == 'json':
            self.export_to_json(reviews, output_file)
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully exported {count} reviews to {output_file}")
        )

    def export_to_csv(self, reviews, output_file):
        """Export reviews to CSV format"""
        fieldnames = [
            'id',
            'customer_email',
            'customer_first_name',
            'customer_last_name',
            'provider_email',
            'provider_first_name',
            'provider_last_name',
            'booking_id',
            'service_title',
            'rating',
            'comment',
            'is_edited',
            'created_at',
            'updated_at'
        ]
        
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for review in reviews:
                writer.writerow({
                    'id': review.id,
                    'customer_email': review.customer.email if review.customer else '',
                    'customer_first_name': review.customer.first_name if review.customer else '',
                    'customer_last_name': review.customer.last_name if review.customer else '',
                    'provider_email': review.provider.email if review.provider else '',
                    'provider_first_name': review.provider.first_name if review.provider else '',
                    'provider_last_name': review.provider.last_name if review.provider else '',
                    'booking_id': review.booking.id if review.booking else '',
                    'service_title': review.service_title,
                    'rating': review.rating,
                    'comment': review.comment,
                    'is_edited': review.is_edited,
                    'created_at': review.created_at.isoformat() if review.created_at else '',
                    'updated_at': review.updated_at.isoformat() if review.updated_at else ''
                })
        
        self.stdout.write(f"CSV export completed with {len(fieldnames)} columns")

    def export_to_json(self, reviews, output_file):
        """Export reviews to JSON format"""
        data = []
        
        for review in reviews:
            data.append({
                'id': review.id,
                'customer': {
                    'email': review.customer.email if review.customer else None,
                    'first_name': review.customer.first_name if review.customer else None,
                    'last_name': review.customer.last_name if review.customer else None,
                },
                'provider': {
                    'email': review.provider.email if review.provider else None,
                    'first_name': review.provider.first_name if review.provider else None,
                    'last_name': review.provider.last_name if review.provider else None,
                },
                'booking_id': review.booking.id if review.booking else None,
                'service_title': review.service_title,
                'rating': review.rating,
                'comment': review.comment,
                'is_edited': review.is_edited,
                'created_at': review.created_at.isoformat() if review.created_at else None,
                'updated_at': review.updated_at.isoformat() if review.updated_at else None
            })
        
        with open(output_file, 'w', encoding='utf-8') as jsonfile:
            json.dump(data, jsonfile, indent=2, ensure_ascii=False)
        
        self.stdout.write(f"JSON export completed with {len(data)} records")