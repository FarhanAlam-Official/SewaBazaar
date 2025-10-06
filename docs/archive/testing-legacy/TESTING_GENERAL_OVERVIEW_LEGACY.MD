# 🧪 SewaBazaar Testing Guide

This document provides comprehensive information about the testing setup and practices for the SewaBazaar project.

## 📋 Table of Contents

- [Overview](#-overview)
- [Backend Testing](#-backend-testing)
- [Frontend Testing](#️-frontend-testing)
- [Running Tests](#-running-tests)
- [Test Coverage](#-test-coverage)
- [Testing Best Practices](#-testing-best-practices)
- [CI/CD Integration](#-cicd-integration)

## 🎯 Overview

SewaBazaar implements a comprehensive testing strategy covering both backend (Django) and frontend (Next.js) components with the following goals:

- **80%+ Code Coverage** for all critical components
- **Unit Tests** for individual functions and components
- **Integration Tests** for API endpoints and user workflows
- **Performance Tests** for database queries and bulk operations
- **Edge Case Testing** for error handling and boundary conditions

## 🔧 Backend Testing

### Test Structure

```bash
backend/
├── apps/
│   ├── accounts/
│   │   ├── tests.py              # User & authentication tests
│   │   └── factories.py          # Test data factories
│   ├── services/
│   │   ├── tests.py              # Service management tests
│   │   └── factories.py          # Service test factories
│   ├── bookings/
│   │   ├── tests.py              # Booking system tests
│   │   └── factories.py          # Booking test factories
│   └── reviews/
│       ├── tests.py              # Review system tests
│       └── factories.py          # Review test factories
├── pytest.ini                   # Pytest configuration
├── run_tests.py                 # Test runner script
└── requirements.txt             # Testing dependencies
```

### Test Categories

#### 1. Model Tests

- **Purpose**: Test database models, relationships, and business logic
- **Coverage**: Field validation, methods, properties, constraints
- **Examples**:
  - User creation and validation
  - Service slug generation
  - Booking total calculation
  - Review rating constraints

#### 2. Serializer Tests

- **Purpose**: Test API data serialization and validation
- **Coverage**: Field mapping, validation rules, nested serializers
- **Examples**:
  - User serializer field validation
  - Service detail serializer
  - Booking data transformation

#### 3. API Tests

- **Purpose**: Test REST API endpoints and permissions
- **Coverage**: CRUD operations, authentication, authorization
- **Examples**:
  - Service creation by providers
  - Booking management by customers
  - Review creation and updates

#### 4. Integration Tests

- **Purpose**: Test component interactions and workflows
- **Coverage**: Cross-module functionality, signals, callbacks
- **Examples**:
  - Service rating calculation from reviews
  - User profile creation on registration
  - Booking status workflows

#### 5. Performance Tests

- **Purpose**: Test database performance and scalability
- **Coverage**: Bulk operations, query optimization
- **Examples**:
  - Bulk user creation
  - Service query performance
  - Review aggregation

#### 6. Edge Case Tests

- **Purpose**: Test error handling and boundary conditions
- **Coverage**: Invalid data, constraint violations, edge scenarios
- **Examples**:
  - Duplicate email registration
  - Invalid rating values
  - Long text fields

### Test Dependencies

```bash
# Install testing dependencies
pip install pytest pytest-django pytest-cov factory-boy coverage
```

### Running Backend Tests

```bash
# Navigate to backend directory
cd backend

# Run all tests with coverage
python run_tests.py

# Run specific test categories
python run_tests.py specific

# Run performance tests
python run_tests.py performance

# Run tests with pytest directly
pytest --cov=apps --cov-report=html
```

## ⚛️ Frontend Testing

### Test Structure

```bash
frontend/
├── src/
│   ├── components/
│   │   ├── services/
│   │   │   ├── ServiceCard.tsx
│   │   │   └── ServiceCard.test.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── button.test.tsx
│   ├── __tests__/               # Global test utilities
│   └── __mocks__/               # Mock files
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Test setup and mocks
└── package.json                 # Testing dependencies
```

### Test Categories

#### 1. Component Tests

- **Purpose**: Test React component rendering and behavior
- **Coverage**: Props, state, user interactions, accessibility
- **Examples**:
  - ServiceCard rendering
  - Button click handlers
  - Form validation

#### 2. Hook Tests

- **Purpose**: Test custom React hooks
- **Coverage**: State management, side effects, error handling
- **Examples**:
  - Authentication hooks
  - Form validation hooks
  - API data hooks

#### 3. Utility Tests

- **Purpose**: Test helper functions and utilities
- **Coverage**: Data transformation, validation, formatting
- **Examples**:
  - Date formatting
  - Price formatting
  - Validation functions

#### 4. Integration Tests

- **Purpose**: Test component interactions and user workflows
- **Coverage**: Multi-step processes, API integration
- **Examples**:
  - Service booking flow
  - User registration process
  - Search and filtering

### Test Dependencies

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

### Running Frontend Tests

```bash
# Navigate to frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

## 🚀 Running Tests

### Quick Start

```bash
# Backend tests
cd backend
python run_tests.py

# Frontend tests
cd frontend
npm test
```

### Comprehensive Test Suite

```bash
# Run all backend tests with coverage
cd backend
python run_tests.py all

# Run frontend tests with coverage
cd frontend
npm run test:coverage

# Generate combined coverage report
# (Coverage reports are generated in htmlcov/ and coverage/ directories)
```

### Test Commands Reference

#### Backend Commands

```bash
# Run all tests
python run_tests.py

# Run specific app tests
pytest apps/accounts/
pytest apps/services/
pytest apps/bookings/
pytest apps/reviews/

# Run with specific markers
pytest -m "not slow"
pytest -k "test_user_creation"

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=apps --cov-report=html
```

#### Frontend Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test ServiceCard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders"

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 📊 Test Coverage

### Coverage Targets

- **Backend**: 80%+ overall coverage
- **Frontend**: 80%+ overall coverage
- **Critical Paths**: 95%+ coverage

### Coverage Reports

#### Backend Coverage

- **Location**: `backend/htmlcov/index.html`
- **Metrics**: Lines, branches, functions, statements
- **Apps Covered**: accounts, services, bookings, reviews

#### Frontend Coverage

- **Location**: `frontend/coverage/lcov-report/index.html`
- **Metrics**: Lines, branches, functions, statements
- **Components Covered**: All React components and utilities

### Coverage Exclusions

```python
# Backend - pytest.ini
addopts = 
    --cov=apps
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
```

```javascript
// Frontend - jest.config.js
collectCoverageFrom: [
  'src/**/*.{js,jsx,ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/*.stories.{js,jsx,ts,tsx}',
  '!src/**/*.test.{js,jsx,ts,tsx}',
  '!src/**/*.spec.{js,jsx,ts,tsx}',
],
```

## 🏆 Testing Best Practices

### Backend Testing

#### 1. Use Factory Boy for Test Data

```python
class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    username = factory.Sequence(lambda n: f'user{n}')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
```

#### 2. Test Database Constraints

```python
def test_unique_email_constraint(self):
    UserFactory(email='duplicate@example.com')
    with self.assertRaises(IntegrityError):
        UserFactory(email='duplicate@example.com')
```

#### 3. Test API Permissions

```python
def test_customer_cannot_create_service(self):
    customer = UserFactory(role='customer')
    self.client.force_authenticate(user=customer)
    response = self.client.post('/api/services/', service_data)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

#### 4. Test Business Logic

```python
def test_booking_total_calculation(self):
    booking = BookingFactory(
        price=Decimal('1000.00'),
        discount=Decimal('100.00'),
        total_amount=None
    )
    self.assertEqual(booking.total_amount, Decimal('900.00'))
```

### Frontend Testing

#### 1. Test Component Rendering

```typescript
it('renders service information correctly', () => {
  render(<ServiceCard service={mockService} />)
  
  expect(screen.getByText('Professional Plumbing Service')).toBeInTheDocument()
  expect(screen.getByText('Rs. 1500')).toBeInTheDocument()
})
```

#### 2. Test User Interactions

```typescript
it('calls onAction when button is clicked', () => {
  const mockOnAction = jest.fn()
  render(<ServiceCard service={mockService} onAction={mockOnAction} />)
  
  fireEvent.click(screen.getByRole('button'))
  expect(mockOnAction).toHaveBeenCalledWith('1')
})
```

#### 3. Test Accessibility

```typescript
it('maintains accessibility features', () => {
  render(<ServiceCard service={mockService} />)
  
  const image = screen.getByAltText('Professional Plumbing Service')
  expect(image).toBeInTheDocument()
})
```

#### 4. Test Edge Cases

```typescript
it('handles missing optional fields gracefully', () => {
  const minimalService = { id: '1', name: 'Service', price: 100 }
  render(<ServiceCard service={minimalService} />)
  
  expect(screen.getByText('Service')).toBeInTheDocument()
})
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          python run_tests.py

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run tests
        run: |
          cd frontend
          npm run test:ci
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: backend-tests
        name: Backend Tests
        entry: python run_tests.py
        language: system
        pass_filenames: false
        always_run: true
        
      - id: frontend-tests
        name: Frontend Tests
        entry: npm test
        language: system
        pass_filenames: false
        always_run: true
```

## 📈 Test Metrics

### Key Performance Indicators

- **Test Execution Time**: < 30 seconds for full suite
- **Coverage Threshold**: 80% minimum
- **Test Reliability**: 99%+ pass rate
- **Build Time**: < 5 minutes including tests

### Monitoring

- **Coverage Reports**: Generated on every test run
- **Test Results**: Logged to console and CI/CD
- **Performance Metrics**: Tracked in CI/CD pipeline
- **Failure Analysis**: Automated reporting for failed tests

## 🛠️ Troubleshooting

### Common Issues

#### Backend Test Issues

```bash
# Database connection issues
export DATABASE_URL=sqlite:///test.db

# Import errors
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Coverage issues
pytest --cov=apps --cov-report=term-missing
```

#### Frontend Test Issues

```bash
# Module resolution issues
npm run test -- --moduleNameMapping='^@/(.*)$': '<rootDir>/src/$1'

# Memory issues
node --max-old-space-size=4096 node_modules/.bin/jest

# Watch mode issues
npm run test:watch -- --no-cache
```

### Debug Mode

```bash
# Backend debug
pytest -s -v --pdb

# Frontend debug
npm test -- --verbose --no-coverage
```

## 📚 Additional Resources

- [Django Testing Documentation](https://docs.djangoproject.com/en/4.2/topics/testing/)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Pytest Documentation](https://docs.pytest.org/)

---

**Note**: This testing guide should be updated as the project evolves. Always run tests before committing changes and maintain high test coverage standards.
