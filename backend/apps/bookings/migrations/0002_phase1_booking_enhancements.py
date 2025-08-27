# Generated migration for Phase 1 booking enhancements

from django.db import migrations, models
import django.db.models.deletion
import uuid
from datetime import timedelta


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0001_initial'),
        ('services', '0001_initial'),
    ]

    operations = [
        # Create PaymentMethod model
        migrations.CreateModel(
            name='PaymentMethod',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('payment_type', models.CharField(choices=[('digital_wallet', 'Digital Wallet'), ('bank_transfer', 'Bank Transfer'), ('cash', 'Cash on Service')], max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('processing_fee_percentage', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('icon', models.CharField(blank=True, max_length=100, null=True)),
                ('gateway_config', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Payment Method',
                'verbose_name_plural': 'Payment Methods',
                'ordering': ['payment_type', 'name'],
            },
        ),
        
        # Create BookingSlot model
        migrations.CreateModel(
            name='BookingSlot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('is_available', models.BooleanField(default=True)),
                ('max_bookings', models.PositiveIntegerField(default=1)),
                ('current_bookings', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('service', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='booking_slots', to='services.service')),
            ],
            options={
                'verbose_name': 'Booking Slot',
                'verbose_name_plural': 'Booking Slots',
                'ordering': ['date', 'start_time'],
            },
        ),
        
        # Add unique constraint for BookingSlot
        migrations.AddConstraint(
            model_name='bookingslot',
            constraint=models.UniqueConstraint(fields=('service', 'date', 'start_time', 'end_time'), name='unique_booking_slot'),
        ),
        
        # Add new fields to existing Booking model
        migrations.AddField(
            model_name='booking',
            name='booking_step',
            field=models.CharField(
                choices=[
                    ('service_selection', 'Service Selection'),
                    ('datetime_selection', 'Date & Time Selection'),
                    ('details_input', 'Details Input'),
                    ('payment', 'Payment'),
                    ('confirmation', 'Confirmation'),
                    ('completed', 'Completed')
                ],
                default='completed',
                help_text='Current step in the booking process',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='special_instructions',
            field=models.TextField(blank=True, help_text='Additional instructions from customer', null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='estimated_duration',
            field=models.DurationField(blank=True, default=timedelta(hours=1), help_text='Estimated service duration', null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='preferred_provider_gender',
            field=models.CharField(
                choices=[('any', 'Any'), ('male', 'Male'), ('female', 'Female')],
                default='any',
                help_text="Customer's preference for provider gender",
                max_length=10
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='is_recurring',
            field=models.BooleanField(default=False, help_text='Whether this is a recurring booking'),
        ),
        migrations.AddField(
            model_name='booking',
            name='recurring_frequency',
            field=models.CharField(
                blank=True,
                choices=[('weekly', 'Weekly'), ('biweekly', 'Bi-weekly'), ('monthly', 'Monthly')],
                help_text='Frequency for recurring bookings',
                max_length=20,
                null=True
            ),
        ),
        
        # Add booking_slot foreign key to Booking model
        migrations.AddField(
            model_name='booking',
            name='booking_slot',
            field=models.ForeignKey(
                blank=True,
                help_text='Associated booking slot for time management',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='bookings',
                to='bookings.bookingslot'
            ),
        ),
        
        # Create Payment model
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('payment_id', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('processing_fee', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('khalti_token', models.CharField(blank=True, max_length=200, null=True)),
                ('khalti_transaction_id', models.CharField(blank=True, max_length=100, null=True)),
                ('khalti_response', models.JSONField(blank=True, default=dict)),
                ('transaction_id', models.CharField(max_length=100, unique=True)),
                ('gateway_response', models.JSONField(blank=True, default=dict)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('processing', 'Processing'),
                        ('completed', 'Completed'),
                        ('failed', 'Failed'),
                        ('refunded', 'Refunded'),
                        ('partially_refunded', 'Partially Refunded')
                    ],
                    default='pending',
                    max_length=20
                )),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('booking', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='payment', to='bookings.booking')),
                ('payment_method', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='bookings.paymentmethod')),
            ],
            options={
                'verbose_name': 'Payment',
                'verbose_name_plural': 'Payments',
                'ordering': ['-created_at'],
            },
        ),
    ]