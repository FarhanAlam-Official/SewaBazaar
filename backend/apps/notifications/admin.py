from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Notification

class NotificationAdmin(ModelAdmin):
    list_display = ('id', 'user', 'title', 'notification_type', 'priority', 'is_read', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'created_at')
    search_fields = ('user__email', 'title', 'message')
    readonly_fields = ('created_at',)

admin.site.register(Notification, NotificationAdmin)
