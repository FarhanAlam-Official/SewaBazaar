from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from datetime import timedelta
import logging

from .models import ContactMessage, ContactMessageAttachment
from .serializers import (
    ContactMessageCreateSerializer, ContactMessageSerializer,
    ContactMessageResponseSerializer, ContactMessageStatsSerializer
)
from apps.common.permissions import IsAdmin

logger = logging.getLogger(__name__)


class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contact messages.
    
    Provides a comprehensive API for handling contact messages including:
    - Creating new contact messages (public endpoint)
    - Viewing and managing messages (admin only)
    - Responding to messages (admin only)
    - Retrieving message statistics (admin only)
    
    Attributes:
        queryset (QuerySet): The base queryset for contact messages
        filter_backends (list): Filter backends for the viewset
        filterset_fields (list): Fields available for filtering
        search_fields (list): Fields available for searching
        ordering_fields (list): Fields available for ordering
        ordering (str): Default ordering
    """
    
    queryset = ContactMessage.objects.all().select_related(
        'user', 'responded_by'
    ).prefetch_related('attachments')
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'is_spam', 'is_important']
    search_fields = ['name', 'email', 'subject', 'message']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        
        Uses different serializers for different actions:
        - ContactMessageCreateSerializer for creating messages
        - ContactMessageResponseSerializer for responding to messages
        - ContactMessageSerializer for all other actions
        
        Returns:
            Serializer: The appropriate serializer class
        """
        if self.action == 'create':
            return ContactMessageCreateSerializer
        elif self.action == 'respond':
            return ContactMessageResponseSerializer
        return ContactMessageSerializer
    
    def get_permissions(self):
        """
        Set permissions based on action.
        
        Allows anyone to create contact messages, but requires admin
        permissions for all other actions.
        
        Returns:
            list: List of permission instances
        """
        if self.action == 'create':
            # Anyone can create contact messages
            permission_classes = [permissions.AllowAny]
        else:
            # Only admins can view and manage messages
            permission_classes = [IsAdmin]
        
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """
        Create a new contact message.
        
        Handles the creation of a new contact message, including validation,
        saving to the database, and sending notification emails.
        
        Args:
            request (Request): The HTTP request object
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
            
        Returns:
            Response: HTTP response with creation status and message data
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the message
        message = serializer.save()
        
        # Send notification email to admins
        try:
            self.send_admin_notification(message)
        except Exception as e:
            logger.error(f"Failed to send admin notification for contact message {message.id}: {str(e)}")
        
        # Send confirmation email to sender
        try:
            self.send_confirmation_email(message)
        except Exception as e:
            logger.error(f"Failed to send confirmation email for contact message {message.id}: {str(e)}")
        
        return Response({
            'message': 'Your message has been sent successfully! We\'ll get back to you soon.',
            'id': message.id,
            'status': message.status
        }, status=status.HTTP_201_CREATED)
    
    def send_admin_notification(self, contact_message):
        """
        Send notification email to admins about new contact message.
        
        Sends an HTML and plain text email notification to admins when a
        new contact message is received.
        
        Args:
            contact_message (ContactMessage): The contact message instance
        """
        subject = f'New Contact Message: {contact_message.subject}'
        
        # Get admin email from settings
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@sewabazaar.com')
        
        # Build context for email template
        context = {
            'message': contact_message,
            'admin_url': f"{settings.FRONTEND_URL}/admin/contact/messages/{contact_message.id}/",
            'site_name': 'SewaBazaar'
        }
        
        # Render HTML email
        html_content = render_to_string('emails/contact_admin_notification.html', context)
        
        # Plain text version
        text_content = f"""
        New Contact Message Received
        
        From: {contact_message.name} ({contact_message.email})
        Subject: {contact_message.subject}
        Priority: {contact_message.get_priority_display()}
        
        Message:
        {contact_message.message}
        
        Received: {contact_message.created_at.strftime('%Y-%m-%d %H:%M:%S')}
        
        View and respond: {context['admin_url']}
        """
        
        # Send email
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[admin_email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    
    def send_confirmation_email(self, contact_message):
        """
        Send confirmation email to message sender.
        
        Sends an HTML and plain text confirmation email to the sender
        when their contact message is received.
        
        Args:
            contact_message (ContactMessage): The contact message instance
        """
        subject = 'Message Received - SewaBazaar Support'
        
        # Build context for email template
        context = {
            'message': contact_message,
            'site_name': 'SewaBazaar',
            'support_email': 'support@sewabazaar.com'
        }
        
        # Render HTML email
        html_content = render_to_string('emails/contact_confirmation.html', context)
        
        # Plain text version
        text_content = f"""
        Thank you for contacting SewaBazaar!
        
        Hi {contact_message.name},
        
        We have received your message with the subject: "{contact_message.subject}"
        
        Our support team will review your message and get back to you within 24 hours.
        
        Message ID: #{contact_message.id}
        Received: {contact_message.created_at.strftime('%Y-%m-%d %H:%M:%S')}
        
        If you have any urgent concerns, please call us at +977-1-XXXXXXX
        
        Best regards,
        SewaBazaar Support Team
        """
        
        # Send email
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[contact_message.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def respond(self, request, pk=None):
        """
        Respond to a contact message.
        
        Allows admins to respond to a specific contact message, updating
        the message with the response and sending a notification email
        to the original sender.
        
        Args:
            request (Request): The HTTP request object
            pk (int): The primary key of the contact message
            
        Returns:
            Response: HTTP response with response status and updated message data
        """
        message = self.get_object()
        serializer = ContactMessageResponseSerializer(
            message, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        updated_message = serializer.save()
        
        # Send response email to the original sender
        try:
            self.send_response_email(updated_message)
        except Exception as e:
            logger.error(f"Failed to send response email for message {message.id}: {str(e)}")
        
        return Response({
            'message': 'Response sent successfully',
            'data': ContactMessageSerializer(updated_message, context={'request': request}).data
        })
    
    def send_response_email(self, contact_message):
        """
        Send response email to the original message sender.
        
        Sends an HTML and plain text response email to the original sender
        when an admin responds to their contact message.
        
        Args:
            contact_message (ContactMessage): The contact message instance
        """
        subject = f'Re: {contact_message.subject} - SewaBazaar Support'
        
        # Build context for email template
        context = {
            'message': contact_message,
            'site_name': 'SewaBazaar',
            'support_email': 'support@sewabazaar.com'
        }
        
        # Render HTML email
        html_content = render_to_string('emails/contact_response.html', context)
        
        # Plain text version
        text_content = f"""
        Response to your message - SewaBazaar Support
        
        Hi {contact_message.name},
        
        Thank you for contacting SewaBazaar. Here's our response to your message:
        
        Original Subject: {contact_message.subject}
        Message ID: #{contact_message.id}
        
        Our Response:
        {contact_message.admin_response}
        
        If you have any further questions, please don't hesitate to contact us.
        
        Best regards,
        {contact_message.responded_by.get_full_name() if contact_message.responded_by else 'SewaBazaar Support Team'}
        SewaBazaar Support
        """
        
        # Send email
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[contact_message.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        """
        Update message status.
        
        Allows admins to update the status of a specific contact message.
        
        Args:
            request (Request): The HTTP request object
            pk (int): The primary key of the contact message
            
        Returns:
            Response: HTTP response with update status
        """
        message = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(ContactMessage.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message.status = new_status
        message.save()
        
        return Response({
            'message': f'Status updated to {message.get_status_display()}',
            'status': message.status
        })
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def update_priority(self, request, pk=None):
        """
        Update message priority.
        
        Allows admins to update the priority of a specific contact message.
        
        Args:
            request (Request): The HTTP request object
            pk (int): The primary key of the contact message
            
        Returns:
            Response: HTTP response with update status
        """
        message = self.get_object()
        new_priority = request.data.get('priority')
        
        if new_priority not in dict(ContactMessage.PRIORITY_CHOICES):
            return Response(
                {'error': 'Invalid priority'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message.priority = new_priority
        message.save()
        
        return Response({
            'message': f'Priority updated to {message.get_priority_display()}',
            'priority': message.priority
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def mark_spam(self, request, pk=None):
        """
        Mark message as spam.
        
        Allows admins to mark a specific contact message as spam,
        which will close the message.
        
        Args:
            request (Request): The HTTP request object
            pk (int): The primary key of the contact message
            
        Returns:
            Response: HTTP response with update status
        """
        message = self.get_object()
        message.mark_as_spam()
        
        return Response({
            'message': 'Message marked as spam',
            'is_spam': message.is_spam,
            'status': message.status
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def mark_important(self, request, pk=None):
        """
        Toggle important flag.
        
        Allows admins to toggle the important flag on a specific contact message.
        
        Args:
            request (Request): The HTTP request object
            pk (int): The primary key of the contact message
            
        Returns:
            Response: HTTP response with update status
        """
        message = self.get_object()
        message.is_important = not message.is_important
        message.save()
        
        return Response({
            'message': f'Message marked as {"important" if message.is_important else "normal"}',
            'is_important': message.is_important
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def statistics(self, request):
        """
        Get contact message statistics.
        
        Provides comprehensive statistics about contact messages including
        counts, time-based metrics, response times, and breakdowns.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            Response: HTTP response with statistics data
        """
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Basic counts
        total_messages = ContactMessage.objects.count()
        pending_messages = ContactMessage.objects.filter(status='pending').count()
        in_progress_messages = ContactMessage.objects.filter(status='in_progress').count()
        resolved_messages = ContactMessage.objects.filter(status='resolved').count()
        spam_messages = ContactMessage.objects.filter(is_spam=True).count()
        
        # Time-based counts
        messages_today = ContactMessage.objects.filter(created_at__date=today).count()
        messages_this_week = ContactMessage.objects.filter(created_at__date__gte=week_ago).count()
        messages_this_month = ContactMessage.objects.filter(created_at__date__gte=month_ago).count()
        
        # Response metrics
        responded_messages = ContactMessage.objects.filter(
            admin_response__isnull=False,
            responded_at__isnull=False
        )
        
        # Calculate average response time in hours
        avg_response_time = responded_messages.aggregate(
            avg_time=Avg('responded_at') - Avg('created_at')
        )['avg_time']
        
        avg_response_hours = 0
        if avg_response_time:
            avg_response_hours = avg_response_time.total_seconds() / 3600
        
        # Response rate
        response_rate = 0
        if total_messages > 0:
            response_rate = (responded_messages.count() / total_messages) * 100
        
        # Priority breakdown
        priority_breakdown = dict(
            ContactMessage.objects.values('priority').annotate(
                count=Count('id')
            ).values_list('priority', 'count')
        )
        
        # Status breakdown
        status_breakdown = dict(
            ContactMessage.objects.values('status').annotate(
                count=Count('id')
            ).values_list('status', 'count')
        )
        
        stats_data = {
            'total_messages': total_messages,
            'pending_messages': pending_messages,
            'in_progress_messages': in_progress_messages,
            'resolved_messages': resolved_messages,
            'spam_messages': spam_messages,
            'messages_today': messages_today,
            'messages_this_week': messages_this_week,
            'messages_this_month': messages_this_month,
            'average_response_time_hours': round(avg_response_hours, 2),
            'response_rate_percentage': round(response_rate, 2),
            'priority_breakdown': priority_breakdown,
            'status_breakdown': status_breakdown
        }
        
        serializer = ContactMessageStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def recent(self, request):
        """
        Get recent contact messages.
        
        Retrieves the most recent contact messages, with a default limit of 10.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            Response: HTTP response with recent messages data
        """
        limit = int(request.query_params.get('limit', 10))
        recent_messages = self.get_queryset()[:limit]
        
        serializer = self.get_serializer(recent_messages, many=True)
        return Response({
            'count': recent_messages.count(),
            'messages': serializer.data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def pending(self, request):
        """
        Get pending contact messages.
        
        Retrieves all contact messages with a 'pending' status.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            Response: HTTP response with pending messages data
        """
        pending_messages = self.get_queryset().filter(status='pending')
        
        serializer = self.get_serializer(pending_messages, many=True)
        return Response({
            'count': pending_messages.count(),
            'messages': serializer.data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def bulk_update_status(self, request):
        """
        Bulk update status for multiple messages.
        
        Allows admins to update the status of multiple contact messages at once.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            Response: HTTP response with update status
        """
        message_ids = request.data.get('message_ids', [])
        new_status = request.data.get('status')
        
        if not message_ids or not new_status:
            return Response(
                {'error': 'message_ids and status are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(ContactMessage.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = ContactMessage.objects.filter(
            id__in=message_ids
        ).update(status=new_status)
        
        return Response({
            'message': f'{updated_count} messages updated to {new_status}',
            'updated_count': updated_count
        })