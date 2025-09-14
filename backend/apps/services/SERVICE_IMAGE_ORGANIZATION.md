# Service Image Organization System

## Overview

This document describes the new service image organization system that improves how service images are stored and managed in the SewaBazaar platform.

## Problem

Previously, all service images were stored in a flat directory structure (`service_images/`) without any organization by service. This caused several issues:

- Poor image organization
- Difficulty identifying which images belong to which service
- Missing main images for most services
- No gallery images properly linked

## Solution

The new system organizes images by service ID with separate directories for main and gallery images:

```bash
service_images/
├── {service_id}/
│   ├── main/
│   │   └── {unique_filename}.{ext}
│   └── gallery/
│       └── {unique_filename}.{ext}
```

## Implementation Details

### 1. Custom Upload Function

A new `service_image_upload_path` function generates paths based on service ID:

- Main/featured images: `service_images/{service_id}/main/{unique_filename}.{ext}`
- Gallery images: `service_images/{service_id}/gallery/{unique_filename}.{ext}`

### 2. ServiceImage Model

The [ServiceImage](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/services/models.py#L148-L174) model now uses the custom upload function and properly utilizes the `is_featured` field to distinguish main images.

### 3. Service Model Enhancements

The [Service](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/services/models.py#L36-L117) model includes new properties:

- `main_image`: Returns the featured image for the service
- `gallery_images_ordered`: Returns all gallery images in proper order

### 4. Serializer Updates

The [ServiceSerializer](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/services/serializers.py#L35-L112) has been updated to provide backward compatibility:

- The `image` field now returns the URL of the main featured image from the new system
- Falls back to the old `image` field if no featured image is available
- This ensures frontend compatibility is maintained

### 5. Migrations

Two migrations were created:

1. `0004_service_image_organization.py` - Updates the upload_to field
2. `0005_organize_existing_service_images.py` - Organizes existing images

### 6. Management Command

A management command `organize_service_images` helps with:

- Organizing existing images into the new structure
- Setting featured images for services that don't have one
- Dry-run option to preview changes without making them

## Usage

### Running the Management Command

```bash
# Organize all service images
python manage.py organize_service_images

# Organize images and set featured images for services without one
python manage.py organize_service_images --set-featured

# Organize images for a specific service only
python manage.py organize_service_images --service-id 123

# Preview changes without actually moving files
python manage.py organize_service_images --dry-run

# Combine options
python manage.py organize_service_images --set-featured --dry-run
```

## Benefits

1. **Better Organization**: Images are now organized by service ID
2. **Easy Management**: Easy to identify which images belong to which service
3. **Clear Separation**: Main images are separated from gallery images
4. **Improved Performance**: Better file system organization
5. **Maintainable**: Easier to manage and maintain image files
6. **Backward Compatible**: Frontend continues to work without changes

## Frontend Integration

The frontend can continue to use the existing `service.image` field, which now automatically provides:

- Main image: `service.image` (returns URL of featured image from new system)
- Gallery images: `service.images` (returns all images from new system)

## Testing

Unit tests have been added to verify the functionality:

- Test image upload paths
- Test main_image property
- Test gallery_images_ordered property

## Future Improvements

1. Add image optimization and compression
2. Implement CDN delivery for improved performance
3. Add support for different image formats (WebP, AVIF)
4. Implement automatic thumbnail generation
