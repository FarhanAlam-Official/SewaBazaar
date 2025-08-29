from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CityViewSet, ServiceCategoryViewSet, ServiceViewSet, FavoriteViewSet

router = DefaultRouter()
router.register(r'cities', CityViewSet)
router.register(r'categories', ServiceCategoryViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'', ServiceViewSet, basename='service')

urlpatterns = [
    path('', include(router.urls)),
]
