# Generated migration for portfolio restructure

from django.db import migrations, models
import django.db.models.deletion
import apps.accounts.models
from uuid import uuid4
import os


def create_projects_from_media(apps, schema_editor):
    """
    Create portfolio projects from existing portfolio media
    """
    PortfolioMedia = apps.get_model('accounts', 'PortfolioMedia')
    PortfolioProject = apps.get_model('accounts', 'PortfolioProject')
    
    # Group existing media by profile
    media_by_profile = {}
    for media in PortfolioMedia.objects.all():
        profile_id = media.profile_id
        if profile_id not in media_by_profile:
            media_by_profile[profile_id] = []
        media_by_profile[profile_id].append(media)
    
    # Create projects for each profile
    for profile_id, media_items in media_by_profile.items():
        # Create a single project for all existing media of this profile
        project = PortfolioProject.objects.create(
            profile_id=profile_id,
            title=f"Portfolio Project",
            description="Migrated from existing portfolio media",
            order=1
        )
        
        # Update all media items to belong to this project
        for i, media in enumerate(media_items):
            media.project_id = project.id
            media.order = i + 1
            media.caption = media.title or ""
            media.save()


def reverse_projects_to_media(apps, schema_editor):
    """
    Reverse migration - convert projects back to individual media
    """
    PortfolioMedia = apps.get_model('accounts', 'PortfolioMedia')
    PortfolioProject = apps.get_model('accounts', 'PortfolioProject')
    
    # For each media item, set the profile from its project
    for media in PortfolioMedia.objects.all():
        if media.project:
            media.profile_id = media.project.profile_id
            media.title = media.caption or ""
            media.description = ""
            media.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_profilechangehistory'),
    ]

    operations = [
        # First, create the PortfolioProject model
        migrations.CreateModel(
            name='PortfolioProject',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Project title', max_length=200)),
                ('description', models.TextField(blank=True, help_text='Project description', null=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='portfolio_projects', to='accounts.profile')),
            ],
            options={
                'verbose_name': 'Portfolio Project',
                'verbose_name_plural': 'Portfolio Projects',
                'ordering': ['order', '-created_at'],
            },
        ),
        
        # Add the project field to PortfolioMedia (nullable first)
        migrations.AddField(
            model_name='portfoliomedia',
            name='project',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='media_files', to='accounts.portfolioproject'),
        ),
        
        # Add caption field
        migrations.AddField(
            model_name='portfoliomedia',
            name='caption',
            field=models.CharField(blank=True, help_text='Optional caption for this media', max_length=200, null=True),
        ),
        
        # Run the data migration
        migrations.RunPython(create_projects_from_media, reverse_projects_to_media),
        
        # Now make project field non-nullable
        migrations.AlterField(
            model_name='portfoliomedia',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='media_files', to='accounts.portfolioproject'),
        ),
        
        # Remove old fields
        migrations.RemoveField(
            model_name='portfoliomedia',
            name='profile',
        ),
        migrations.RemoveField(
            model_name='portfoliomedia',
            name='title',
        ),
        migrations.RemoveField(
            model_name='portfoliomedia',
            name='description',
        ),
        
        # Update the file field upload path
        migrations.AlterField(
            model_name='portfoliomedia',
            name='file',
            field=models.FileField(upload_to=apps.accounts.models.portfolio_project_media_path),
        ),
        
        # Update order field default and help text
        migrations.AlterField(
            model_name='portfoliomedia',
            name='order',
            field=models.PositiveIntegerField(default=1, help_text='Display order within project'),
        ),
        
        # Update Meta options
        migrations.AlterModelOptions(
            name='portfoliomedia',
            options={'ordering': ['order', 'created_at'], 'verbose_name': 'Portfolio Media', 'verbose_name_plural': 'Portfolio Media'},
        ),
        
        # Update unique_together
        migrations.AlterUniqueTogether(
            name='portfoliomedia',
            unique_together={('project', 'order')},
        ),
    ]