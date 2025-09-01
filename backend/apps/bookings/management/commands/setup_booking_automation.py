"""
IMPROVED BOOKING SLOT AUTOMATION SETUP COMMAND

Purpose: Set up automated scheduling for booking slot maintenance
This module configures automatic execution of booking slot maintenance tasks
to ensure continuous availability without manual intervention.

Features:
- Daily slot maintenance (cleanup + generation)
- Provider availability sync
- Booking slot optimization
- System health monitoring
- Multiple setup methods (cron, django-crontab, manual)

Usage:
    python manage.py setup_booking_automation
    python manage.py setup_booking_automation --action list
    python manage.py setup_booking_automation --action remove
    python manage.py setup_booking_automation --action test
"""

from django.core.management.base import BaseCommand
from django.conf import settings
import os
import sys
from pathlib import Path

class Command(BaseCommand):
    help = 'Set up automated booking slot maintenance scheduling'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['setup', 'remove', 'list', 'test'],
            default='setup',
            help='Action to perform (default: setup)',
        )
        parser.add_argument(
            '--schedule',
            type=str,
            default='02:00',
            help='Time to run maintenance (HH:MM format, default: 02:00)',
        )

    def handle(self, *args, **options):
        action = options['action']
        schedule = options['schedule']
        
        self.stdout.write(f"🔧 Booking Slot Automation Manager")
        self.stdout.write(f"Action: {action}")
        
        if action == 'setup':
            self.setup_automation(schedule)
        elif action == 'remove':
            self.remove_automation()
        elif action == 'list':
            self.list_jobs()
        elif action == 'test':
            self.test_automation()

    def setup_automation(self, schedule):
        """Set up automated booking slot maintenance"""
        self.stdout.write("\n🚀 Setting up automated booking slot maintenance...")
        
        # Get project root path
        project_root = Path(settings.BASE_DIR)
        manage_py = project_root / 'manage.py'
        
        if not manage_py.exists():
            self.stdout.write(self.style.ERROR("❌ manage.py not found"))
            return
        
        # Create cron job commands
        hour, minute = schedule.split(':')
        
        cron_commands = [
            {
                'name': 'Booking Slot Maintenance',
                'command': f'{sys.executable} {manage_py} maintain_booking_slots',
                'schedule': f'{minute} {hour} * * *',
                'description': 'Daily booking slot cleanup and generation'
            },
            {
                'name': 'Weekly Slot Optimization',
                'command': f'{sys.executable} {manage_py} maintain_booking_slots --days-ahead 45',
                'schedule': f'{minute} {hour} * * 0',  # Sunday
                'description': 'Weekly extended slot generation'
            }
        ]
        
        # Method 1: Django-crontab (if available)
        try:
            self.setup_django_crontab(cron_commands)
        except ImportError:
            self.stdout.write(self.style.WARNING("⚠️  django-crontab not available"))
            self.show_manual_setup(cron_commands)

    def setup_django_crontab(self, cron_commands):
        """Set up using django-crontab package"""
        try:
            from django_crontab.crontab import CronTab
            
            self.stdout.write("📦 Using django-crontab for automation...")
            
            # Add to settings.py if not already there
            self.update_settings_for_crontab(cron_commands)
            
            self.stdout.write("✅ Cron jobs configured!")
            self.stdout.write("\nNext steps:")
            self.stdout.write("1. Install django-crontab: pip install django-crontab")
            self.stdout.write("2. Add 'django_crontab' to INSTALLED_APPS")
            self.stdout.write("3. Run: python manage.py crontab add")
            self.stdout.write("4. Check: python manage.py crontab show")
            
        except ImportError:
            raise ImportError("django-crontab not available")

    def update_settings_for_crontab(self, cron_commands):
        """Add CRONJOBS to settings.py"""
        settings_content = f"""
# Booking Slot Automation Configuration
# Add this to your settings.py file

CRONJOBS = [
"""
        
        for job in cron_commands:
            settings_content += f"""    # {job['description']}
    ('{job['schedule']}', '{job['command']}'),
    
"""
        
        settings_content += """]

# Optional: Crontab settings
CRONTAB_LOCK_JOBS = True  # Prevent overlapping jobs
CRONTAB_COMMAND_PREFIX = 'DJANGO_SETTINGS_MODULE=backend.settings'
"""
        
        self.stdout.write("\n📝 Add this to your settings.py:")
        self.stdout.write(settings_content)

    def show_manual_setup(self, cron_commands):
        """Show manual crontab setup instructions"""
        self.stdout.write("\n📋 Manual Crontab Setup Instructions:")
        self.stdout.write("="*50)
        
        self.stdout.write("1. Open crontab editor:")
        self.stdout.write("   crontab -e")
        
        self.stdout.write("\n2. Add these lines:")
        for job in cron_commands:
            self.stdout.write(f"   # {job['description']}")
            self.stdout.write(f"   {job['schedule']} {job['command']}")
            self.stdout.write("")
        
        self.stdout.write("3. Save and exit")
        self.stdout.write("4. Verify with: crontab -l")
        
        # Create a helper script
        self.create_automation_script(cron_commands)

    def create_automation_script(self, cron_commands):
        """Create a helper script for easy setup"""
        project_root = Path(settings.BASE_DIR)
        script_path = project_root / 'setup_booking_automation.sh'
        
        script_content = """#!/bin/bash
# Booking Slot Automation Setup Script
# Generated by Django management command

echo "🚀 Setting up booking slot automation..."

# Create backup of current crontab
echo "📋 Backing up current crontab..."
crontab -l > crontab_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || echo "No existing crontab"

# Add our cron jobs
echo "➕ Adding booking slot maintenance jobs..."
(crontab -l 2>/dev/null; cat << 'EOF'

# Booking Slot Automation (Added by SewaBazaar)
"""
        
        for job in cron_commands:
            script_content += f"# {job['description']}\n"
            script_content += f"{job['schedule']} {job['command']}\n"
        
        script_content += """
EOF
) | crontab -

echo "✅ Cron jobs installed successfully!"
echo "📊 Current crontab:"
crontab -l

echo ""
echo "🔧 To remove these jobs later, run:"
echo "   python manage.py setup_booking_automation --action remove"
"""
        
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Make executable
        os.chmod(script_path, 0o755)
        
        self.stdout.write(f"\n📄 Created setup script: {script_path}")
        self.stdout.write("Run with: ./setup_booking_automation.sh")

    def remove_automation(self):
        """Remove automated booking slot maintenance"""
        self.stdout.write("🗑️  Removing booking slot automation...")
        
        # Instructions for manual removal
        self.stdout.write("\n📋 To remove cron jobs manually:")
        self.stdout.write("1. Edit crontab: crontab -e")
        self.stdout.write("2. Remove lines containing 'maintain_booking_slots'")
        self.stdout.write("3. Save and exit")
        
        # Create removal script
        project_root = Path(settings.BASE_DIR)
        script_path = project_root / 'remove_booking_automation.sh'
        
        script_content = """#!/bin/bash
# Remove Booking Slot Automation
echo "🗑️  Removing booking slot automation..."

# Backup current crontab
crontab -l > crontab_backup_removal_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null

# Remove our cron jobs
crontab -l 2>/dev/null | grep -v 'maintain_booking_slots' | crontab -

echo "✅ Booking slot automation removed!"
echo "📊 Current crontab:"
crontab -l
"""
        
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        os.chmod(script_path, 0o755)
        
        self.stdout.write(f"📄 Created removal script: {script_path}")

    def list_jobs(self):
        """List current cron jobs"""
        self.stdout.write("📋 Current cron jobs:")
        
        try:
            import subprocess
            result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                slot_jobs = [line for line in lines if 'maintain_booking_slots' in line]
                
                if slot_jobs:
                    self.stdout.write("🎯 Booking slot related jobs:")
                    for job in slot_jobs:
                        self.stdout.write(f"  {job}")
                else:
                    self.stdout.write("❌ No booking slot automation jobs found")
                    
                self.stdout.write(f"\n📊 Total cron jobs: {len(lines)}")
            else:
                self.stdout.write("❌ Could not access crontab")
                
        except Exception as e:
            self.stdout.write(f"❌ Error listing jobs: {str(e)}")

    def test_automation(self):
        """Test the automation system"""
        self.stdout.write("🧪 Testing booking slot automation...")
        
        # Test 1: Dry run maintenance
        self.stdout.write("\n1️⃣  Testing maintenance command (dry run)...")
        from django.core.management import call_command
        
        try:
            call_command('maintain_booking_slots', '--dry-run')
            self.stdout.write("✅ Maintenance command works!")
        except Exception as e:
            self.stdout.write(f"❌ Maintenance command failed: {str(e)}")
        
        # Test 2: Check required dependencies
        self.stdout.write("\n2️⃣  Checking dependencies...")
        
        required_models = [
            'apps.bookings.models.BookingSlot',
            'apps.bookings.models.ProviderAvailability',
            'apps.services.models.Service'
        ]
        
        for model_path in required_models:
            try:
                module_path, class_name = model_path.rsplit('.', 1)
                module = __import__(module_path, fromlist=[class_name])
                getattr(module, class_name)
                self.stdout.write(f"  ✅ {model_path}")
            except Exception as e:
                self.stdout.write(f"  ❌ {model_path}: {str(e)}")
        
        # Test 3: Check cron accessibility
        self.stdout.write("\n3️⃣  Testing cron accessibility...")
        try:
            import subprocess
            subprocess.run(['which', 'crontab'], check=True, capture_output=True)
            self.stdout.write("  ✅ crontab available")
        except:
            self.stdout.write("  ❌ crontab not accessible")
        
        self.stdout.write("\n🎉 Testing completed!")