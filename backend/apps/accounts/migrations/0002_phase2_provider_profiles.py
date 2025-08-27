# Generated migration for Phase 2 provider profile enhancements

from django.db import migrations, models
import django.db.models.deletion
import apps.accounts.models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        # Add new fields to Profile model for public provider profiles
        migrations.AddField(
            model_name='profile',
            name='display_name',
            field=models.CharField(blank=True, help_text='Public display name for provider profile', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='years_of_experience',
            field=models.PositiveIntegerField(default=0, help_text='Years of professional experience'),
        ),
        migrations.AddField(
            model_name='profile',
            name='certifications',
            field=models.JSONField(blank=True, default=list, help_text='List of certifications and qualifications'),
        ),
        migrations.AddField(
            model_name='profile',
            name='location_city',
            field=models.CharField(blank=True, help_text='Primary service location city', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='avg_rating',
            field=models.DecimalField(decimal_places=2, default=0.0, help_text='Cached average rating from reviews', max_digits=3),
        ),
        migrations.AddField(
            model_name='profile',
            name='reviews_count',
            field=models.PositiveIntegerField(default=0, help_text='Cached count of reviews'),
        ),
        
        # Create PortfolioMedia model
        migrations.CreateModel(
            name='PortfolioMedia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('media_type', models.CharField(choices=[('image', 'Image'), ('video', 'Video')], default='image', max_length=10)),
                ('file', models.FileField(upload_to=apps.accounts.models.portfolio_media_path)),
                ('title', models.CharField(blank=True, max_length=200, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='portfolio_media', to='accounts.profile')),
            ],
            options={
                'verbose_name': 'Portfolio Media',
                'verbose_name_plural': 'Portfolio Media',
                'ordering': ['order', '-created_at'],
            },
        ),
    ]