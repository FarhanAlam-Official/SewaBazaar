import django_filters
from .models import Service

class ServiceFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__slug')
    city = django_filters.NumberFilter(field_name='cities__id')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    provider = django_filters.NumberFilter(field_name='provider__id')
    
    class Meta:
        model = Service
        fields = ['category', 'city', 'min_price', 'max_price', 'provider']
