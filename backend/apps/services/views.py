from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import City, ServiceCategory, Service, ServiceImage, ServiceAvailability
from .serializers import (
    CitySerializer, ServiceCategorySerializer, ServiceSerializer,
    ServiceDetailSerializer, ServiceImageSerializer, ServiceAvailabilitySerializer
)
from .filters import ServiceFilter
from apps.common.permissions import IsProvider, IsAdmin, IsOwnerOrAdmin

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
    filterset_class = ServiceFilter
    search_fields = ['title', 'description', 'category__title', 'provider__first_name', 'provider__last_name']
    ordering_fields = ['price', 'created_at', 'average_rating']
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
                queryset = queryset.filter(status='active') | queryset.filter(provider=user)
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
