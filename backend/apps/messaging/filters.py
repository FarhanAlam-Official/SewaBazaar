"""
Django filters for the messaging app.

This module contains filter classes for filtering conversations and messages
based on various criteria like status, dates, and user roles.
"""

import django_filters
from django.db.models import Q
from .models import Conversation, Message


class ConversationFilter(django_filters.FilterSet):
    """
    Filter for conversations with various search and filter options.
    
    Provides filtering capabilities for conversation lists including
    status, date ranges, and text search.
    """
    
    # Status filters
    is_active = django_filters.BooleanFilter(field_name='is_active')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at', 
        lookup_expr='gte',
        help_text='Filter conversations created after this date (YYYY-MM-DD HH:MM:SS)'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at', 
        lookup_expr='lte',
        help_text='Filter conversations created before this date (YYYY-MM-DD HH:MM:SS)'
    )
    last_message_after = django_filters.DateTimeFilter(
        field_name='last_message_at', 
        lookup_expr='gte',
        help_text='Filter conversations with last message after this date'
    )
    last_message_before = django_filters.DateTimeFilter(
        field_name='last_message_at', 
        lookup_expr='lte',
        help_text='Filter conversations with last message before this date'
    )
    
    # Service category filter
    service_category = django_filters.CharFilter(
        field_name='service__category__slug',
        lookup_expr='iexact',
        help_text='Filter by service category slug'
    )
    
    # Unread messages filter
    has_unread = django_filters.BooleanFilter(
        method='filter_has_unread',
        help_text='Filter conversations with unread messages'
    )
    
    # Text search across multiple fields
    search = django_filters.CharFilter(
        method='filter_search',
        help_text='Search across service title, customer name, and provider name'
    )
    
    class Meta:
        model = Conversation
        fields = {
            'service': ['exact'],
            'provider': ['exact'],
            'customer': ['exact'],
        }
    
    def filter_has_unread(self, queryset, name, value):
        """Filter conversations based on unread message status."""
        if not value:
            return queryset
        
        user = self.request.user
        if user.role == 'customer':
            return queryset.filter(unread_count_customer__gt=0)
        elif user.role == 'provider':
            return queryset.filter(unread_count_provider__gt=0)
        
        return queryset
    
    def filter_search(self, queryset, name, value):
        """Search across multiple conversation-related fields."""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(service__title__icontains=value) |
            Q(customer__first_name__icontains=value) |
            Q(customer__last_name__icontains=value) |
            Q(provider__first_name__icontains=value) |
            Q(provider__last_name__icontains=value) |
            Q(last_message_preview__icontains=value)
        )


class MessageFilter(django_filters.FilterSet):
    """
    Filter for messages with various search and filter options.
    
    Provides filtering capabilities for message lists including
    message type, status, dates, and content search.
    """
    
    # Message type filters
    message_type = django_filters.ChoiceFilter(
        choices=Message.MESSAGE_TYPES,
        help_text='Filter by message type (text, image, file, system)'
    )
    
    # Status filters
    status = django_filters.ChoiceFilter(
        choices=Message.MESSAGE_STATUS,
        help_text='Filter by message status (sent, delivered, read)'
    )
    is_flagged = django_filters.BooleanFilter(
        field_name='is_flagged',
        help_text='Filter flagged messages'
    )
    
    # Date filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at', 
        lookup_expr='gte',
        help_text='Filter messages created after this date (YYYY-MM-DD HH:MM:SS)'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at', 
        lookup_expr='lte',
        help_text='Filter messages created before this date (YYYY-MM-DD HH:MM:SS)'
    )
    
    # Sender filters
    sender_role = django_filters.CharFilter(
        field_name='sender__role',
        lookup_expr='iexact',
        help_text='Filter by sender role (customer, provider)'
    )
    
    # Conversation filter
    conversation = django_filters.NumberFilter(
        field_name='conversation__id',
        help_text='Filter messages by conversation ID'
    )
    
    # Content search
    search = django_filters.CharFilter(
        method='filter_search',
        help_text='Search message text content'
    )
    
    # Has attachment filter
    has_attachment = django_filters.BooleanFilter(
        method='filter_has_attachment',
        help_text='Filter messages with attachments'
    )
    
    class Meta:
        model = Message
        fields = {
            'sender': ['exact'],
        }
    
    def filter_search(self, queryset, name, value):
        """Search message text content."""
        if not value:
            return queryset
        
        return queryset.filter(text__icontains=value)
    
    def filter_has_attachment(self, queryset, name, value):
        """Filter messages based on attachment presence."""
        if value:
            return queryset.exclude(attachment__isnull=True).exclude(attachment='')
        else:
            return queryset.filter(Q(attachment__isnull=True) | Q(attachment=''))


class MessageDateRangeFilter(django_filters.FilterSet):
    """
    Specialized filter for message date range queries.
    
    Useful for analytics and reporting on message activity
    over specific time periods.
    """
    
    # Date range filters with common presets
    today = django_filters.BooleanFilter(
        method='filter_today',
        help_text='Filter messages from today'
    )
    this_week = django_filters.BooleanFilter(
        method='filter_this_week',
        help_text='Filter messages from this week'
    )
    this_month = django_filters.BooleanFilter(
        method='filter_this_month',
        help_text='Filter messages from this month'
    )
    
    class Meta:
        model = Message
        fields = []
    
    def filter_today(self, queryset, name, value):
        """Filter messages from today."""
        if not value:
            return queryset
        
        from django.utils import timezone
        today = timezone.now().date()
        return queryset.filter(created_at__date=today)
    
    def filter_this_week(self, queryset, name, value):
        """Filter messages from this week."""
        if not value:
            return queryset
        
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        week_start = now - timedelta(days=now.weekday())
        return queryset.filter(created_at__gte=week_start.date())
    
    def filter_this_month(self, queryset, name, value):
        """Filter messages from this month."""
        if not value:
            return queryset
        
        from django.utils import timezone
        
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return queryset.filter(created_at__gte=month_start)