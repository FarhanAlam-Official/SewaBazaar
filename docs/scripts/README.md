# Setup Scripts

This directory contains setup and utility scripts for SewaBazaar.

## 📋 Available Scripts

### `PHASE_1_SETUP.py` - Phase 1 Feature Setup
**Purpose**: Sets up default payment methods and verifies Phase 1 features are properly configured.

**When to Use**:
- After applying database migrations for Phase 1
- When setting up a new development environment
- After deployment to ensure payment methods are configured

**How to Run**:
```bash
# From project root
python docs/scripts/PHASE_1_SETUP.py

# Or from backend directory
cd backend
python ../docs/scripts/PHASE_1_SETUP.py
```

**What it Does**:
- ✅ Creates default payment methods (Khalti, Cash, eSewa, Bank Transfer)
- ✅ Configures payment gateway settings
- ✅ Verifies setup completion
- ✅ Provides status feedback and next steps

**Output Example**:
```
🚀 Phase 1 Setup Script
==================================================
Creating default payment methods...
✓ Created payment method: Khalti
✓ Created payment method: Cash on Service
✓ Payment method already exists: eSewa
✓ Payment method already exists: Bank Transfer

Summary: 2 created, 0 updated

Active payment methods:
  - Khalti (Digital wallet)
  - Cash on Service (Cash)

Verifying Phase 1 setup...
✓ Payment methods: 4 found
✓ Khalti payment method is active

✅ Phase 1 setup verification complete!

🎉 Phase 1 setup completed successfully!
```

## 🛡️ Safety Features

- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Only creates or updates, never deletes
- **Verification**: Confirms setup completion
- **Error Handling**: Graceful error messages

## 🔧 Prerequisites

- Django environment properly configured
- Database migrations applied
- Backend dependencies installed

## 📞 Troubleshooting

### Common Issues

**Django Not Found**:
```bash
# Ensure you're in the right directory and virtual environment
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

**Permission Errors**:
```bash
# Run with appropriate permissions
python docs/scripts/PHASE_1_SETUP.py
```

**Database Connection Issues**:
- Verify database credentials in `.env` file
- Ensure database server is running
- Check Django settings configuration

## 🚀 Adding New Scripts

When adding new setup scripts:

1. **Follow the naming convention**: `[PHASE_NAME]_SETUP.py`
2. **Include proper documentation**: Clear docstrings and comments
3. **Add error handling**: Graceful failure with helpful messages
4. **Make it idempotent**: Safe to run multiple times
5. **Update this README**: Document the new script

### Script Template
```python
#!/usr/bin/env python
"""
[Script Name] - [Brief Description]

[Detailed description of what the script does]
"""

import os
import sys
import django

# Setup Django environment
backend_path = os.path.join(os.path.dirname(__file__), '../../backend')
sys.path.insert(0, backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sewabazaar.settings')
django.setup()

def main():
    """Main script function"""
    try:
        print("🚀 [Script Name]")
        print("=" * 50)
        
        # Your script logic here
        
        print("✅ Setup completed successfully!")
        
    except Exception as e:
        print(f"❌ Setup failed: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
```