from django.contrib import admin
from .models import Review

class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'service', 'customer', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('service__title', 'customer__email', 'customer__first_name', 'customer__last_name', 'comment')
    readonly_fields = ('created_at', 'updated_at')

admin.site.register(Review, ReviewAdmin)
