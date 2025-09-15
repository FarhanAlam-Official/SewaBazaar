# Deployment and Rollback Guide - Phase 1 & 2

## Overview

This guide provides comprehensive procedures for deploying Phase 1 and Phase 2 implementations with safe rollback mechanisms to ensure system stability and backward compatibility.

## Pre-Deployment Checklist

### 1. Environment Preparation

#### 1.1 Development Environment

```bash
# Verify development environment
cd backend
python manage.py check --deploy
python manage.py test --verbosity=2

cd ../frontend
npm run build
npm test -- --coverage --watchAll=false
npm run lint
```

#### 1.2 Staging Environment Setup

```bash
# Set up staging environment
export DJANGO_SETTINGS_MODULE=sewabazaar.settings.staging
export NODE_ENV=staging

# Database backup
pg_dump sewabazaar_staging > backup_pre_deployment_$(date +%Y%m%d_%H%M%S).sql

# Verify staging environment
python manage.py migrate --dry-run
python manage.py collectstatic --dry-run
```

#### 1.3 Production Environment Preparation

```bash
# Production environment checks
export DJANGO_SETTINGS_MODULE=sewabazaar.settings.production
export NODE_ENV=production

# Create production backup
pg_dump sewabazaar_production > backup_production_$(date +%Y%m%d_%H%M%S).sql

# Verify production readiness
python manage.py check --deploy --settings=sewabazaar.settings.production
```

### 2. Feature Flag Configuration

#### 2.1 Backend Feature Flags

```python
# backend/sewabazaar/settings/base.py
FEATURE_FLAGS = {
    # Phase 1 Features
    'NEW_BOOKING_WIZARD': os.getenv('ENABLE_NEW_BOOKING_WIZARD', 'false').lower() == 'true',
    'PAYMENT_INTEGRATION': os.getenv('ENABLE_PAYMENT_INTEGRATION', 'false').lower() == 'true',
    'BOOKING_SLOTS': os.getenv('ENABLE_BOOKING_SLOTS', 'false').lower() == 'true',
    'ENHANCED_BOOKING_API': os.getenv('ENABLE_ENHANCED_BOOKING_API', 'false').lower() == 'true',
    
    # Phase 2 Features
    'ENHANCED_PROVIDER_PROFILES': os.getenv('ENABLE_ENHANCED_PROVIDER_PROFILES', 'false').lower() == 'true',
    'ADVANCED_SEARCH': os.getenv('ENABLE_ADVANCED_SEARCH', 'false').lower() == 'true',
    'PROVIDER_PORTFOLIO': os.getenv('ENABLE_PROVIDER_PORTFOLIO', 'false').lower() == 'true',
    'RECOMMENDATION_ENGINE': os.getenv('ENABLE_RECOMMENDATION_ENGINE', 'false').lower() == 'true',
}
```

#### 2.2 Frontend Feature Flags

```typescript
// frontend/src/config/features.ts
export const FEATURES = {
  // Phase 1 Features
  NEW_BOOKING_WIZARD: process.env.NEXT_PUBLIC_NEW_BOOKING_WIZARD === 'true',
  PAYMENT_INTEGRATION: process.env.NEXT_PUBLIC_PAYMENT_INTEGRATION === 'true',
  BOOKING_SLOTS: process.env.NEXT_PUBLIC_BOOKING_SLOTS === 'true',
  
  // Phase 2 Features
  ENHANCED_PROVIDER_PROFILES: process.env.NEXT_PUBLIC_ENHANCED_PROVIDER_PROFILES === 'true',
  ADVANCED_SEARCH: process.env.NEXT_PUBLIC_ADVANCED_SEARCH === 'true',
  PROVIDER_PORTFOLIO: process.env.NEXT_PUBLIC_PROVIDER_PORTFOLIO === 'true',
  RECOMMENDATION_ENGINE: process.env.NEXT_PUBLIC_RECOMMENDATION_ENGINE === 'true',
};
```

## Phase 1 Deployment: Core Booking System

### 1. Database Migration Deployment

#### 1.1 Migration Execution

