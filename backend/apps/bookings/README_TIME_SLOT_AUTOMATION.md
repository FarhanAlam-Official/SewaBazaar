# Automated Time Slot Management System

## 🎯 Overview

The automated time slot management system maintains a rolling 30-day window of available booking slots without manual intervention. It automatically:

- ✅ **Expires old slots** - Removes yesterday's unbooked slots daily
- ✅ **Generates new slots** - Creates slots for +30 days ahead
- ✅ **Preserves bookings** - Never removes slots with existing bookings
- ✅ **Respects availability** - Uses provider availability schedules
- ✅ **Monitors health** - Tracks system performance and coverage

## 🏗️ Architecture

The system follows the existing **three-layer time slot architecture**:

```
Provider Availability → Service Time Slots → Booking Slots
     (Foundation)         (Service-specific)    (Bookable instances)
```

### Core Components

1. **`maintain_time_slots.py`** - Main maintenance command
2. **`setup_slot_automation.py`** - Automation configuration
3. **`tasks.py`** - Celery tasks (optional advanced scheduling)
4. **`automation_settings.py`** - Configuration templates

## 🚀 Quick Setup

### Method 1: Simple Cron Jobs (Recommended)

```bash
# 1. Test the maintenance command
python manage.py maintain_time_slots --dry-run

# 2. Set up automation
python manage.py setup_slot_automation --action setup

# 3. Follow the generated instructions to add cron jobs
```

### Method 2: Django-Crontab

```bash
# 1. Install django-crontab
pip install django-crontab

# 2. Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... other apps
    'django_crontab',
]

# 3. Add cron job configuration (see automation_settings.py)

# 4. Install cron jobs
python manage.py crontab add
python manage.py crontab show
```

### Method 3: Celery (Advanced)

```bash
# 1. Install Celery and Redis
pip install celery redis

# 2. Configure Celery in settings.py
# 3. Start Celery worker and beat scheduler
celery -A backend worker --loglevel=info
celery -A backend beat --loglevel=info
```

## 📋 Command Reference

### Main Maintenance Command

```bash
# Basic usage (removes expired, generates new slots)
python manage.py maintain_time_slots

# Dry run (test without changes)
python manage.py maintain_time_slots --dry-run

# Custom window (45 days ahead)
python manage.py maintain_time_slots --days-ahead 45

# Specific provider only
python manage.py maintain_time_slots --provider-id 123

# Force cleanup (remove even booked expired slots)
python manage.py maintain_time_slots --force-cleanup
```

### Automation Setup

```bash
# Set up automation
python manage.py setup_slot_automation --action setup

# Remove automation
python manage.py setup_slot_automation --action remove

# List current jobs
python manage.py setup_slot_automation --action list

# Test system
python manage.py setup_slot_automation --action test
```

## ⚙️ Configuration

### Settings Configuration

Add to your `settings.py`:

```python
# Time Slot Automation Settings
TIME_SLOT_AUTOMATION = {
    'ENABLED': True,
    'DAYS_AHEAD': 30,
    'CLEANUP_EXPIRED': True,
    'PRESERVE_BOOKED_EXPIRED': True,
    'DAILY_MAINTENANCE_TIME': '02:00',
    'MAX_SLOTS_PER_SERVICE': 1000,
    'LOG_LEVEL': 'INFO',
}

# Cron Jobs (if using django-crontab)
CRONJOBS = [
    ('0 2 * * *', 'django.core.management.call_command', ['maintain_time_slots']),
    ('0 3 * * 0', 'django.core.management.call_command', ['maintain_time_slots'], {'days_ahead': 45}),
]
```

### Environment Variables

```bash
# Development
DJANGO_DEBUG=True  # Enables dry-run mode

# Production
DJANGO_ENV=production
ADMIN_EMAIL=admin@sewabazaar.com  # For error notifications
```

## 📊 Monitoring and Logging

### Log Files

The system creates detailed logs:

```
logs/time_slot_automation.log  # Main automation log
```

### Health Monitoring

```bash
# Check system health
python manage.py setup_slot_automation --action test

# View maintenance summary
python manage.py maintain_time_slots --dry-run
```

### Key Metrics

