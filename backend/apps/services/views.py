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
from django.db.models import Q, Avg, Count
from django.core.paginator import Paginator
from rest_framework.pagination import PageNumberPagination

class CustomPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

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
    search_fields = ['title', 'description', 'category__title', 'tags']
    ordering_fields = ['created_at', 'price', 'average_rating', 'reviews_count', 'view_count', 'last_activity']
    pagination_class = CustomPagination
    lookup_field = 'slug'
    
    def get_object(self):
        """Override to support both ID and slug lookup"""
        lookup_value = self.kwargs.get(self.lookup_field)
        
        # Try to find by slug first
        try:
            return super().get_object()
        except:
            # If slug lookup fails, try ID lookup
            try:
                return Service.objects.get(id=lookup_value)
            except (Service.DoesNotExist, ValueError):
                # If both fail, raise the original error
                raise
    
    def get_queryset(self):
        queryset = Service.objects.select_related('category', 'provider').prefetch_related('cities')
        
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
        
        # Apply additional filters from query parameters
        queryset = self.apply_advanced_filters(queryset)
        
        return queryset
    
    def apply_advanced_filters(self, queryset):
        """Apply advanced filtering based on query parameters"""
        try:
            # Search filter
            search = self.request.query_params.get('search', None)
            if search and search.strip():
                search = search.strip()
                queryset = queryset.filter(
                    Q(title__icontains=search) |
                    Q(description__icontains=search) |
                    Q(category__title__icontains=search)
                )
                # For JSON tags field, we need to handle it differently
                # Check if any service has tags that contain the search term
                try:
                    # This is a more complex query for JSON fields
                    # For now, let's skip tags search to avoid errors
                    pass
                except Exception as e:
                    # If tags search fails, continue without it
                    pass
            
            # Category filter
            category = self.request.query_params.get('category', None)
            if category and category.strip():
                queryset = queryset.filter(category__title=category.strip())
            
            # City filter
            city = self.request.query_params.get('city', None)
            if city and city.strip():
                queryset = queryset.filter(cities__name=city.strip())
            
            # Price range filter
            min_price = self.request.query_params.get('min_price', None)
            if min_price:
                try:
                    min_price = float(min_price)
                    queryset = queryset.filter(price__gte=min_price)
                except (ValueError, TypeError):
                    pass  # Skip invalid price filter
            
            max_price = self.request.query_params.get('max_price', None)
            if max_price:
                try:
                    max_price = float(max_price)
                    queryset = queryset.filter(price__lte=max_price)
                except (ValueError, TypeError):
                    pass  # Skip invalid price filter
            
            # Rating filter
            min_rating = self.request.query_params.get('min_rating', None)
            if min_rating:
                try:
                    min_rating = float(min_rating)
                    queryset = queryset.filter(average_rating__gte=min_rating)
                except (ValueError, TypeError):
                    pass  # Skip invalid rating filter
            
            # Verified provider filter
            verified_only = self.request.query_params.get('verified_only', None)
            if verified_only == 'true':
                queryset = queryset.filter(is_verified_provider=True)
            
            # Sort by
            sort_by = self.request.query_params.get('sort_by', 'relevance')
            if sort_by == 'rating':
                queryset = queryset.order_by('-average_rating', '-reviews_count')
            elif sort_by == 'price-low':
                queryset = queryset.order_by('price')
            elif sort_by == 'price-high':
                queryset = queryset.order_by('-price')
            elif sort_by == 'reviews':
                queryset = queryset.order_by('-reviews_count')
            elif sort_by == 'newest':
                queryset = queryset.order_by('-created_at')
            elif sort_by == 'relevance':
                # Default sorting: featured first, then by rating and reviews
                queryset = queryset.order_by('-is_featured', '-average_rating', '-reviews_count')
            
            return queryset.distinct()
            
        except Exception as e:
            # Log the error and return the original queryset
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error applying filters: {str(e)}")
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
    
    def list(self, request, *args, **kwargs):
        """Custom list method with enhanced filtering and pagination"""
        queryset = self.get_queryset()
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response_data = self.get_paginated_response(serializer.data)
            
            # Add additional metadata
            response_data.data['total_services'] = queryset.count()
            response_data.data['filtered_count'] = len(page)
            
            return response_data
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
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
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all service categories"""
        categories = ServiceCategory.objects.filter(is_active=True)
        serializer = ServiceCategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def cities(self, request):
        """Get all available cities"""
        cities = City.objects.filter(is_active=True)
        serializer = CitySerializer(cities, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_view(self, request, slug=None):
        """Increment view count for a service"""
        service = self.get_object()
        service.view_count += 1
        service.save(update_fields=['view_count'])
        return Response({"status": "success"})

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination
    
    def get_queryset(self):
        user = self.request.user
        
        # Handle anonymous users during schema generation
        if not user.is_authenticated:
            return Favorite.objects.none()
        
        return Favorite.objects.filter(user=user).select_related('service__category', 'service__provider')
    
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
