from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, UserNotificationSetting
from .serializers import NotificationSerializer, UserNotificationSettingSerializer
from apps.common.permissions import IsOwnerOrAdmin

class NotificationViewSet(viewsets.ModelViewSet):  # Changed from ReadOnlyModelViewSet to ModelViewSet
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        # Handle anonymous users during schema generation
        if not user.is_authenticated:
            return Notification.objects.none()
        
        return Notification.objects.filter(user=user)
    
    @action(detail=True, methods=['post'])  # Changed to POST and fixed URL
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})
    
    @action(detail=False, methods=['post'])  # Changed to POST and fixed URL 
    def mark_all_read(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        notifications.update(is_read=True)
        return Response({'status': 'all notifications marked as read'})
    
    @action(detail=False, methods=['delete'])  # New endpoint for clearing read notifications
    def clear_read(self, request):
        deleted_count = self.get_queryset().filter(is_read=True).delete()[0]
        return Response({'status': f'{deleted_count} read notifications cleared'})
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications for dashboard"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    # Note: method name must not be 'settings' to avoid clashing with DRF APIView.settings
    @action(detail=False, methods=['get', 'put'], url_path='settings')
    def notification_settings(self, request):
        user = request.user
        setting, _ = UserNotificationSetting.objects.get_or_create(user=user)
        if request.method == 'GET':
            return Response({'data': UserNotificationSettingSerializer(setting).data})
        serializer = UserNotificationSettingSerializer(setting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'data': serializer.data, 'message': 'Notification settings updated'})
