from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
import os
from uuid import uuid4

def profile_picture_path(instance, filename):
    # Get the file extension
    ext = filename.split('.')[-1]
    # Generate a unique filename with UUID
    filename = f"{uuid4().hex}.{ext}"
    # Return the upload path
    return os.path.join('profile_pictures', str(instance.id), filename)

def document_upload_path(instance, filename):
    """
    Generate path for provider document uploads
    Path format: documents/{user_id}/{document_type}/{filename}
    """
    ext = filename.split('.')[-1]
    filename = f"{instance.document_type}_{uuid4().hex}.{ext}"
    return os.path.join('documents', str(instance.provider.user.id), instance.document_type, filename)

class User(AbstractUser):
    """
    Custom User model with additional fields for SewaBazaar
    """
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('provider', 'Service Provider'),
        ('admin', 'Admin'),
    )
    
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(
        upload_to=profile_picture_path,
        blank=True,
        null=True,
        help_text=_('Profile picture for the user')
    )
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_method = models.CharField(max_length=10, blank=True, null=True, help_text="totp or sms")
    
    # Make email the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    def __str__(self):
        return self.email
        
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        # If this is a new user (no ID yet), save first to get the ID
        if not self.id:
            super().save(*args, **kwargs)
        
        # If there's a new profile picture and this is an existing user
        if self.id and self.profile_picture:
            # Check if there was an old picture
            try:
                old_instance = User.objects.get(id=self.id)
                if old_instance.profile_picture and old_instance.profile_picture != self.profile_picture:
                    # Delete the old picture file
                    old_instance.profile_picture.delete(save=False)
            except User.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

def portfolio_media_path(instance, filename):
    """
    Generate path for portfolio media files with descriptive naming and project organization
    
    Path format: 
    - Images: portfolio/{user_id}/projects/{project_id}/images/portfolio_{user_id}_{project_id}_{uuid}.{ext}
    - Videos: portfolio/{user_id}/projects/{project_id}/videos/portfolio_{user_id}_{project_id}_{uuid}.{ext}
    
    If project_id is not available (during creation), use a temporary path that will be moved later
    """
    try:
        # Get file extension
        ext = filename.split('.')[-1].lower()
        
        # Get user ID from the profile relationship
        user_id = str(instance.profile.user.id)
        
        # Get project ID if available (for existing instances)
        project_id = str(instance.id) if instance.id else 'temp'
        
        # Generate unique filename with descriptive naming
        unique_id = uuid4().hex[:8]  # Use shorter UUID for readability
        
        if project_id != 'temp':
            descriptive_filename = f"portfolio_{user_id}_{project_id}_{unique_id}.{ext}"
        else:
            # For new uploads, use timestamp-based naming that will be renamed later
            import time
            timestamp = str(int(time.time()))
            descriptive_filename = f"portfolio_{user_id}_temp_{timestamp}_{unique_id}.{ext}"
        
        # Determine subfolder based on media type
        if hasattr(instance, 'media_type') and instance.media_type:
            if instance.media_type == 'video':
                subfolder = 'videos'
            else:
                subfolder = 'images'
        else:
            # Default to images if media_type is not set yet
            subfolder = 'images'
        
        # Build the full path with project organization
        if project_id != 'temp':
            return os.path.join('portfolio', user_id, 'projects', project_id, subfolder, descriptive_filename)
        else:
            # Temporary path for new uploads
            return os.path.join('portfolio', user_id, 'temp', subfolder, descriptive_filename)
    
    except Exception as e:
        # Fallback path if there are any issues
        import logging
        logging.getLogger('django').error(f'Error generating portfolio media path: {e}')
        
        # Generate a basic fallback path
        ext = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
        unique_id = uuid4().hex[:8]
        fallback_filename = f"portfolio_unknown_{unique_id}.{ext}"
        
        return os.path.join('portfolio', 'temp', 'fallback', fallback_filename)


