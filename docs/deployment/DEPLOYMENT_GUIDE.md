# SewaBazaar Deployment Guide

## 🚀 Overview

This comprehensive guide covers deploying SewaBazaar to production environments with safe rollback procedures and monitoring setup.

## 📋 Pre-Deployment Checklist

### 1. Environment Preparation

#### Development Environment Verification

```bash
# Backend checks
cd backend
python manage.py check --deploy
python manage.py test --verbosity=2
python manage.py migrate --dry-run

# Frontend checks
cd frontend
npm run build
npm test -- --coverage --watchAll=false
npm run lint
npm run type-check
```

#### Staging Environment Setup

```bash
# Environment variables
export DJANGO_SETTINGS_MODULE=sewabazaar.settings.staging
export NODE_ENV=staging

# Database backup
pg_dump sewabazaar_staging > backup_pre_deployment_$(date +%Y%m%d_%H%M%S).sql

# Verify staging readiness
python manage.py migrate --dry-run
python manage.py collectstatic --dry-run
```

#### Production Environment Preparation

```bash
# Environment variables
export DJANGO_SETTINGS_MODULE=sewabazaar.settings.production
export NODE_ENV=production

# Critical: Create production backup
pg_dump sewabazaar_production > backup_production_$(date +%Y%m%d_%H%M%S).sql

# Production readiness check
python manage.py check --deploy --settings=sewabazaar.settings.production
```

## 🔧 Feature Flag Configuration

### Backend Feature Flags

```python
# backend/sewabazaar/settings/base.py
FEATURE_FLAGS = {
    # Core Features
    'NEW_BOOKING_WIZARD': os.getenv('ENABLE_NEW_BOOKING_WIZARD', 'false').lower() == 'true',
    'PAYMENT_INTEGRATION': os.getenv('ENABLE_PAYMENT_INTEGRATION', 'false').lower() == 'true',
    'ENHANCED_SEARCH': os.getenv('ENABLE_ENHANCED_SEARCH', 'false').lower() == 'true',
    
    # Provider Features
    'PROVIDER_PORTFOLIO': os.getenv('ENABLE_PROVIDER_PORTFOLIO', 'false').lower() == 'true',
    'ADVANCED_ANALYTICS': os.getenv('ENABLE_ADVANCED_ANALYTICS', 'false').lower() == 'true',
}
```

### Frontend Feature Flags

```typescript
// frontend/src/config/features.ts
export const FEATURES = {
  NEW_BOOKING_WIZARD: process.env.NEXT_PUBLIC_NEW_BOOKING_WIZARD === 'true',
  PAYMENT_INTEGRATION: process.env.NEXT_PUBLIC_PAYMENT_INTEGRATION === 'true',
  ENHANCED_SEARCH: process.env.NEXT_PUBLIC_ENHANCED_SEARCH === 'true',
  PROVIDER_PORTFOLIO: process.env.NEXT_PUBLIC_PROVIDER_PORTFOLIO === 'true',
};
```

## 🗄️ Database Deployment

### Migration Strategy

```bash
#!/bin/bash
# deploy-migrations.sh

echo "Starting database migrations..."

# 1. Backup current database
pg_dump sewabazaar_production > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Dry run migrations
python manage.py migrate --dry-run --verbosity=2

# 3. Confirm migration execution
read -p "Proceed with migrations? (y/N): " confirm
if [[ $confirm == [yY] ]]; then
    # 4. Execute migrations
    python manage.py migrate --verbosity=2
    
    # 5. Verify migration success
    python manage.py showmigrations
    
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration cancelled."
    exit 1
fi
```

### Data Migration Verification

```python
# management/commands/verify_migration.py
from django.core.management.base import BaseCommand
from apps.bookings.models import Booking, PaymentMethod

class Command(BaseCommand):
    help = 'Verify migration data integrity'
    
    def handle(self, *args, **options):
        # Check data integrity
        total_bookings = Booking.objects.count()
        completed_bookings = Booking.objects.filter(
            booking_step='completed'
        ).count()
        
        if not PaymentMethod.objects.exists():
            self.stdout.write(
                self.style.ERROR('❌ No payment methods found')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Migration verified: {completed_bookings}/{total_bookings} bookings migrated'
            )
        )
```

## 🔧 Backend Deployment

### Django Application Deployment

```bash
#!/bin/bash
# deploy-backend.sh

echo "🚀 Deploying backend..."

# 1. Pull latest code
git pull origin main

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install/update dependencies
pip install -r requirements.txt

# 4. Collect static files
python manage.py collectstatic --noinput

# 5. Run database migrations
python manage.py migrate

# 6. Create default data (if needed)
python manage.py create_default_payment_methods

# 7. Restart services
sudo systemctl restart sewabazaar-backend
sudo systemctl restart sewabazaar-worker  # If using Celery

# 8. Verify deployment
python manage.py health_check

echo "✅ Backend deployment completed!"
```

### API Endpoint Verification

```bash
#!/bin/bash
# verify-api.sh

echo "🔍 Verifying API endpoints..."

BASE_URL="https://your-domain.com/api"

# Test core endpoints
endpoints=(
    "/services/"
    "/bookings/"
    "/accounts/profile/"
    "/health/"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    if [ "$response" == "200" ] || [ "$response" == "401" ]; then
        echo "✅ $endpoint - OK ($response)"
    else
        echo "❌ $endpoint - FAILED ($response)"
    fi
done
```

