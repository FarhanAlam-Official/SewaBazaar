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
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.filter(is_active=True)
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'region']

class ServiceCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceCategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        """
        Return different querysets based on the action
        """
        if self.action in ['list', 'retrieve']:
            return ServiceCategory.objects.filter(is_active=True)
        else:
            # For create, update, delete operations, use all categories
            return ServiceCategory.objects.all()
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

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
        queryset = Service.objects.select_related('category', 'provider').prefetch_related('cities', 'images')
        
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
                # Tokenize search into words and ensure all terms are matched across any of the fields
                terms = [t for t in search.split() if t]
                for term in terms:
                    term_query = (
                        Q(title__icontains=term) |
                        Q(description__icontains=term) |
                        Q(slug__icontains=term) |
                        Q(category__title__icontains=term) |
                        Q(cities__name__icontains=term) |
                        Q(cities__region__icontains=term) |
                        Q(provider__first_name__icontains=term) |
                        Q(provider__last_name__icontains=term) |
                        Q(provider__email__icontains=term)
                    )
                    try:
                        term_query = term_query | Q(tags__icontains=term)
                    except Exception:
                        pass
                    queryset = queryset.filter(term_query)
            
            # Category filter
            category = self.request.query_params.get('category', None)
            if category and category.strip():
                queryset = queryset.filter(category__title__icontains=category.strip())
            
            # City filter
            city = self.request.query_params.get('city', None)
            if city and city.strip():
                queryset = queryset.filter(cities__name__icontains=city.strip())
            
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
    
    def partial_update(self, request, *args, **kwargs):
        """Restrict providers from activating services that are pending review or draft.
        Only admins can move a service to active from pending/draft.
        Providers may toggle between active and inactive only when the current status is not pending.
        """
        instance = self.get_object()
        user = request.user
        requested_status = request.data.get('status')

        if user.is_authenticated and getattr(user, 'role', None) == 'provider' and requested_status is not None:
            # Prevent provider from setting active when service is pending or draft
            if requested_status == 'active' and instance.status in ['pending', 'draft']:
                return Response(
                    {"detail": "Only admins can activate services awaiting review."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Prevent provider from changing out of pending (other than admin flow)
            if instance.status == 'pending' and requested_status != 'pending':
                return Response(
                    {"detail": "Service is pending review and cannot be modified by provider."},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().partial_update(request, *args, **kwargs)
    
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
        
        # Handle the image upload with proper context
        serializer = ServiceImageSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Set the service and save
            image_instance = serializer.save(service=service)
            
            # Return the serialized data with proper image URL
            response_serializer = ServiceImageSerializer(image_instance, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch', 'delete'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrAdmin], url_path='images/(?P<image_id>[^/.]+)')
    def manage_image(self, request, slug=None, image_id=None):
        """Update or delete a specific service image"""
        service = self.get_object()
        
        try:
            image = service.images.get(id=image_id)
        except ServiceImage.DoesNotExist:
            return Response({"detail": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'PATCH':
            # Handle featured image logic
            if 'is_featured' in request.data and request.data['is_featured']:
                # Clear other featured images for this service
                service.images.update(is_featured=False)
            
            serializer = ServiceImageSerializer(image, data=request.data, partial=True, context={'request': request})
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            # Check if this is the featured image and there are other images
            if image.is_featured and service.images.count() > 1:
                # Set the next image as featured
                next_image = service.images.exclude(id=image_id).first()
                if next_image:
                    next_image.is_featured = True
                    next_image.save()
            
            image.delete()
            return Response({"detail": "Image deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

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
    def provider_services(self, request):
        """
        NEW ENDPOINT: Alias for my_services to match frontend expectations
        
        GET /api/services/provider_services/
        """
        return self.my_services(request)
    
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
