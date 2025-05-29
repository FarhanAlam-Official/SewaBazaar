from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import City, ServiceCategory, Service, ServiceImage, ServiceAvailability, Favorite
from .serializers import (
    CitySerializer, ServiceCategorySerializer, ServiceSerializer,
    ServiceDetailSerializer, ServiceImageSerializer, ServiceAvailabilitySerializer,
    FavoriteSerializer
)
from .filters import ServiceFilter
from apps.common.permissions import IsProvider, IsAdmin, IsOwnerOrAdmin
from django.db.models import Q

class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.filter(is_active=True)
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'region']

class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'provider']
    search_fields = ['title', 'description', 'category__title']
    ordering_fields = ['created_at', 'price', 'average_rating']
    lookup_field = 'slug'
    
    def get_queryset(self):
        queryset = Service.objects.all()
        
        # Filter by status for non-admin users
        user = self.request.user
        if not user.is_authenticated or user.role != 'admin':
            queryset = queryset.filter(status='active')
            
        # Filter by provider for provider users
        if user.is_authenticated and user.role == 'provider':
            if self.action in ['list', 'retrieve']:
                # Allow providers to see all active services and their own services
                queryset = queryset.filter(Q(status='active') | Q(provider=user))
            else:
                # For other actions (create, update, delete), only allow access to own services
                queryset = queryset.filter(provider=user)
                
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsProvider | IsAdmin]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ServiceDetailSerializer
        return ServiceSerializer
    
    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrAdmin])
    def add_image(self, request, slug=None):
        service = self.get_object()
        serializer = ServiceImageSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(service=service)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrAdmin])
    def add_availability(self, request, slug=None):
        service = self.get_object()
        serializer = ServiceAvailabilitySerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(service=service)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_services(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        queryset = Service.objects.filter(provider=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        queryset = Service.objects.filter(status='active', is_featured=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        service_id = request.data.get('service')
        if not service_id:
            return Response(
                {"detail": "Service ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            service = Service.objects.get(id=service_id)
            favorite = Favorite.objects.filter(user=request.user, service=service)
            
            if favorite.exists():
                favorite.delete()
                return Response({"status": "unfavorited"})
            else:
                Favorite.objects.create(user=request.user, service=service)
                return Response({"status": "favorited"})
                
        except Service.DoesNotExist:
            return Response(
                {"detail": "Service not found"},
                status=status.HTTP_404_NOT_FOUND
            )
