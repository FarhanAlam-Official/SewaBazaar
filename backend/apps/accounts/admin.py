from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.utils import timezone
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from .models import (
    User, Profile, PortfolioProject, PortfolioMedia,
    ProviderDocument, DocumentVerificationHistory, DocumentRequirement
)

class PortfolioMediaInline(TabularInline):
    """
    Portfolio media management in project admin
    """
    model = PortfolioMedia
    extra = 0
    fields = ['media_type', 'file', 'order', 'caption']
    readonly_fields = ['created_at']

class PortfolioProjectInline(TabularInline):
    """
    Portfolio project management in profile admin
    """
    model = PortfolioProject
    extra = 0
    fields = ['title', 'description', 'order']
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

class CustomUserAdmin(BaseUserAdmin, ModelAdmin):
    """
    ENHANCED USER ADMIN: Improved for Phase 2 with proper django-unfold integration
    """
    # Use unfold forms for proper styling and functionality
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    
    inlines = (ProfileInline,)
    list_display = (
        'email', 'username', 'first_name', 'last_name', 'role', 
        'is_verified', 'is_staff', 'get_rating', 'get_reviews_count'
    )
    list_filter = ('role', 'is_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone', 'profile_picture')}),
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
    
    inlines = [PortfolioProjectInline]
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('user')

