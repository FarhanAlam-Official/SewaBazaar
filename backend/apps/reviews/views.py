from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Review
from .serializers import ReviewSerializer
from apps.common.permissions import IsCustomer, IsOwnerOrAdmin
from apps.bookings.models import Booking

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'customer', 'rating']
    ordering_fields = ['created_at', 'rating']
    
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsCustomer]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)
    
    def create(self, request, *args, **kwargs):
        # Check if the user has booked and completed the service
        service_id = request.data.get('service')
        if not service_id:
            return Response(
                {"service": "This field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if the user has a completed booking for this service
        has_completed_booking = Booking.objects.filter(
            customer=request.user,
            service_id=service_id,
            status='completed'
        ).exists()
        
        if not has_completed_booking and not request.user.is_staff:
            return Response(
                {"detail": "You can only review services that you have booked and completed"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def service_reviews(self, request):
        service_id = request.query_params.get('service_id')
        if not service_id:
            return Response(
                {"detail": "service_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        queryset = Review.objects.filter(service_id=service_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
