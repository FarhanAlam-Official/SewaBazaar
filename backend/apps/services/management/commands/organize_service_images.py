import os
from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from apps.services.models import Service, ServiceImage


class Command(BaseCommand):
    help = 'Organize service images into proper directory structure and set featured images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--set-featured',
            action='store_true',
            help='Set the first image as featured for services without a featured image',
        )
        parser.add_argument(
            '--service-id',
            type=int,
            help='Organize images for a specific service ID only',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually moving files',
        )

    def handle(self, *args, **options):
        # Get services to process
        if options['service_id']:
            services = Service.objects.filter(id=options['service_id'])
        else:
            services = Service.objects.all()

        total_services = services.count()
        self.stdout.write(f"Processing {total_services} services...")
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING("DRY RUN - No files will be moved"))

        processed_count = 0
        error_count = 0

        for service in services:
            self.stdout.write(f"Processing service: {service.title} (ID: {service.id})")
            
            # Process all images for this service
            images = service.images.all()
            image_count = images.count()
            
            if image_count == 0:
                self.stdout.write(
                    self.style.WARNING(f"  No images found for service {service.title}")
                )
                continue
            
            # Set featured image if requested and none exists
            if options['set_featured']:
                featured_image = service.images.filter(is_featured=True).first()
                if not featured_image:
                    # Set the first image as featured
                    first_image = service.images.first()
                    if first_image:
                        if not options['dry_run']:
                            first_image.is_featured = True
                            first_image.save()
                        self.stdout.write(
                            self.style.SUCCESS(f"  Set first image as featured for service {service.title}")
                        )
            
            # Re-save all images to trigger the new upload_to function
            for image in images:
                try:
                    # Get current path
                    old_path = image.image.name
                    
                    # Generate new path using our custom function
                    from apps.services.models import service_image_upload_path
                    filename = os.path.basename(old_path)
                    new_path = service_image_upload_path(image, filename)
                    
                    # Move file if paths are different
                    if old_path != new_path:
                        if options['dry_run']:
                            self.stdout.write(
                                self.style.WARNING(f"    Would move: {old_path} -> {new_path}")
                            )
                        else:
                            # Check if file exists at old path
                            if default_storage.exists(old_path):
                                # Read the file content
                                file_content = default_storage.open(old_path).read()
                                
                                # Save to new location
                                default_storage.save(new_path, file_content)
                                
                                # Update the model field
                                image.image.name = new_path
                                
                                # Delete the old file
                                default_storage.delete(old_path)
                                
                                # Save the model
                                image.save()
                                
                                self.stdout.write(
                                    self.style.SUCCESS(f"    Moved image: {old_path} -> {new_path}")
                                )
                            else:
                                self.stdout.write(
                                    self.style.WARNING(f"    File not found: {old_path}")
                                )
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(f"    Image already in correct location: {old_path}")
                        )
                        
                    processed_count += 1
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f"    Error processing image {image.id}: {str(e)}")
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f"  Processed {image_count} images for service {service.title}")
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully processed {processed_count} images with {error_count} errors"
            )
        )
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING("DRY RUN COMPLETE - No files were actually moved")
            )