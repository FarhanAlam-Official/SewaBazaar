from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from .models import User, Profile, PortfolioMedia

class PortfolioMediaInline(TabularInline):
    """
    PHASE 2 NEW INLINE: Portfolio media management in profile admin
    
    Purpose: Allow portfolio media management directly from profile admin
    Impact: Enhances admin interface for provider portfolio management
    """
    model = PortfolioMedia
    extra = 0
    fields = ['media_type', 'file', 'title', 'order']
    readonly_fields = ['created_at']

class ProfileInline(StackedInline):
    """
    ENHANCED PROFILE INLINE: Added Phase 2 fields
    """
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'
    
    # PHASE 2 NEW: Organize fields into fieldsets
    fieldsets = (
        ('Basic Information', {
            'fields': ('bio', 'address', 'city', 'date_of_birth')
        }),
        ('Provider Information', {
            'fields': (
                'display_name', 'location_city', 'years_of_experience', 
                'certifications', 'company_name', 'is_approved'
            ),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('avg_rating', 'reviews_count'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['avg_rating', 'reviews_count']

class CustomUserAdmin(UserAdmin, ModelAdmin):
    """
    ENHANCED USER ADMIN: Improved for Phase 2
    """
    inlines = (ProfileInline,)
    list_display = (
        'email', 'username', 'first_name', 'last_name', 'role', 
        'is_verified', 'is_staff', 'get_rating', 'get_reviews_count'
    )
    list_filter = ('role', 'is_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('username', 'first_name', 'last_name', 'phone', 'profile_picture')}),
        (_('Role'), {'fields': ('role', 'is_verified')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role'),
        }),
    )
    
    def get_rating(self, obj):
        """Get provider's average rating"""
        if hasattr(obj, 'profile') and obj.role == 'provider':
            return f"{obj.profile.avg_rating}/5.0"
        return "-"
    get_rating.short_description = 'Rating'
    
    def get_reviews_count(self, obj):
        """Get provider's review count"""
        if hasattr(obj, 'profile') and obj.role == 'provider':
            return obj.profile.reviews_count
        return "-"
    get_reviews_count.short_description = 'Reviews'

class ProfileAdmin(ModelAdmin):
    """
    PHASE 2 NEW ADMIN: Dedicated profile admin for better management
    
    Purpose: Provide comprehensive profile management interface
    Impact: Enhanced admin interface for provider profile management
    """
    list_display = (
        'user', 'display_name', 'location_city', 'years_of_experience',
        'avg_rating', 'reviews_count', 'is_approved'
    )
    list_filter = (
        'user__role', 'is_approved', 'location_city', 
        'years_of_experience', 'created_at'
    )
    search_fields = (
        'user__email', 'user__first_name', 'user__last_name',
        'display_name', 'company_name', 'location_city'
    )
    readonly_fields = ['avg_rating', 'reviews_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Public Profile', {
            'fields': (
                'display_name', 'bio', 'location_city', 
                'years_of_experience', 'certifications'
            )
        }),
        ('Business Information', {
            'fields': ('company_name', 'is_approved'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('avg_rating', 'reviews_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [PortfolioMediaInline]
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('user')

class PortfolioMediaAdmin(ModelAdmin):
    """
    PHASE 2 NEW ADMIN: Portfolio media management
    
    Purpose: Manage provider portfolio media files
    Impact: Provides interface for portfolio content management
    """
    list_display = (
        'profile', 'media_type', 'title', 'order', 'created_at'
    )
    list_filter = ('media_type', 'created_at', 'profile__user__role')
    search_fields = (
        'profile__user__email', 'profile__display_name', 
        'title', 'description'
    )
    ordering = ['profile', 'order', '-created_at']
    
    fieldsets = (
        ('Media Information', {
            'fields': ('profile', 'media_type', 'file')
        }),
        ('Details', {
            'fields': ('title', 'description', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('profile__user')

# Register models
admin.site.register(User, CustomUserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(PortfolioMedia, PortfolioMediaAdmin)
