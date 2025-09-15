# SewaBazaar Testing Guide

This document provides comprehensive guidance for testing the SewaBazaar application, covering both backend and frontend components.

## File Naming Conventions

To ensure consistency and make test files easy to identify, we follow these naming conventions across the project:

### Backend Tests

1. **Test Files**: All test files should be prefixed with `test_` and use the `.py` extension:

   ```text
   test_models.py
   test_views.py
   test_api_endpoints.py
   test_khalti_integration.py
   ```

2. **Test Classes**: Test classes should have a `Test` suffix:

   ```python
   class UserModelTest(TestCase):
       """Test cases for User model"""
       pass
   ```

3. **Test Methods**: Test methods should start with `test_` and have descriptive names:

   ```python
   def test_create_user_with_valid_data(self):
       """Test user creation with valid data"""
       pass
   ```

### Frontend Tests

1. **Component Test Files**: Component test files should use the `.test.tsx` or `.test.jsx` extension:

   ```text
   Button.test.tsx
   ServiceCard.test.tsx
   LoginForm.test.tsx
   ```

2. **Utility/Service Tests**: Service and utility test files should use `.test.ts` or `.test.js`:

   ```text
   timeSlotService.test.ts
   authService.test.js
   ```

3. **Cypress E2E Tests**: Cypress test files should use the `.cy.js` extension:

   ```text
   auth.cy.js
   booking.cy.js
   ```

### Test Directory Structure

All tests should be organized following this structure:

```text
tests/
├── backend/
│   ├── api/
│   │   ├── test_service_api.py
│   │   └── test_api_endpoints.py
│   ├── services/
│   │   └── payment/
│   │       ├── test_khalti.py
│   │       └── test_khalti_service.py
│   └── unit/
│       ├── test_models.py
│       └── test_serializers.py
├── frontend/
│   ├── unit/
│   │   ├── components/
│   │   │   ├── Button.test.tsx
│   │   │   └── Header.test.tsx
│   │   └── hooks/
│   │       └── useAuth.test.tsx
│   └── integration/
│       └── services/
│           └── ServiceListing.test.tsx
└── e2e/
    └── cypress/
        └── e2e/
            ├── auth.cy.js
            └── booking.cy.js
```

## Running Tests

The SewaBazaar project includes a comprehensive test runner that supports various testing options:

```bash
# Run all tests
python -m tests.run_tests --all

# Run only backend tests
python -m tests.run_tests --backend

# Run only frontend tests
python -m tests.run_tests --frontend

# Run specific test types
python -m tests.run_tests --unit           # Run unit tests only
python -m tests.run_tests --integration    # Run integration tests only
python -m tests.run_tests --api            # Run API tests only
python -m tests.run_tests --e2e            # Run end-to-end tests only

# Generate coverage report
python -m tests.run_tests --coverage

# Show verbose output
python -m tests.run_tests --verbose
```

## Backend Tests

### Unit Tests

Unit tests verify individual components in isolation:

```bash
python -m tests.run_tests --unit --backend
```

Key unit test areas:

- Model validation and business rules
- Serializer functionality
- View logic
- Utility functions

### Integration Tests

Integration tests verify that components work together correctly:

```bash
python -m tests.run_tests --integration --backend
```

Key integration test areas:

- Service interactions
- Database operations
- Payment processing workflows
- Authentication flows

### API Tests

API tests verify that all API endpoints function correctly:

```bash
python -m tests.run_tests --api --backend
```

Key API test areas:

- Endpoint accessibility
- Request validation
- Response structure
- Authentication and permissions
- Error handling

## Frontend Tests

Frontend tests verify React components and utilities:

```bash
python -m tests.run_tests --frontend
# OR
cd frontend && npm test
```

Key frontend test areas:

- Component rendering
- State management
- User interactions
- API integration
- Form validation

## End-to-End Tests

End-to-end tests verify complete user workflows:

```bash
python -m tests.run_tests --e2e
```

Key E2E test scenarios:

- User registration and login
- Service browsing and filtering
- Booking workflow
- Payment processing
- User profile management

## Payment Gateway Tests

### Khalti Integration Tests

Khalti payment gateway tests verify the payment processing workflow:

```bash
# Run all Khalti integration tests
python -m tests.run_tests --backend --integration -- -k khalti

# Run specific Khalti test file
pytest tests/backend/services/test_khalti_integration.py -v
```

For detailed information on Khalti testing, refer to the [Khalti Integration Guide](../payment-gateways/KHALTI.md).

## Coverage Reports

Generate test coverage reports to identify untested code:

```bash
python -m tests.run_tests --coverage
```

This will generate HTML coverage reports in:

- Backend: `backend/htmlcov/index.html`
- Frontend: `frontend/coverage/lcov-report/index.html`

## Continuous Integration

The SewaBazaar project uses GitHub Actions for continuous integration:

- Tests run automatically on each push and pull request
- Coverage reports are generated and uploaded as artifacts
- Failed tests block pull request merging

## Troubleshooting

### Common Issues

#### Backend Tests Failing

1. **Database Issues**

   ```bash
   python manage.py migrate
   ```

2. **Missing Dependencies**

   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Environment Configuration**
   - Check that `.env` file exists with correct settings
   - Verify database connection settings

#### Frontend Tests Failing

1. **Node Module Issues**

   ```bash
   cd frontend
   npm install
   ```

2. **Environment Variables**
   - Verify `.env.local` exists with correct API settings

#### End-to-End Tests Failing

1. **Server Not Running**
   - Ensure backend server is running: `python manage.py runserver`
   - Ensure frontend server is running: `cd frontend && npm run dev`

2. **Browser Issues**
   - Update browser drivers: `npx playwright install`

### Getting Help

If tests continue to fail:

1. Check console output for specific error messages
2. Review log files in `backend/logs/`
3. Verify all dependencies are installed
4. Check for recent code changes that might affect tests