```bash
#!/bin/bash
# deploy-phase1-migrations.sh

echo "Starting Phase 1 database migrations..."

# Backup current database
pg_dump sewabazaar_production > backup_before_phase1_$(date +%Y%m%d_%H%M%S).sql

# Run migrations with dry-run first
python manage.py migrate --dry-run --verbosity=2

# Confirm migration execution
read -p "Proceed with migrations? (y/N): " confirm
if [[ $confirm == [yY] ]]; then
    # Execute migrations
    python manage.py migrate --verbosity=2
    
    # Verify migration success
    python manage.py showmigrations
    
    echo "Phase 1 migrations completed successfully!"
else
    echo "Migration cancelled."
    exit 1
fi
```

#### 1.2 Data Migration Verification

```python
# management/commands/verify_phase1_migration.py
from django.core.management.base import BaseCommand
from apps.bookings.models import Booking, PaymentMethod

class Command(BaseCommand):
    help = 'Verify Phase 1 migration data integrity'
    
    def handle(self, *args, **options):
        """
        Verify Phase 1 migration data integrity
        
        Purpose: Ensure all existing data is preserved and new fields have correct defaults
        Expected: All existing bookings have proper default values for new fields
        """
        
        # Check existing bookings have default values
        bookings_without_step = Booking.objects.filter(booking_step__isnull=True)
        if bookings_without_step.exists():
            self.stdout.write(
                self.style.ERROR(f'Found {bookings_without_step.count()} bookings without booking_step')
            )
            return
        
        # Check default payment methods exist
        if not PaymentMethod.objects.exists():
            self.stdout.write(
                self.style.ERROR('No default payment methods found')
            )
            return
        
        # Verify booking step defaults
        completed_bookings = Booking.objects.filter(booking_step='completed').count()
        total_bookings = Booking.objects.count()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Migration verification successful: {completed_bookings}/{total_bookings} bookings have correct defaults'
            )
        )
```

### 2. Backend Deployment

#### 2.1 Backend Code Deployment

```bash
#!/bin/bash
# deploy-phase1-backend.sh

echo "Deploying Phase 1 backend changes..."

# Pull latest code
git pull origin main

# Install new dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run additional setup commands
python manage.py create_default_payment_methods
python manage.py update_booking_slots

# Restart backend services
sudo systemctl restart sewabazaar-backend
sudo systemctl restart sewabazaar-worker  # If using Celery

# Verify deployment
python manage.py health_check

echo "Phase 1 backend deployment completed!"
```

#### 2.2 API Endpoint Verification

```bash
#!/bin/bash
# verify-phase1-api.sh

echo "Verifying Phase 1 API endpoints..."

# Test existing endpoints still work
curl -X GET "http://localhost:8000/api/bookings/" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:8000/api/services/" -H "Authorization: Bearer $TOKEN"

# Test new endpoints
curl -X GET "http://localhost:8000/api/bookings/wizard/available-slots/?service_id=1&date=2024-02-01" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:8000/api/payment-methods/" -H "Authorization: Bearer $TOKEN"

echo "API verification completed!"
```

### 3. Frontend Deployment

#### 3.1 Frontend Build and Deployment

```bash
#!/bin/bash
# deploy-phase1-frontend.sh

echo "Deploying Phase 1 frontend changes..."

# Install new dependencies
npm install

# Run tests
npm test -- --coverage --watchAll=false

# Build production bundle
npm run build

# Deploy to production
npm run deploy:production

# Verify deployment
curl -I "https://sewabazaar.com"

echo "Phase 1 frontend deployment completed!"
```

#### 3.2 Feature Flag Gradual Rollout

