from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Notification


class NotificationAdmin(ModelAdmin):
    """
    Admin interface for notifications.
    
    Provides a customized admin interface for managing notifications,
    including list display, filtering, and search functionality.
    
    Attributes:
        list_display (list): Fields to display in the list view
        list_filter (list): Fields to filter by in the list view
        search_fields (list): Fields to search in the list view
        readonly_fields (list): Fields that are read-only in the admin
    """
    list_display = ('id', 'user', 'title', 'notification_type', 'priority', 'is_read', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'created_at')
    search_fields = ('user__email', 'title', 'message')
    readonly_fields = ('created_at',)


admin.site.register(Notification, NotificationAdmin)