class PortfolioProjectAdmin(ModelAdmin):
    """
    Portfolio project management
    """
    list_display = (
        'title', 'profile', 'media_count', 'order', 'created_at'
    )
    list_filter = ('created_at', 'profile__user__role')
    search_fields = (
        'title', 'description', 'profile__user__email', 'profile__display_name'
    )
    ordering = ['profile', 'order', '-created_at']
    
    fieldsets = (
        ('Project Information', {
            'fields': ('profile', 'title', 'description', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    inlines = [PortfolioMediaInline]
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('profile__user')

class PortfolioMediaAdmin(ModelAdmin):
    """
    Portfolio media management
    """
    list_display = (
        'project', 'media_type', 'caption', 'order', 'created_at'
    )
    list_filter = ('media_type', 'created_at', 'project__profile__user__role')
    search_fields = (
        'project__title', 'caption', 'project__profile__user__email'
    )
    ordering = ['project', 'order', '-created_at']
    
    fieldsets = (
        ('Media Information', {
            'fields': ('project', 'media_type', 'file')
        }),
        ('Details', {
            'fields': ('caption', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('project__profile__user')

# Document Management Admin Classes

class DocumentVerificationHistoryInline(TabularInline):
    """
    Document verification history inline for document admin
    """
    model = DocumentVerificationHistory
    extra = 0
    fields = ['previous_status', 'new_status', 'changed_by', 'change_reason', 'created_at']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Customize foreign key fields in inline forms
        """
        if db_field.name == "changed_by":
            # Only show admin users in the changed_by dropdown
            kwargs["queryset"] = User.objects.filter(
                role='admin',
                is_active=True
            ).order_by('first_name', 'last_name', 'email')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

class ProviderDocumentAdmin(ModelAdmin):
    """
    Provider document management with verification workflow
    """
    list_display = (
        'title', 'provider_name', 'document_type', 'status_badge', 'priority_badge',
        'is_required', 'is_expired', 'expiry_date', 'created_at'
    )
    list_filter = (
        'document_type', 'status', 'priority', 'is_required', 'is_featured',
        'created_at', 'expiry_date'
    )
    search_fields = (
        'title', 'description', 'provider__user__email', 'provider__user__first_name',
        'provider__user__last_name', 'issuing_authority'
    )
    readonly_fields = (
        'file_size', 'file_type', 'file_size_formatted', 'is_expired', 'days_until_expiry',
        'can_be_renewed', 'verification_progress', 'reviewed_by', 'reviewed_at', 
        'created_at', 'updated_at'
    )
    
    fieldsets = (
        ('Document Information', {
            'fields': ('provider', 'document_type', 'title', 'description', 'file')
        }),
        ('Document Details', {
            'fields': (
                'issue_date', 'expiry_date', 'issuing_authority',
                'priority', 'is_required', 'is_featured'
            )
        }),
        ('Verification', {
            'fields': (
                'status', 'reviewed_by', 'reviewed_at', 'review_notes', 'rejection_reason'
            )
        }),
        ('Metadata', {
            'fields': ('order', 'tags', 'metadata'),
            'classes': ('collapse',)
        }),
        ('File Information', {
            'fields': ('file_size', 'file_type', 'file_size_formatted'),
            'classes': ('collapse',)
        }),
        ('Status Information', {
            'fields': (
                'is_expired', 'days_until_expiry', 'can_be_renewed', 'verification_progress'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [DocumentVerificationHistoryInline]
    actions = ['approve_documents', 'reject_documents', 'mark_under_review']
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Customize foreign key fields in admin forms
        """
        if db_field.name == "reviewed_by":
            # Only show admin users in the reviewed_by dropdown
            kwargs["queryset"] = User.objects.filter(
                role='admin',
                is_active=True
            ).order_by('first_name', 'last_name', 'email')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        """
        Always set reviewed_by to current user when status changes to review status
        AND create verification history entry
        """
        old_status = None
        
        if change:  # Only for updates, not new objects
            # Get the original object to compare status
            try:
                original = ProviderDocument.objects.get(pk=obj.pk)
                old_status = original.status
                
                # If status changed to a review status, always set current user as reviewer
                if (original.status != obj.status and 
                    obj.status in ['approved', 'rejected', 'under_review', 'resubmission_required']):
                    obj.reviewed_by = request.user
                    obj.reviewed_at = timezone.now()
            except ProviderDocument.DoesNotExist:
                pass
        
        # Save the object first
        super().save_model(request, obj, form, change)
        
        # Create verification history entry if status changed
        if change and old_status and old_status != obj.status:
            # Import here to avoid circular imports
            from .models import DocumentVerificationHistory
            
            # Determine change reason based on new status
            change_reasons = {
                'approved': 'Document approved via admin interface',
                'rejected': 'Document rejected via admin interface',
                'under_review': 'Document marked as under review via admin interface',
                'resubmission_required': 'Resubmission requested via admin interface',
                'pending': 'Document status reset to pending via admin interface',
                'expired': 'Document marked as expired via admin interface'
            }
            
            change_reason = change_reasons.get(obj.status, f'Status changed to {obj.status} via admin interface')
            
            # Create history entry
            DocumentVerificationHistory.objects.create(
                document=obj,
                previous_status=old_status,
                new_status=obj.status,
                changed_by=request.user,
                change_reason=change_reason,
                notes=obj.review_notes or obj.rejection_reason or ''
            )
    
    def reviewed_by(self, obj):
        """
        Display the reviewer's name (read-only)
        """
        if obj.reviewed_by:
            return f"{obj.reviewed_by.get_full_name()} ({obj.reviewed_by.email})"
        return "Not reviewed yet"
    reviewed_by.short_description = 'Reviewed By'
    
    def provider_name(self, obj):
        return f"{obj.provider.user.get_full_name()} ({obj.provider.user.email})"
    provider_name.short_description = 'Provider'
    provider_name.admin_order_field = 'provider__user__email'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#fbbf24',
            'under_review': '#3b82f6',
            'approved': '#10b981',
            'rejected': '#ef4444',
            'expired': '#6b7280',
            'resubmission_required': '#f97316'
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
    
    def priority_badge(self, obj):
        colors = {
            'low': '#6b7280',
            'medium': '#3b82f6',
            'high': '#f97316',
            'critical': '#ef4444'
        }
        color = colors.get(obj.priority, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">{}</span>',
            color,
            obj.priority.upper()
        )
    priority_badge.short_description = 'Priority'
    priority_badge.admin_order_field = 'priority'
    
    def approve_documents(self, request, queryset):
        """Bulk approve documents with history tracking"""
        from .models import DocumentVerificationHistory
        
        updated_count = 0
        for document in queryset:
            old_status = document.status
            document.status = 'approved'
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.save()
            
            # Create history entry
            DocumentVerificationHistory.objects.create(
                document=document,
                previous_status=old_status,
                new_status='approved',
                changed_by=request.user,
                change_reason='Bulk approved via admin interface',
                notes='Document approved through bulk action'
            )
            updated_count += 1
        
        self.message_user(request, f'{updated_count} documents approved successfully.')
    approve_documents.short_description = 'Approve selected documents'
    
    def reject_documents(self, request, queryset):
        """Bulk reject documents with history tracking"""
        from .models import DocumentVerificationHistory
        
        updated_count = 0
        for document in queryset:
            old_status = document.status
            document.status = 'rejected'
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.save()
            
            # Create history entry
            DocumentVerificationHistory.objects.create(
                document=document,
                previous_status=old_status,
                new_status='rejected',
                changed_by=request.user,
                change_reason='Bulk rejected via admin interface',
                notes='Document rejected through bulk action'
            )
            updated_count += 1
        
        self.message_user(request, f'{updated_count} documents rejected.')
    reject_documents.short_description = 'Reject selected documents'
    
    def mark_under_review(self, request, queryset):
        """Bulk mark documents as under review with history tracking"""
        from .models import DocumentVerificationHistory
        
        updated_count = 0
        for document in queryset:
            old_status = document.status
            document.status = 'under_review'
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.save()
            
            # Create history entry
            DocumentVerificationHistory.objects.create(
                document=document,
                previous_status=old_status,
                new_status='under_review',
                changed_by=request.user,
                change_reason='Bulk marked as under review via admin interface',
                notes='Document marked as under review through bulk action'
            )
            updated_count += 1
        
        self.message_user(request, f'{updated_count} documents marked as under review.')
    mark_under_review.short_description = 'Mark as under review'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('provider__user', 'reviewed_by')

class DocumentVerificationHistoryAdmin(ModelAdmin):
    """
    Document verification history management
    """
    list_display = (
        'document_title', 'provider_name', 'status_change', 'changed_by', 'created_at'
    )
    list_filter = ('previous_status', 'new_status', 'created_at', 'changed_by')
    search_fields = (
        'document__title', 'document__provider__user__email',
        'change_reason', 'notes'
    )
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Document Information', {
            'fields': ('document',)
        }),
        ('Status Change', {
            'fields': ('previous_status', 'new_status', 'changed_by')
        }),
        ('Details', {
            'fields': ('change_reason', 'notes')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        })
    )
    
    def document_title(self, obj):
        return obj.document.title
    document_title.short_description = 'Document'
    document_title.admin_order_field = 'document__title'
    
    def provider_name(self, obj):
        return f"{obj.document.provider.user.get_full_name()} ({obj.document.provider.user.email})"
    provider_name.short_description = 'Provider'
    provider_name.admin_order_field = 'document__provider__user__email'
    
    def status_change(self, obj):
        return f"{obj.previous_status} → {obj.new_status}"
    status_change.short_description = 'Status Change'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related(
            'document__provider__user', 'changed_by'
        )

class DocumentRequirementAdmin(ModelAdmin):
    """
    Document requirement management
    """
    list_display = (
        'name', 'document_type', 'is_mandatory', 'priority_badge',
        'max_file_size_formatted', 'validity_period_days', 'is_active', 'order'
    )
    list_filter = ('document_type', 'is_mandatory', 'priority', 'is_active')
    search_fields = ('name', 'description', 'document_type')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'document_type', 'description')
        }),
        ('Requirements', {
            'fields': (
                'is_mandatory', 'priority', 'max_file_size', 'allowed_file_types',
                'validity_period_days'
            )
        }),
        ('Display Settings', {
            'fields': ('order', 'is_active')
        }),
        ('Service Categories', {
            'fields': ('service_categories',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def priority_badge(self, obj):
        colors = {
            'low': '#6b7280',
            'medium': '#3b82f6',
            'high': '#f97316',
            'critical': '#ef4444'
        }
        color = colors.get(obj.priority, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">{}</span>',
            color,
            obj.priority.upper()
        )
    priority_badge.short_description = 'Priority'
    priority_badge.admin_order_field = 'priority'

# Register models
admin.site.register(User, CustomUserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(PortfolioProject, PortfolioProjectAdmin)
admin.site.register(PortfolioMedia, PortfolioMediaAdmin)

# Register document management models
admin.site.register(ProviderDocument, ProviderDocumentAdmin)
admin.site.register(DocumentVerificationHistory, DocumentVerificationHistoryAdmin)
admin.site.register(DocumentRequirement, DocumentRequirementAdmin)