```bash
#!/bin/bash
# gradual-rollout-phase1.sh

echo "Starting gradual rollout of Phase 1 features..."

# Stage 1: Enable for 10% of users
export NEXT_PUBLIC_NEW_BOOKING_WIZARD_PERCENTAGE=10
export NEXT_PUBLIC_PAYMENT_INTEGRATION_PERCENTAGE=10

# Deploy with limited rollout
npm run deploy:production

# Monitor for 24 hours
sleep 86400

# Stage 2: Enable for 50% of users
export NEXT_PUBLIC_NEW_BOOKING_WIZARD_PERCENTAGE=50
export NEXT_PUBLIC_PAYMENT_INTEGRATION_PERCENTAGE=50

# Deploy with increased rollout
npm run deploy:production

# Monitor for 24 hours
sleep 86400

# Stage 3: Enable for 100% of users
export NEXT_PUBLIC_NEW_BOOKING_WIZARD=true
export NEXT_PUBLIC_PAYMENT_INTEGRATION=true

# Full deployment
npm run deploy:production

echo "Phase 1 gradual rollout completed!"
```

## Phase 2 Deployment: Provider Profiles & Discovery

### 1. Database Migration Deployment

#### 1.1 Phase 2 Migration Execution

```bash
#!/bin/bash
# deploy-phase2-migrations.sh

echo "Starting Phase 2 database migrations..."

# Backup current database
pg_dump sewabazaar_production > backup_before_phase2_$(date +%Y%m%d_%H%M%S).sql

# Run Phase 2 migrations
python manage.py migrate --verbosity=2

# Create search indexes
python manage.py create_search_indexes

# Populate provider stats
python manage.py populate_provider_stats

echo "Phase 2 migrations completed successfully!"
```

#### 2.2 Search Index Creation

```python
# management/commands/create_search_indexes.py
from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Create search indexes for Phase 2'
    
    def handle(self, *args, **options):
        """
        Create database indexes for improved search performance
        
        Purpose: Optimize search queries for Phase 2 features
        Expected: Search performance improved significantly
        """
        
        with connection.cursor() as cursor:
            # Create indexes for service search
            cursor.execute("""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_search 
                ON services_service USING GIN (to_tsvector('english', title || ' ' || description));
            """)
            
            # Create indexes for provider search
            cursor.execute("""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_provider_search 
                ON accounts_profile USING GIN (to_tsvector('english', bio || ' ' || specializations));
            """)
            
            # Create composite indexes for filtering
            cursor.execute("""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_filters 
                ON services_service (category_id, average_rating, price, status);
            """)
        
        self.stdout.write(self.style.SUCCESS('Search indexes created successfully'))
```

### 2. Backend Deployment

#### 2.1 Phase 2 Backend Deployment

```bash
#!/bin/bash
# deploy-phase2-backend.sh

echo "Deploying Phase 2 backend changes..."

# Deploy new models and APIs
python manage.py migrate
python manage.py collectstatic --noinput

# Set up search functionality
python manage.py create_search_indexes
python manage.py update_search_weights

# Restart services
sudo systemctl restart sewabazaar-backend

# Verify Phase 2 endpoints
curl -X GET "http://localhost:8000/api/providers/1/portfolio/" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:8000/api/services/search/advanced/" -H "Authorization: Bearer $TOKEN"

echo "Phase 2 backend deployment completed!"
```

### 3. Frontend Deployment

#### 3.1 Phase 2 Frontend Deployment

```bash
#!/bin/bash
# deploy-phase2-frontend.sh

echo "Deploying Phase 2 frontend changes..."

# Build with Phase 2 features
export NEXT_PUBLIC_ENHANCED_PROVIDER_PROFILES=true
export NEXT_PUBLIC_ADVANCED_SEARCH=true

npm run build
npm run deploy:production

echo "Phase 2 frontend deployment completed!"
```

## Monitoring and Health Checks

### 1. System Health Monitoring

#### 1.1 Health Check Script

