from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class ContactMessage(models.Model):
    """
    Model for storing contact form messages from users.
    
    This model represents messages submitted through the contact form by users.
    It includes fields for basic message information, user details (if logged in),
    message management features, admin responses, metadata, and timestamps.
    
    Attributes:
        name (str): Sender's full name
        email (str): Sender's email address
        subject (str): Subject of the message
        message (str): Content of the message
        user (User): Associated user account (if sender is logged in)
        status (str): Current status of the message (pending, in_progress, resolved, closed)
        priority (str): Priority level of the message (low, medium, high, urgent)
        admin_response (str): Admin's response to the message
        responded_by (User): Admin who responded to the message
        responded_at (datetime): When the admin responded
        ip_address (str): IP address of the sender
        user_agent (str): Browser user agent string
        created_at (datetime): When the message was created
        updated_at (datetime): When the message was last updated
        is_spam (bool): Whether the message is marked as spam
        is_important (bool): Whether the message is marked as important
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    # Basic message information
    name = models.CharField(max_length=255, help_text="Sender's full name")
    email = models.EmailField(help_text="Sender's email address")
    subject = models.CharField(max_length=500, help_text="Message subject")
    message = models.TextField(help_text="Message content")
    
    # Optional user reference (if sender is logged in)
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='contact_messages',
        help_text="Associated user account (if logged in)"
    )
    
    # Message management
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text="Current status of the message"
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='medium',
        help_text="Priority level of the message"
    )
    
    # Admin response
    admin_response = models.TextField(
        blank=True, 
        null=True,
        help_text="Admin response to the message"
    )
    responded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contact_responses',
        help_text="Admin who responded to the message"
    )
    responded_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When the admin responded"
    )
    
    # Metadata
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        help_text="IP address of the sender"
    )
    user_agent = models.TextField(
        blank=True, 
        null=True,
        help_text="Browser user agent string"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Flags
    is_spam = models.BooleanField(
        default=False,
        help_text="Mark as spam if detected"
    )
    is_important = models.BooleanField(
        default=False,
        help_text="Mark as important for priority handling"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Message'
        verbose_name_plural = 'Contact Messages'
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['email', 'created_at']),
            models.Index(fields=['priority', 'status']),
        ]
    
    def __str__(self):
        """Return a string representation of the contact message."""
        return f"{self.name} - {self.subject[:50]}..."
    
    def save(self, *args, **kwargs):
        """
        Save the contact message instance.
        
        Automatically sets the responded_at timestamp when an admin response is added
        and updates the status to 'in_progress' if it was 'pending'.
        
        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        # Auto-set responded_at when admin_response is added
        if self.admin_response and not self.responded_at:
            self.responded_at = timezone.now()
        
        # Auto-update status when response is added
        if self.admin_response and self.status == 'pending':
            self.status = 'in_progress'
        
        super().save(*args, **kwargs)
    
    @property
    def is_responded(self):
        """
        Check if the message has been responded to.
        
        Returns:
            bool: True if the message has an admin response, False otherwise
        """
        return bool(self.admin_response)
    
    @property
    def response_time(self):
        """
        Calculate response time if responded.
        
        Returns:
            timedelta: Time difference between creation and response, or None if not responded
        """
        if self.responded_at:
            return self.responded_at - self.created_at
        return None
    
    def mark_as_resolved(self, admin_user=None):
        """
        Mark message as resolved.
        
        Args:
            admin_user (User, optional): The admin user who resolved the message
        """
        self.status = 'resolved'
        if admin_user:
            self.responded_by = admin_user
        if not self.responded_at:
            self.responded_at = timezone.now()
        self.save()
    
    def mark_as_spam(self):
        """Mark message as spam and close it."""
        self.is_spam = True
        self.status = 'closed'
        self.save()


class ContactMessageAttachment(models.Model):
    """
    Model for storing file attachments with contact messages.
    
    This model represents file attachments that users can include with their
    contact messages. It stores the file, original filename, file size,
    content type, and upload timestamp.
    
    Attributes:
        message (ContactMessage): The contact message this attachment belongs to
        file (FileField): The attached file
        original_filename (str): Original filename of the attachment
        file_size (int): Size of the file in bytes
        content_type (str): MIME type of the file
        uploaded_at (datetime): When the attachment was uploaded
    """
    message = models.ForeignKey(
        ContactMessage,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(
        upload_to='contact_attachments/%Y/%m/',
        help_text="Attached file"
    )
    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename"
    )
    file_size = models.PositiveIntegerField(
        help_text="File size in bytes"
    )
    content_type = models.CharField(
        max_length=100,
        help_text="MIME type of the file"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']
        verbose_name = 'Contact Message Attachment'
        verbose_name_plural = 'Contact Message Attachments'
    
    def __str__(self):
        """Return a string representation of the contact message attachment."""
        return f"Attachment for {self.message.subject}: {self.original_filename}"
    
    @property
    def file_size_formatted(self):
        """
        Return formatted file size.
        
        Returns:
            str: Formatted file size with appropriate unit (B, KB, MB, GB, TB)
        """
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"