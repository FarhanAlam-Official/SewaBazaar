import os
from pathlib import Path
from datetime import timedelta
import dj_database_url
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-key-for-development-only')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')

# Application definition
INSTALLED_APPS = [
    'unfold',  # Modern Django admin theme
    'unfold.contrib.filters',  # Optional Unfold features
    'unfold.contrib.forms',    # Optional Unfold features
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_yasg',
    'storages',
    'django_crontab',  # Django crontab for task scheduling
    'channels',  # WebSocket support
    
    # Local apps
    'apps.accounts.apps.AccountsConfig',
    'apps.services.apps.ServicesConfig',
    'apps.bookings.apps.BookingsConfig',
    'apps.reviews.apps.ReviewsConfig',
    'apps.notifications.apps.NotificationsConfig',
    'apps.common.apps.CommonConfig',
    'apps.rewards.apps.RewardsConfig',  # Phase 1: Core Rewards System
    'apps.contact.apps.ContactConfig',  # Contact form messages
    'apps.messaging.apps.MessagingConfig',  # Phase 1: Contact Provider Feature
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'sewabazaar.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'sewabazaar.wsgi.application'

# ASGI Configuration for WebSocket support
ASGI_APPLICATION = 'sewabazaar.asgi.application'

# Channel Layers for WebSocket
# Using InMemory for development (single server, no Redis needed)
# For production with multiple servers, switch to Redis-based channel layer
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Production Redis configuration (uncomment and install channels-redis==4.2.0):
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels_redis.core.RedisChannelLayer',
#         'CONFIG': {
#             'hosts': [('127.0.0.1', 6379)],
#         },
#     },
# }

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    } if os.environ.get('DEVELOPMENT_MODE', 'False') == 'True' else dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kathmandu'  # Nepal timezone
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Backend URL for development
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

# File Storage Settings
if os.environ.get('USE_SUPABASE_STORAGE') == 'True':
    # Use Supabase for file storage
    DEFAULT_FILE_STORAGE = 'sewabazaar.storage.SupabaseStorage'
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
    SUPABASE_BUCKET = os.environ.get('SUPABASE_BUCKET', 'sewabazaar')
else:
    # Use local file storage
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Earnings/Fees configuration
# Platform fee applied on provider gross earnings (e.g., 0.10 = 10%)
PLATFORM_FEE_RATE = float(os.environ.get('PLATFORM_FEE_RATE', '0'))