```python
# management/commands/health_check.py
from django.core.management.base import BaseCommand
from django.db import connection
from apps.bookings.models import Booking, Payment
from apps.services.models import Service

class Command(BaseCommand):
    help = 'Comprehensive system health check'
    
    def handle(self, *args, **options):
        """
        Perform comprehensive system health check
        
        Purpose: Verify all systems are functioning correctly after deployment
        Expected: All checks pass successfully
        """
        
        checks_passed = 0
        total_checks = 0
        
        # Database connectivity check
        total_checks += 1
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS('✓ Database connectivity'))
            checks_passed += 1
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Database connectivity: {e}'))
        
        # Model integrity check
        total_checks += 1
        try:
            Booking.objects.count()
            Service.objects.count()
            self.stdout.write(self.style.SUCCESS('✓ Model integrity'))
            checks_passed += 1
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Model integrity: {e}'))
        
        # API endpoint check
        total_checks += 1
        try:
            from django.test import Client
            client = Client()
            response = client.get('/api/health/')
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✓ API endpoints'))
                checks_passed += 1
            else:
                self.stdout.write(self.style.ERROR(f'✗ API endpoints: Status {response.status_code}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ API endpoints: {e}'))
        
        # Feature flag check
        total_checks += 1
        try:
            from django.conf import settings
            feature_flags = getattr(settings, 'FEATURE_FLAGS', {})
            self.stdout.write(self.style.SUCCESS(f'✓ Feature flags: {len(feature_flags)} configured'))
            checks_passed += 1
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Feature flags: {e}'))
        
        # Summary
        if checks_passed == total_checks:
            self.stdout.write(self.style.SUCCESS(f'\n✓ All {total_checks} health checks passed!'))
        else:
            self.stdout.write(self.style.ERROR(f'\n✗ {checks_passed}/{total_checks} health checks passed'))
```

#### 1.2 Performance Monitoring

```bash
#!/bin/bash
# monitor-performance.sh

echo "Starting performance monitoring..."

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/api/services/"
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/api/bookings/"

# Monitor database performance
psql -d sewabazaar_production -c "
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY n_distinct DESC;
"

# Monitor memory usage
free -h
ps aux --sort=-%mem | head -10

echo "Performance monitoring completed!"
```

## Rollback Procedures

### 1. Emergency Rollback

#### 1.1 Immediate Rollback Script

```bash
#!/bin/bash
# emergency-rollback.sh

echo "EMERGENCY ROLLBACK INITIATED"

# Disable all new features immediately
export ENABLE_NEW_BOOKING_WIZARD=false
export ENABLE_PAYMENT_INTEGRATION=false
export ENABLE_ENHANCED_PROVIDER_PROFILES=false
export ENABLE_ADVANCED_SEARCH=false

export NEXT_PUBLIC_NEW_BOOKING_WIZARD=false
export NEXT_PUBLIC_PAYMENT_INTEGRATION=false
export NEXT_PUBLIC_ENHANCED_PROVIDER_PROFILES=false
export NEXT_PUBLIC_ADVANCED_SEARCH=false

# Restart services with disabled features
sudo systemctl restart sewabazaar-backend
sudo systemctl restart sewabazaar-frontend

# Verify rollback
python manage.py health_check

echo "Emergency rollback completed. System reverted to previous state."
```

### 2. Phase 1 Rollback

#### 2.1 Phase 1 Database Rollback

```bash
#!/bin/bash
# rollback-phase1-database.sh

echo "Rolling back Phase 1 database changes..."

# Confirm rollback
read -p "This will rollback Phase 1 database changes. Continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Rollback cancelled."
    exit 1
fi

# Backup current state before rollback
pg_dump sewabazaar_production > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Rollback migrations
python manage.py migrate bookings 0001_initial
python manage.py migrate accounts 0002_previous_migration

# Verify rollback
python manage.py showmigrations

echo "Phase 1 database rollback completed!"
```

#### 2.2 Phase 1 Code Rollback

```bash
#!/bin/bash
# rollback-phase1-code.sh

echo "Rolling back Phase 1 code changes..."

# Checkout previous stable version
git checkout tags/v1.0.0

# Reinstall dependencies
pip install -r requirements.txt
npm install

# Rebuild and deploy
npm run build
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart sewabazaar-backend
sudo systemctl restart sewabazaar-frontend

echo "Phase 1 code rollback completed!"
```

### 3. Phase 2 Rollback

#### 3.1 Phase 2 Database Rollback

```bash
#!/bin/bash
# rollback-phase2-database.sh

echo "Rolling back Phase 2 database changes..."

# Rollback Phase 2 migrations
python manage.py migrate accounts 0003_phase1_complete
python manage.py migrate services 0003_phase1_complete

# Remove search indexes
python manage.py remove_search_indexes

echo "Phase 2 database rollback completed!"
```