## 🎨 Frontend Deployment

### Next.js Application Deployment

```bash
#!/bin/bash
# deploy-frontend.sh

echo "🎨 Deploying frontend..."

# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm ci

# 3. Build application
npm run build

# 4. Run tests (optional in production)
npm run test:ci

# 5. Start application (or restart PM2)
pm2 restart sewabazaar-frontend

# 6. Verify deployment
curl -f http://localhost:3000/health || exit 1

echo "✅ Frontend deployment completed!"
```

### Build Verification

```bash
# Check build output
npm run build

# Verify static assets
ls -la .next/static/

# Test production build locally
npm start
```

## 🔄 Rollback Procedures

### Database Rollback

```bash
#!/bin/bash
# rollback-database.sh

echo "⚠️ Rolling back database..."

# 1. Stop application services
sudo systemctl stop sewabazaar-backend
sudo systemctl stop sewabazaar-frontend

# 2. Restore database from backup
read -p "Enter backup file name: " backup_file
psql sewabazaar_production < "$backup_file"

# 3. Restart services
sudo systemctl start sewabazaar-backend
sudo systemctl start sewabazaar-frontend

echo "✅ Database rollback completed!"
```

### Application Rollback

```bash
#!/bin/bash
# rollback-application.sh

echo "⚠️ Rolling back application..."

# 1. Get previous commit hash
previous_commit=$(git log --oneline -n 2 | tail -1 | cut -d' ' -f1)

# 2. Rollback to previous commit
git checkout "$previous_commit"

# 3. Redeploy
./deploy-backend.sh
./deploy-frontend.sh

echo "✅ Application rollback completed!"
```

## 📊 Environment Configuration

### Production Environment Variables

#### Backend (.env)

```env
# Django
DEBUG=False
SECRET_KEY=your-super-secret-production-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Cache
REDIS_URL=redis://localhost:6379/1

# Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-s3-bucket

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Payment
KHALTI_PUBLIC_KEY=your-khalti-public-key
KHALTI_SECRET_KEY=your-khalti-secret-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

#### Frontend (.env.production)

```env
# API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Feature Flags
NEXT_PUBLIC_NEW_BOOKING_WIZARD=true
NEXT_PUBLIC_PAYMENT_INTEGRATION=true

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-frontend-sentry-dsn
```

## 🔒 Security Configuration

### SSL/TLS Setup

```nginx
# nginx configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Backend proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Firewall Configuration

```bash
# UFW firewall setup
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 8000   # Block direct backend access
sudo ufw deny 3000   # Block direct frontend access
```

## 📈 Performance Optimization

### Database Optimization

```python
# settings/production.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sewabazaar_production',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'OPTIONS': {
                'MAX_CONNS': 20,
            }
        }
    }
}

# Connection pooling
CONN_MAX_AGE = 60
```

### Caching Configuration

```python
# Redis caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Cache settings
CACHE_TTL = 60 * 15  # 15 minutes
```

### CDN Configuration

```javascript
// next.config.js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.yourdomain.com' 
    : '',
  
  images: {
    domains: ['cdn.yourdomain.com'],
    loader: 'custom'
  }
}
```

## 📊 Monitoring & Health Checks

### Application Health Checks

```python
# backend/apps/health/views.py
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        # Check database
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
```

### Monitoring Setup

```bash
# Install monitoring tools
pip install sentry-sdk
npm install @sentry/nextjs

# Setup log rotation
sudo logrotate -f /etc/logrotate.d/sewabazaar
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. Database Connection Issues

```bash
# Check database connectivity
pg_isready -h localhost -p 5432

# Check database credentials
psql -h localhost -U username -d database_name
```

#### 2. Static Files Not Loading

```bash
# Collect static files
python manage.py collectstatic --clear

# Check nginx static file serving
nginx -t && sudo systemctl reload nginx
```

#### 3. Frontend Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 4. Memory Issues

```bash
# Check memory usage
free -h
htop

# Restart services if needed
sudo systemctl restart sewabazaar-backend
```

## 📋 Post-Deployment Verification

### Verification Checklist

- [ ] Application loads successfully
- [ ] Database connectivity works
- [ ] API endpoints respond correctly
- [ ] User authentication functions
- [ ] Payment integration works (in sandbox)
- [ ] Email notifications work
- [ ] Static files serve correctly
- [ ] SSL certificate is valid
- [ ] Monitoring alerts are active

### Performance Testing

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/

# API endpoint testing
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/services/
```

## 📞 Emergency Procedures

### Emergency Rollback

```bash
# Quick rollback script
#!/bin/bash
echo "🚨 EMERGENCY ROLLBACK"
git checkout HEAD~1
./deploy-backend.sh
./deploy-frontend.sh
echo "✅ Emergency rollback completed"
```

### Emergency Contacts

- **DevOps Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Security Team**: [Contact Info]

---

*Remember: Always test in staging before deploying to production. When in doubt, rollback and investigate. 🛡️*
