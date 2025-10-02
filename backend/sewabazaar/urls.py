from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="SewaBazaar API",
        default_version='v1',
        description="API for SewaBazaar - Local Services Marketplace",
        terms_of_service="https://www.sewabazaar.com/terms/",
        contact=openapi.Contact(email="contact@sewabazaar.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# Redirect root URL to Swagger documentation
def redirect_to_swagger(request):
    return redirect('schema-swagger-ui')

urlpatterns = [
    # Root URL redirect
    path('', redirect_to_swagger),
    
    # Admin and API URLs
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/rewards/', include('apps.rewards.urls')),  # Phase 1: Rewards API
    path('api/contact/', include('apps.contact.urls')),  # Contact form messages
    
    # API documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
