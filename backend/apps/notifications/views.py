from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import time
from .models import Notification, UserNotificationSetting
from .serializers import NotificationSerializer, UserNotificationSettingSerializer
from apps.common.permissions import IsOwnerOrAdmin


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notifications.
    
    Provides a comprehensive API for handling user notifications including:
    - Listing notifications
    - Marking notifications as read
    - Getting unread counts
    - Managing notification preferences
    - Clearing read notifications
    - Real-time notification streaming
    
    Attributes:
        queryset (QuerySet): The base queryset for notifications
        serializer_class (Serializer): The serializer class for notifications
        permission_classes (list): The permission classes for this viewset
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Get the queryset for notifications.
        
        Filters notifications based on the authenticated user and handles
        anonymous users during schema generation.
        
        Returns:
            QuerySet: The filtered queryset of notifications
        """
        user = self.request.user
        
        # Handle anonymous users during schema generation
        if not user.is_authenticated:
            return Notification.objects.none()
        
        # Filter by provider role for provider notifications
        if hasattr(user, 'provider_profile'):
            return Notification.objects.filter(user=user)
        
        return Notification.objects.filter(user=user)
    
    def list(self, request, *args, **kwargs):
        """
        List notifications for the authenticated user.
        
        Provides a list of notifications with optional filtering by type
        and read status.
        
        Args:
            request (Request): The HTTP request object
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
            
        Returns:
            Response: HTTP response with notification data
        """
        """List notifications for provider dashboard"""
        queryset = self.get_queryset()
        
        # Filter by type if specified
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(type=notification_type)
        
        # Filter by read status if specified
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """
        Update a notification (mainly for marking as read).
        
        Allows updating the read status of a notification.
        
        Args:
            request (Request): The HTTP request object
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
            
        Returns:
            Response: HTTP response with updated notification data
        """
        """Update notification (mainly for marking as read)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Only allow updating is_read field
        if 'is_read' in request.data:
            instance.is_read = request.data['is_read']
            instance.save()
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='mark_read')
    def mark_read(self, request, pk=None):
        """
        Mark a specific notification as read.
        
        Sets the [is_read](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/notifications/models.py#L42-L42) flag to True for the specified notification.
        
        Args:
            request (Request): The HTTP request object
            pk (int): The primary key of the notification
            
        Returns:
            Response: HTTP response with success message
        """
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    
    @action(detail=False, methods=['post'], url_path='mark_all_read')
    def mark_all_read(self, request):
        """
        Mark all notifications as read.
        
        Sets the [is_read](file:///d:/Semester%20Final%20Project/6th%20Sem%20Final%20Project/SewaBazaar/backend/apps/notifications/models.py#L42-L42) flag to True for all unread notifications
        belonging to the authenticated user.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            Response: HTTP response with success message and count
        """
        """Mark all notifications as read"""
        notifications = self.get_queryset().filter(is_read=False)
        count = notifications.update(is_read=True)
        return Response({'message': f'{count} notifications marked as read'})
    
    @action(detail=False, methods=['get'], url_path='unread_count')
    def unread_count(self, request):
        """
        Get count of unread notifications.
        
        Returns the number of unread notifications for the authenticated user.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            Response: HTTP response with unread count
        """
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['delete'], url_path='clear_read')
    def clear_read(self, request):
        """
        Delete all read notifications.
        
        Removes all notifications that have been marked as read by the
        authenticated user.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            Response: HTTP response with success message and count
        """
        """Delete all read notifications"""
        notifications = self.get_queryset().filter(is_read=True)
        count = notifications.count()
        notifications.delete()
        return Response({'message': f'{count} read notifications cleared'})
    
    @action(detail=False, methods=['get', 'patch'], url_path='preferences')
    def preferences(self, request):
        """
        Get or update notification preferences.
        
        Handles both retrieving and updating user notification preferences.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            Response: HTTP response with preference data or updated preferences
        """
        """Get or update notification preferences"""
        user = request.user
        setting, created = UserNotificationSetting.objects.get_or_create(user=user)
        
        if request.method == 'GET':
            serializer = UserNotificationSettingSerializer(setting)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = UserNotificationSettingSerializer(setting, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='stream')
    @method_decorator(csrf_exempt)
    def stream(self, request):
        """
        Server-sent events stream for real-time notifications.
        
        Provides a basic implementation of server-sent events for real-time
        notification updates. In production, this would typically use
        Redis or WebSockets for better performance.
        
        Args:
            request (Request): The HTTP request object
            
        Returns:
            StreamingHttpResponse: HTTP response with event stream
        """
        """Server-sent events stream for real-time notifications"""
        def event_stream():
            # This is a basic implementation
            # In production, you'd want to use Redis/WebSockets for real-time updates
            while True:
                # Check for new notifications
                latest_notification = self.get_queryset().filter(is_read=False).first()
                if latest_notification:
                    data = NotificationSerializer(latest_notification).data
                    yield f"data: {json.dumps(data)}\n\n"
                
                time.sleep(5)  # Check every 5 seconds
        
        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        return response