class Profile(models.Model):
    """
    Extended profile information for users
    
    PHASE 2 ENHANCED: Added public provider profile fields
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    # Provider-specific fields (existing)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    service_areas = models.ManyToManyField('services.City', blank=True, related_name='providers')
    is_approved = models.BooleanField(default=False)
    
    # PHASE 2 NEW: Public provider profile fields
    display_name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Public display name for provider profile"
    )
    years_of_experience = models.PositiveIntegerField(
        default=0,
        help_text="Years of professional experience"
    )
    certifications = models.JSONField(
        default=list,
        blank=True,
        help_text="List of certifications and qualifications"
    )
    location_city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Primary service location city"
    )
    
    # PHASE 2 NEW: Cached rating fields for performance
    avg_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        help_text="Cached average rating from reviews"
    )
    reviews_count = models.PositiveIntegerField(
        default=0,
        help_text="Cached count of reviews"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.email}"
    
    @property
    def public_display_name(self):
        """Get the best available display name for public profile"""
        if self.display_name:
            return self.display_name
        elif self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}"
        else:
            return self.user.email.split('@')[0]
    
    @property
    def is_provider(self):
        """Check if this profile belongs to a provider"""
        return self.user.role == 'provider'


class UserPreference(models.Model):
    """Stores per-user app preferences like theme/language/timezone"""
    THEME_CHOICES = (
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='system')
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=64, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.email}"

class PortfolioProject(models.Model):
    """
    Portfolio Project model - represents a single project with multiple media files
    """
    profile = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE, 
        related_name='portfolio_projects'
    )
    title = models.CharField(max_length=200, help_text="Project title")
    description = models.TextField(blank=True, null=True, help_text="Project description")
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Portfolio Project'
        verbose_name_plural = 'Portfolio Projects'
    
    def __str__(self):
        return f"{self.title} - {self.profile.user.email}"
    
    @property
    def primary_image(self):
        """Get the primary image: prefer featured, else order=1"""
        featured = self.media_files.filter(media_type='image', is_featured=True).first()
        if featured:
            return featured
        return self.media_files.filter(media_type='image', order=1).first()
    
    @property
    def media_count(self):
        """Get total count of media files in this project"""
        return self.media_files.count()
    
    @property
    def images_count(self):
        """Get count of images in this project"""
        return self.media_files.filter(media_type='image').count()
    
    @property
    def videos_count(self):
        """Get count of videos in this project"""
        return self.media_files.filter(media_type='video').count()


def portfolio_project_media_path(instance, filename):
    """
    Generate path for portfolio project media files
    
    Path format: portfolio/{user_id}/projects/{project_id}/{media_type}/filename
    """
    try:
        # Get file extension
        ext = filename.split('.')[-1].lower()
        
        # Get user ID from the project's profile relationship
        user_id = str(instance.project.profile.user.id)
        
        # Get project ID
        project_id = str(instance.project.id)
        
        # Generate unique filename
        unique_id = uuid4().hex[:8]
        descriptive_filename = f"portfolio_{user_id}_{project_id}_{unique_id}.{ext}"
        
        # Determine subfolder based on media type
        subfolder = 'videos' if instance.media_type == 'video' else 'images'
        
        # Build the full path
        return os.path.join('portfolio', user_id, 'projects', project_id, subfolder, descriptive_filename)
    
    except Exception as e:
        # Fallback path if there are any issues
        import logging
        logging.getLogger('django').error(f'Error generating portfolio project media path: {e}')
        
        # Generate a basic fallback path
        ext = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
        unique_id = uuid4().hex[:8]
        fallback_filename = f"portfolio_project_{unique_id}.{ext}"
        
        return os.path.join('portfolio', 'temp', 'fallback', fallback_filename)


class PortfolioMedia(models.Model):
    """
    Portfolio Media model - individual media files within a project
    """
    MEDIA_TYPE_CHOICES = (
        ('image', 'Image'),
        ('video', 'Video'),
    )
    
    project = models.ForeignKey(
        PortfolioProject,
        on_delete=models.CASCADE,
        related_name='media_files'
    )
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='image')
    file = models.FileField(upload_to=portfolio_project_media_path)
    order = models.PositiveIntegerField(default=1, help_text="Display order within project")
    caption = models.CharField(max_length=200, blank=True, null=True, help_text="Optional caption for this media")
    is_featured = models.BooleanField(default=False, help_text="Featured image for project cover")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        unique_together = ['project', 'order']  # Ensure unique order within project
        verbose_name = 'Portfolio Media'
        verbose_name_plural = 'Portfolio Media'
    
    def __str__(self):
        return f"{self.media_type} #{self.order} for {self.project.title}"
    
    def save(self, *args, **kwargs):
        """
        Custom save method to handle file organization by project ID
        """
        is_new = self.pk is None
        old_file_path = None
        
        # If this is an update and file has changed, store old path for cleanup
        if not is_new and self.file:
            try:
                old_instance = PortfolioMedia.objects.get(pk=self.pk)
                if old_instance.file != self.file:
                    old_file_path = old_instance.file.path
            except PortfolioMedia.DoesNotExist:
                pass
        
        # Save the instance first
        super().save(*args, **kwargs)
        
        # If this was a new instance and file was uploaded to temp location, move it to proper location
        if is_new and self.file and 'temp' in self.file.name:
            self._move_file_to_project_location()
        
        # Clean up old file if it was replaced
        if old_file_path and os.path.exists(old_file_path):
            try:
                os.remove(old_file_path)
            except OSError:
                pass
    
    def _move_file_to_project_location(self):
        """
        Move file from temporary location to project-specific location
        """
        try:
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            
            # Get current file path
            current_path = self.file.name
            
            # Skip if not in temp location
            if 'temp' not in current_path:
                return
            
            # Generate new path with project ID
            filename = os.path.basename(current_path)
            ext = filename.split('.')[-1].lower()
            user_id = str(self.profile.user.id)
            project_id = str(self.id)
            unique_id = uuid4().hex[:8]
            
            # Create new filename with project ID
            new_filename = f"portfolio_{user_id}_{project_id}_{unique_id}.{ext}"
            
            # Determine subfolder
            subfolder = 'videos' if self.media_type == 'video' else 'images'
            
            # Create new path
            new_path = os.path.join('portfolio', user_id, 'projects', project_id, subfolder, new_filename)
            
            # Move the file
            if default_storage.exists(current_path):
                # Read the file content
                with default_storage.open(current_path, 'rb') as f:
                    file_content = f.read()
                
                # Save to new location
                default_storage.save(new_path, ContentFile(file_content))
                
                # Update the file field
                self.file.name = new_path
                
                # Save without triggering this method again
                super().save(update_fields=['file'])
                
                # Delete old file
                try:
                    default_storage.delete(current_path)
                except:
                    pass  # Ignore if file doesn't exist
                
        except Exception as e:
            import logging
            logging.getLogger('django').error(f'Error moving portfolio file to project location: {e}')


class FamilyMember(models.Model):
    """
    Family Member model for managing family member profiles and permissions
    
    Purpose: Allow customers to manage family member access and permissions
    Impact: New model - adds family management functionality to customer dashboard
    """
    RELATIONSHIP_CHOICES = (
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('sibling', 'Sibling'),
        ('other', 'Other'),
    )
    
    primary_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='family_members',
        help_text="The primary account holder"
    )
    name = models.CharField(max_length=100, help_text="Family member's full name")
    email = models.EmailField(blank=True, null=True, help_text="Optional email for notifications")
    relationship = models.CharField(
        max_length=20, 
        choices=RELATIONSHIP_CHOICES,
        help_text="Relationship to primary account holder"
    )
    
    # Permissions
    can_book_services = models.BooleanField(
        default=True,
        help_text="Can book services on behalf of primary account"
    )
    can_use_wallet = models.BooleanField(
        default=False,
        help_text="Can use primary account's wallet/payment methods"
    )
    can_view_history = models.BooleanField(
        default=True,
        help_text="Can view booking history"
    )
    can_manage_bookings = models.BooleanField(
        default=False,
        help_text="Can cancel/reschedule bookings"
    )
    
    is_active = models.BooleanField(default=True, help_text="Family member profile is active")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('primary_user', 'email')
        ordering = ['-created_at']
        verbose_name = 'Family Member'
        verbose_name_plural = 'Family Members'
    
    def __str__(self):
        return f"{self.name} ({self.get_relationship_display()}) - {self.primary_user.email}"
    
    @property
    def permissions_dict(self):
        """Get permissions as dictionary for API responses"""
        return {
            'bookServices': self.can_book_services,
            'useWallet': self.can_use_wallet,
            'viewHistory': self.can_view_history,
            'manageBookings': self.can_manage_bookings
        }


class ProfileChangeHistory(models.Model):
    """
    Model to track specific profile changes for activity timeline
    
    Purpose: Track detailed profile updates for customer activity timeline
    Impact: New model - enhances activity timeline with specific profile change tracking
    """
    PROFILE_FIELD_CHOICES = (
        ('email', 'Email Address'),
        ('phone', 'Phone Number'),
        ('password', 'Password'),
        ('avatar', 'Profile Picture'),
        ('address', 'Address'),
        ('bio', 'Bio'),
        ('name', 'Name'),
        ('other', 'Other Profile Updates'),
    )
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile_changes'
    )
    field_changed = models.CharField(
        max_length=20, 
        choices=PROFILE_FIELD_CHOICES,
        help_text="The specific field that was changed"
    )
    old_value = models.TextField(
        blank=True, 
        null=True,
        help_text="Previous value before change (if applicable)"
    )
    new_value = models.TextField(
        blank=True, 
        null=True,
        help_text="New value after change (if applicable)"
    )
    change_description = models.CharField(
        max_length=200,
        help_text="Human-readable description of the change"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Profile Change History'
        verbose_name_plural = 'Profile Change Histories'
    
    def __str__(self):
        return f"{self.user.email} - {self.field_changed} changed on {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class ProviderDocument(models.Model):
    """
    Model for storing provider verification documents
    
    Purpose: Handle document uploads and verification for service providers
    Impact: New model - enables provider verification system
    """
    DOCUMENT_TYPE_CHOICES = (
        ('business_license', 'Business License'),
        ('insurance_certificate', 'Insurance Certificate'),
        ('professional_certification', 'Professional Certification'),
        ('identity_document', 'Identity Document'),
        ('tax_certificate', 'Tax Certificate'),
        ('bank_statement', 'Bank Statement'),
        ('portfolio_certificate', 'Portfolio Certificate'),
        ('other', 'Other Document'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
        ('resubmission_required', 'Resubmission Required'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    
    provider = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='documents',
        help_text="The provider who uploaded this document"
    )
    document_type = models.CharField(
        max_length=30,
        choices=DOCUMENT_TYPE_CHOICES,
        help_text="Type of document being uploaded"
    )
    title = models.CharField(
        max_length=200,
        help_text="Document title or name"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of the document"
    )
    file = models.FileField(
        upload_to=document_upload_path,
        help_text="The document file"
    )
    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes"
    )
    file_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="MIME type of the file"
    )
    
    # Status and verification fields
    status = models.CharField(
        max_length=25,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current verification status"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level for review"
    )
    is_required = models.BooleanField(
        default=False,
        help_text="Whether this document is required for verification"
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="Whether to feature this document in the profile"
    )
    
    # Expiry and validity
    expiry_date = models.DateField(
        blank=True,
        null=True,
        help_text="Document expiry date (if applicable)"
    )
    issue_date = models.DateField(
        blank=True,
        null=True,
        help_text="Document issue date (if applicable)"
    )
    issuing_authority = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Authority that issued the document"
    )
    
    # Review and feedback
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_documents',
        help_text="Admin user who reviewed this document"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the document was reviewed"
    )
    review_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal review notes from admin"
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for rejection (if applicable)"
    )
    
    # Metadata
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order for documents"
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Tags for categorizing documents"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata for the document"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Provider Document'
        verbose_name_plural = 'Provider Documents'
        indexes = [
            models.Index(fields=['provider', 'document_type']),
            models.Index(fields=['status']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.provider.user.email} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """Custom save method to handle file metadata"""
        if self.file:
            # Set file size and type
            self.file_size = self.file.size
            self.file_type = getattr(self.file.file, 'content_type', '')
        
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Check if document is expired"""
        if self.expiry_date:
            from django.utils import timezone
            return timezone.now().date() > self.expiry_date
        return False
    
    @property
    def days_until_expiry(self):
        """Get days until document expires"""
        if self.expiry_date:
            from django.utils import timezone
            delta = self.expiry_date - timezone.now().date()
            return delta.days
        return None
    
    @property
    def file_size_formatted(self):
        """Get formatted file size"""
        if not self.file_size:
            return "Unknown"
        
        # Convert bytes to human readable format
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"
    
    @property
    def can_be_renewed(self):
        """Check if document can be renewed"""
        return self.expiry_date and self.status in ['approved', 'expired']
    
    @property
    def verification_progress(self):
        """Get verification progress percentage"""
        status_progress = {
            'pending': 10,
            'under_review': 50,
            'approved': 100,
            'rejected': 0,
            'expired': 0,
            'resubmission_required': 25,
        }
        return status_progress.get(self.status, 0)


