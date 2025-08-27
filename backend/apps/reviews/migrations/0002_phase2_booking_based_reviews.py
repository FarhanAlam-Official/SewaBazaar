# Generated migration for Phase 2 booking-based reviews

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('reviews', '0001_initial'),
        ('bookings', '0002_phase1_booking_enhancements'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Remove old unique constraint
        migrations.AlterUniqueTogether(
            name='review',
            unique_together=set(),
        ),
        
        # Add new fields to Review model
        migrations.AddField(
            model_name='review',
            name='provider',
            field=models.ForeignKey(
                help_text='Provider being reviewed',
                limit_choices_to={'role': 'provider'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='provider_reviews',
                to=settings.AUTH_USER_MODEL,
                null=True  # Temporary nullable for migration
            ),
        ),
        migrations.AddField(
            model_name='review',
            name='booking',
            field=models.OneToOneField(
                help_text='The completed booking this review is for',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='review',
                to='bookings.booking',
                null=True  # Temporary nullable for migration
            ),
        ),
        migrations.AddField(
            model_name='review',
            name='is_edited',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='review',
            name='edit_deadline',
            field=models.DateTimeField(blank=True, help_text='Deadline for editing this review', null=True),
        ),
        
        # Update comment field with max length
        migrations.AlterField(
            model_name='review',
            name='comment',
            field=models.TextField(help_text='Review comment (max 1000 characters)', max_length=1000),
        ),
        
        # Update rating field with help text
        migrations.AlterField(
            model_name='review',
            name='rating',
            field=models.PositiveSmallIntegerField(
                help_text='Rating from 1 to 5 stars',
                validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)]
            ),
        ),
        
        # Update customer field with limit choices
        migrations.AlterField(
            model_name='review',
            name='customer',
            field=models.ForeignKey(
                limit_choices_to={'role': 'customer'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='customer_reviews',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        
        # Add indexes for performance
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['provider', '-created_at'], name='reviews_review_provider_created_idx'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['rating'], name='reviews_review_rating_idx'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['created_at'], name='reviews_review_created_at_idx'),
        ),
        
        # Add constraints for booking-based reviews
        migrations.AddConstraint(
            model_name='review',
            constraint=models.UniqueConstraint(fields=('booking',), name='unique_review_per_booking'),
        ),
        migrations.AddConstraint(
            model_name='review',
            constraint=models.UniqueConstraint(fields=('customer', 'booking'), name='unique_customer_booking_review'),
        ),
    ]