#### 3.2 Selective Feature Rollback

```bash
#!/bin/bash
# selective-rollback.sh

echo "Performing selective feature rollback..."

# Rollback specific features based on issues
case $1 in
    "booking-wizard")
        export ENABLE_NEW_BOOKING_WIZARD=false
        export NEXT_PUBLIC_NEW_BOOKING_WIZARD=false
        ;;
    "payment")
        export ENABLE_PAYMENT_INTEGRATION=false
        export NEXT_PUBLIC_PAYMENT_INTEGRATION=false
        ;;
    "search")
        export ENABLE_ADVANCED_SEARCH=false
        export NEXT_PUBLIC_ADVANCED_SEARCH=false
        ;;
    "provider-profiles")
        export ENABLE_ENHANCED_PROVIDER_PROFILES=false
        export NEXT_PUBLIC_ENHANCED_PROVIDER_PROFILES=false
        ;;
    *)
        echo "Usage: $0 {booking-wizard|payment|search|provider-profiles}"
        exit 1
        ;;
esac

# Restart services
sudo systemctl restart sewabazaar-backend
sudo systemctl restart sewabazaar-frontend

echo "Selective rollback of $1 completed!"
```

## Post-Deployment Verification

### 1. Functionality Verification

#### 1.1 End-to-End Testing

```bash
#!/bin/bash
# post-deployment-verification.sh

echo "Starting post-deployment verification..."

# Run critical path tests
npm run test:e2e:critical

# Test existing functionality
python manage.py test --tag=regression --verbosity=2

# Test new functionality
python manage.py test --tag=phase1 --tag=phase2 --verbosity=2

# Performance verification
python manage.py test --tag=performance

echo "Post-deployment verification completed!"
```

#### 1.2 User Acceptance Testing

```bash
#!/bin/bash
# user-acceptance-testing.sh

echo "Preparing for user acceptance testing..."

# Create test accounts
python manage.py create_test_users

# Set up test data
python manage.py load_test_data

# Generate test scenarios
python manage.py generate_test_scenarios

echo "User acceptance testing environment ready!"
```

### 2. Monitoring Setup

#### 2.1 Error Monitoring

```python
# monitoring/error_tracking.py
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class DeploymentMonitor:
    """
    Monitor deployment health and send alerts
    
    Purpose: Detect issues early and alert administrators
    Impact: Critical for maintaining system stability
    """
    
    @staticmethod
    def check_error_rates():
        """Monitor error rates and send alerts if threshold exceeded"""
        # Implementation for error rate monitoring
        pass
    
    @staticmethod
    def check_performance_metrics():
        """Monitor performance metrics and alert on degradation"""
        # Implementation for performance monitoring
        pass
    
    @staticmethod
    def send_deployment_alert(message, level='INFO'):
        """Send deployment alerts to administrators"""
        if level == 'CRITICAL':
            send_mail(
                'CRITICAL: SewaBazaar Deployment Alert',
                message,
                settings.DEFAULT_FROM_EMAIL,
                settings.ADMIN_EMAILS,
                fail_silently=False,
            )
```

## Documentation Updates

### 1. API Documentation Update

```bash
#!/bin/bash
# update-api-docs.sh

echo "Updating API documentation..."

# Generate new API documentation
python manage.py generate_api_docs

# Update OpenAPI schema
python manage.py spectacular --file schema.yml

# Deploy documentation
npm run docs:deploy

echo "API documentation updated!"
```

### 2. User Documentation Update

```bash
#!/bin/bash
# update-user-docs.sh

echo "Updating user documentation..."

# Update user guides
python manage.py update_user_guides

# Generate feature documentation
python manage.py generate_feature_docs

# Update help system
npm run help:update

echo "User documentation updated!"
```

This comprehensive deployment and rollback guide ensures safe, monitored deployment of Phase 1 and Phase 2 features with the ability to quickly revert changes if issues arise, maintaining system stability and user experience throughout the process.