- **Service Coverage**: % of services with available slots
- **Slot Density**: Average slots per day
- **Booking Rate**: % of slots that get booked
- **System Uptime**: Automation reliability

## 🔧 Troubleshooting

### Common Issues

#### No Slots Generated
```bash
# Check provider availability
python manage.py shell
>>> from apps.bookings.models import ProviderAvailability
>>> ProviderAvailability.objects.count()

# Create provider availability if missing
python manage.py create_time_slots
```

#### Cron Jobs Not Running
```bash
# Check crontab
crontab -l

# Check cron service
sudo service cron status

# Check logs
tail -f /var/log/cron.log
```

#### Permission Issues
```bash
# Ensure manage.py is executable
chmod +x manage.py

# Check Python path in cron
which python3
```

### Debug Commands

```bash
# Detailed dry run
python manage.py maintain_time_slots --dry-run --verbosity=2

# Test specific service
python manage.py maintain_time_slots --service-id 123 --dry-run

# Check automation status
python manage.py setup_slot_automation --action list
```

## 🛡️ Safety Features

### Non-Destructive Operations

- ✅ **Preserves bookings** - Never removes slots with bookings
- ✅ **Dry run mode** - Test changes before applying
- ✅ **Atomic transactions** - All-or-nothing updates
- ✅ **Backup-friendly** - Can be restored from database backups

### Error Handling

- 🔄 **Automatic retries** - Celery tasks retry on failure
- 📧 **Email alerts** - Notify admins of issues
- 📝 **Detailed logging** - Track all operations
- 🚨 **Health checks** - Monitor system status

## 📈 Performance Optimization

### Batch Processing

The system processes slots in batches to handle large datasets efficiently:

```python
TIME_SLOT_AUTOMATION = {
    'BATCH_SIZE': 100,  # Process 100 slots at a time
    'MAX_SLOTS_PER_SERVICE': 1000,  # Prevent runaway generation
}
```

### Database Optimization

- Indexes on `date`, `is_available`, `provider`, `service`
- Unique constraints prevent duplicate slots
- Efficient queries using select_related and prefetch_related

## 🚀 Production Deployment

### Server Setup

```bash
# 1. Install requirements
pip install -r requirements.txt

# 2. Set up automation
python manage.py setup_slot_automation

# 3. Test the system
python manage.py maintain_time_slots --dry-run

# 4. Enable cron jobs
./setup_time_slot_automation.sh
```

### Monitoring Setup

```bash
# 1. Set up log rotation
sudo logrotate -d /etc/logrotate.d/sewabazaar

# 2. Configure monitoring
# Add health check endpoint
# Set up alerts for failures

# 3. Performance monitoring
# Track slot generation rates
# Monitor database performance
```

## 🔮 Future Enhancements

### Planned Features

- 🤖 **AI-powered optimization** - Learn from booking patterns
- 📱 **Real-time notifications** - Instant alerts for providers
- 📊 **Advanced analytics** - Booking trends and insights
- 🌐 **Multi-timezone support** - Global provider availability
- 🔄 **Auto-scaling** - Dynamic slot generation based on demand

### Integration Opportunities

- 📅 **Calendar sync** - Google Calendar, Outlook integration
- 📲 **Push notifications** - Mobile app alerts
- 🔔 **Webhook support** - External system notifications
- 📈 **Business intelligence** - Advanced reporting and analytics

## 🆘 Support

### Getting Help

1. **Check logs** - Review automation logs for errors
2. **Run diagnostics** - Use `--action test` to check system health
3. **Dry run test** - Verify changes with `--dry-run`
4. **Documentation** - Review this guide and command help
5. **Community** - Check project documentation and issues

### Emergency Procedures

If automation fails:

```bash
# 1. Check system status
python manage.py setup_slot_automation --action test

# 2. Manual maintenance
python manage.py maintain_time_slots --dry-run
python manage.py maintain_time_slots

# 3. Emergency slot generation
python manage.py create_time_slots --days 7

# 4. Re-enable automation
python manage.py setup_slot_automation --action setup
```

---

**✨ The automated time slot system ensures your SewaBazaar platform always has available booking slots without manual intervention!**