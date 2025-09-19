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
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Handle anonymous users during schema generation
        if not user.is_authenticated:
            return Notification.objects.none()
        
        # Filter by provider role for provider notifications
        if hasattr(user, 'provider_profile'):
            return Notification.objects.filter(user=user)
        
        return Notification.objects.filter(user=user)
    
    def list(self, request, *args, **kwargs):
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
    
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        notifications = self.get_queryset().filter(is_read=False)
        count = notifications.update(is_read=True)
        return Response({'message': f'{count} notifications marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['get', 'patch'], url_path='preferences')
    def preferences(self, request):
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