class DocumentVerificationHistory(models.Model):
    """
    Model to track document verification history and changes
    
    Purpose: Maintain audit trail for document verification process
    Impact: New model - enables tracking of verification workflow
    """
    document = models.ForeignKey(
        ProviderDocument,
        on_delete=models.CASCADE,
        related_name='verification_history',
        help_text="The document this history entry relates to"
    )
    previous_status = models.CharField(
        max_length=25,
        choices=ProviderDocument.STATUS_CHOICES,
        help_text="Previous status before change"
    )
    new_status = models.CharField(
        max_length=25,
        choices=ProviderDocument.STATUS_CHOICES,
        help_text="New status after change"
    )
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who made the status change"
    )
    change_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for the status change"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about the change"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Document Verification History'
        verbose_name_plural = 'Document Verification Histories'
    
    def __str__(self):
        return f"{self.document.title} - {self.previous_status} → {self.new_status}"


class DocumentRequirement(models.Model):
    """
    Model to define document requirements for different provider types or services
    
    Purpose: Define what documents are required for provider verification
    Impact: New model - enables flexible document requirement system
    """
    name = models.CharField(
        max_length=200,
        help_text="Name of the document requirement"
    )
    document_type = models.CharField(
        max_length=30,
        choices=ProviderDocument.DOCUMENT_TYPE_CHOICES,
        help_text="Type of document required"
    )
    description = models.TextField(
        help_text="Description of what this document should contain"
    )
    is_mandatory = models.BooleanField(
        default=True,
        help_text="Whether this document is mandatory for verification"
    )
    service_categories = models.ManyToManyField(
        'services.ServiceCategory',
        blank=True,
        help_text="Service categories this requirement applies to"
    )
    priority = models.CharField(
        max_length=10,
        choices=ProviderDocument.PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level for this requirement"
    )
    max_file_size = models.PositiveIntegerField(
        default=5242880,  # 5MB
        help_text="Maximum file size in bytes"
    )
    allowed_file_types = models.JSONField(
        default=list,
        help_text="List of allowed file extensions"
    )
    validity_period_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="How many days the document is valid for"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order for requirements"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this requirement is currently active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Document Requirement'
        verbose_name_plural = 'Document Requirements'
    
    def __str__(self):
        return f"{self.name} ({'Mandatory' if self.is_mandatory else 'Optional'})"
    
    @property
    def max_file_size_formatted(self):
        """Get formatted max file size"""
        size = self.max_file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"