# Whether to consider only paid bookings (payment__status='completed') for earnings
EARNINGS_REQUIRE_PAID = os.environ.get('EARNINGS_REQUIRE_PAID', 'true').lower() == 'false'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'sewabazaar.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/hour',    # Increased from 100/day to 1000/hour
        'user': '5000/hour',    # Increased from 1000/day to 5000/hour
        'burst': '100/minute',  # Burst rate for short periods
        'sustained': '1000/hour', # Sustained rate for longer periods
        'voucher_validation': '30/minute',  # Limit voucher validation attempts
        'voucher_redemption': '10/minute',   # Limit voucher redemptions
        
        # NEW: Provider-specific throttling rates
        'provider_dashboard': '1000/hour',    # Provider dashboard data access
        'provider_bookings': '500/hour',      # Provider booking operations
        'provider_earnings': '100/hour',      # Provider financial data access
        'provider_analytics': '200/hour',     # Provider analytics access
        'provider_schedule': '300/hour',      # Provider schedule management
        'provider_customers': '400/hour',     # Provider customer data access
        'provider_services': '200/hour',      # Provider service management
    }
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('JWT_SECRET', SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS settings
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ORIGIN_WHITELIST', 'http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True

# Email settings (Gmail SMTP by default)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
# Allow SSL option (e.g., for port 465)
EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False') == 'True'
# For Gmail, username must be 'istaqalam7@gmail.com' and password is your SMTP key
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'sewabazaar.contact@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'SewaBazaar <noreply@sewabazaar.com>')

# Frontend URL for password reset links
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# PHASE 1 NEW SETTINGS: Khalti Payment Gateway Configuration
# Khalti Sandbox Configuration for Nepal
KHALTI_PUBLIC_KEY = os.environ.get('KHALTI_PUBLIC_KEY', '8b58c9047e584751beaddea7cc632b2c')
KHALTI_SECRET_KEY = os.environ.get('KHALTI_SECRET_KEY', '2d71118e5d26404fb3b1fe1fd386d33a')
KHALTI_BASE_URL = os.environ.get('KHALTI_BASE_URL', 'https://dev.khalti.com/api/v2')

# PHASE 1 NEW SETTINGS: Feature Flags for gradual rollout
FEATURE_FLAGS = {
    # Phase 1 Features
    'NEW_BOOKING_WIZARD': os.getenv('ENABLE_NEW_BOOKING_WIZARD', 'true').lower() == 'true',
    'PAYMENT_INTEGRATION': os.getenv('ENABLE_PAYMENT_INTEGRATION', 'true').lower() == 'true',
    'BOOKING_SLOTS': os.getenv('ENABLE_BOOKING_SLOTS', 'true').lower() == 'true',
    'ENHANCED_BOOKING_API': os.getenv('ENABLE_ENHANCED_BOOKING_API', 'true').lower() == 'true',
    
    # PHASE 2 NEW FEATURES: Public Provider Profiles & Reviews
    'PUBLIC_PROVIDER_PROFILE': os.getenv('ENABLE_PUBLIC_PROVIDER_PROFILE', 'true').lower() == 'true',
    'REVIEWS_SYSTEM': os.getenv('ENABLE_REVIEWS_SYSTEM', 'true').lower() == 'true',
    'PROVIDER_PORTFOLIO': os.getenv('ENABLE_PROVIDER_PORTFOLIO', 'true').lower() == 'true',
    
    # Phase 2 Features (for future use)
    'ENHANCED_PROVIDER_PROFILES': os.getenv('ENABLE_ENHANCED_PROVIDER_PROFILES', 'false').lower() == 'true',
    'ADVANCED_SEARCH': os.getenv('ENABLE_ADVANCED_SEARCH', 'false').lower() == 'true',
    'RECOMMENDATION_ENGINE': os.getenv('ENABLE_RECOMMENDATION_ENGINE', 'false').lower() == 'true',
}

# PHASE 1 NEW SETTINGS: Logging configuration for payment processing
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'sewabazaar.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'apps.bookings.services': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)

# Django Crontab Configuration for scheduled tasks
CRONJOBS = [
    # Daily booking slot maintenance - cleanup expired and generate new slots
    ('0 2 * * *', 'django.core.management.call_command', ['maintain_booking_slots'], {
        'verbosity': 1,
    }),
    
    # Weekly extended slot generation (45 days ahead) - Sundays at 3 AM
    ('0 3 * * 0', 'django.core.management.call_command', ['maintain_booking_slots'], {
        'days_ahead': 45,
        'verbosity': 1,
    }),
    
    # Auto-cancel expired bookings - Daily at 5 AM
    ('0 5 * * *', 'django.core.management.call_command', ['auto_cancel_expired_bookings'], {
        'grace_period': 1,
        'verbosity': 1,
    }),
]

# Crontab configuration 
CRONTAB_LOCK_JOBS = True  # Prevent overlapping maintenance jobs
CRONTAB_COMMAND_PREFIX = f'DJANGO_SETTINGS_MODULE=sewabazaar.settings'

# === CACHING CONFIGURATION ===
# Local memory cache for provider dashboard analytics and performance optimization

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'sewabazaar-cache',
        'TIMEOUT': 300,  # Default timeout of 5 minutes
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# Cache timeout settings for different data types
CACHE_TIMEOUTS = {
    'PROVIDER_STATISTICS': 60 * 15,  # 15 minutes
    'PROVIDER_ANALYTICS': 60 * 30,   # 30 minutes
    'SERVICE_PERFORMANCE': 60 * 10,  # 10 minutes
    'DASHBOARD_DATA': 60 * 5,        # 5 minutes
}

# Session engine to use Redis for sessions as well
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'