from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CityViewSet, ServiceCategoryViewSet, ServiceViewSet

router = DefaultRouter()
router.register(r'cities', CityViewSet)
router.register(r'categories', ServiceCategoryViewSet)
router.register(r'', ServiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
