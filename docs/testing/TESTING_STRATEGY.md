# SewaBazaar Testing Strategy

## 🎯 Testing Philosophy

At SewaBazaar, we believe that **quality code is tested code**. Our comprehensive
testing strategy ensures reliability, maintainability, and bug-free operation of
our service marketplace platform.

## 📊 Testing Coverage Goals

| Component           | Target Coverage | Status     |
| ------------------- | --------------- | ---------- |
| Backend Models      | 95%+            | ✅ 95%     |
| Backend APIs        | 90%+            | ✅ 92%     |
| Backend Serializers | 90%+            | ✅ 94%     |
| Frontend Components | 85%+            | ✅ 85%     |
| Frontend Pages      | 80%+            | ✅ 82%     |
| **Overall Project** | **85%+**        | **✅ 87%** |

## 🏗️ Testing Architecture

Our test architecture has been reorganized to follow industry best practices with
a centralized testing directory structure:

```txt
SewaBazaar/
├── tests/                       # Main testing directory
│   ├── conftest.py              # Global pytest configuration
│   ├── fixtures/                # Shared test fixtures
│   ├── backend/                 # Backend tests
│   │   ├── unit/                # Unit tests
│   │   ├── api/                 # API tests
│   │   └── services/            # Service tests
│   ├── frontend/                # Frontend tests
│   │   ├── unit/                # Component unit tests
│   │   └── components/          # Component integration tests
│   ├── integration/             # Cross-system integration tests
│   └── e2e/                     # End-to-end tests with Cypress
│
├── backend/                     # Backend source code
│   └── apps/                    # Django apps with model-specific tests
│
└── frontend/                    # Frontend source code
    └── __tests__/               # Jest tests alongside components
```

For full details, see [Testing Framework Documentation](../../tests/README.md).

## 🧪 Testing Stack

### Backend Testing Tools

- **Pytest**: Main testing framework
- **Django TestCase**: Database testing utilities
- **Factory Boy**: Test data generation
- **Coverage.py**: Code coverage reporting
- **Custom Test Runner**: Automated execution

### Frontend Testing Tools

- **Jest**: Main testing framework
- **React Testing Library**: Component testing
- **@testing-library/jest-dom**: Custom matchers
- **TypeScript**: Type-safe testing
- **Custom Mocks**: Next.js library mocks

### End-to-End Testing

- **Cypress**: E2E testing framework
- **Cross-browser testing**: Multiple browser support
- **Mobile testing**: Responsive design validation

## 🚀 Running Tests

### Quick Start Commands

```bash
# Run all tests (from project root)
npm run test:all

# Backend tests only
cd backend
python run_tests.py all

# Frontend tests only
cd frontend
npm test

# E2E tests
cd frontend
npm run cypress:run
```

### Detailed Test Commands

#### Backend Test Commands

```bash
cd backend

# Run all tests
python run_tests.py all

# Run specific categories
python run_tests.py specific    # Models/API tests
python run_tests.py performance # Performance tests

# Run with coverage
pytest --cov=apps --cov-report=html --cov-report=term-missing

# Run specific test file
pytest apps/bookings/tests.py -v

# Run tests in watch mode
pytest-watch
```

#### Frontend Test Commands

```bash
cd frontend

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test ServiceCard.test.tsx

# Run tests in CI mode
npm run test:ci
```

#### E2E Test Commands

```bash
cd frontend

# Open Cypress GUI
npm run cypress:open

# Run E2E tests headlessly
npm run cypress:run

# Run specific spec
npm run cypress:run --spec "cypress/e2e/booking-flow.cy.ts"
```

## 📋 Test Categories

### 1. Unit Tests

**Purpose**: Test individual components in isolation

#### Backend Unit Tests

```python
# Example: Model test
def test_booking_creation():
    user = UserFactory()
    service = ServiceFactory()

    booking = Booking.objects.create(
        customer=user,
        service=service,
        booking_date='2024-12-25',
        booking_time='10:00:00'
    )

    assert booking.status == 'pending'
    assert booking.total_amount > 0
```

#### Frontend Unit Tests

```typescript
// Example: Component test
import { render, screen } from "@testing-library/react";
import { ServiceCard } from "./ServiceCard";

test("renders service information correctly", () => {
  const mockService = {
    id: "1",
    name: "Plumbing Service",
    provider: "John Doe",
    price: 1500,
  };

  render(<ServiceCard service={mockService} />);

  expect(screen.getByText("Plumbing Service")).toBeInTheDocument();
  expect(screen.getByText("Rs. 1500")).toBeInTheDocument();
});
```

### 2. Integration Tests

**Purpose**: Test component interactions and workflows

#### Backend Integration Tests

```python
# Example: API endpoint test
def test_booking_creation_api():
    url = reverse('booking-list')
    data = {
        'service': service.id,
        'booking_date': '2024-12-25',
        'booking_time': '10:00:00'
    }

    response = client.post(url, data, format='json')

    assert response.status_code == 201
    assert Booking.objects.count() == 1
```

#### Frontend Integration Tests

```typescript
// Example: User interaction test
import { render, screen, fireEvent } from "@testing-library/react";
import { BookingForm } from "./BookingForm";

test("submits booking form correctly", async () => {
  const mockOnSubmit = jest.fn();

  render(<BookingForm onSubmit={mockOnSubmit} />);

  fireEvent.change(screen.getByLabelText("Date"), {
    target: { value: "2024-12-25" },
  });
  fireEvent.click(screen.getByText("Book Now"));

  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalledWith({
      date: "2024-12-25",
    });
  });
});
```

### 3. End-to-End Tests

**Purpose**: Test complete user journeys

```typescript
// Example: Cypress E2E test
describe("Booking Flow", () => {
  it("completes full booking process", () => {
    cy.visit("/services");
    cy.get('[data-testid="service-card"]').first().click();
    cy.get('[data-testid="book-now-button"]').click();
    cy.get('[data-testid="date-picker"]').type("2024-12-25");
    cy.get('[data-testid="time-slot"]').first().click();
    cy.get('[data-testid="submit-booking"]').click();

    cy.url().should("include", "/booking/confirmation");
    cy.get('[data-testid="booking-success"]').should("be.visible");
  });
});
```

## 📈 Test Development Workflow

### 1. Test-Driven Development (TDD)

```text
Write Test → Test Fails → Write Code → Test Passes → Refactor
```

### 2. Testing Checklist

Before submitting code:

- [ ] All tests pass
- [ ] New features have tests
- [ ] Coverage targets met
- [ ] No console errors
- [ ] Accessibility tests pass

### 3. Continuous Integration

- Tests run automatically on every commit
- Coverage reports generated
- Failed tests block deployment
- Performance benchmarks tracked

## 🎨 Best Practices

### Backend Testing Best Practices

- **Use Factories**: Generate consistent test data with Factory Boy
- **Test Edge Cases**: Invalid data, permissions, error conditions
- **Mock External Services**: Don't rely on external APIs in tests
- **Database Isolation**: Each test uses a clean database state
- **Test Business Logic**: Focus on what the code should do, not how

### Frontend Testing Best Practices

- **Test User Behavior**: Test what users see and do, not implementation
- **Use Data Test IDs**: Stable selectors for UI elements
- **Mock API Calls**: Use MSW or Jest mocks for API responses
- **Test Accessibility**: Ensure components work with screen readers
- **Avoid Implementation Details**: Test behavior, not internal state

### General Testing Best Practices

- **Clear Test Names**: Describe what is being tested and expected outcome
- **Arrange-Act-Assert**: Structure tests clearly
- **One Assertion Per Test**: Keep tests focused and specific
- **Independent Tests**: Tests should not depend on each other
- **Fast Tests**: Keep test suite execution time reasonable

## 📊 Understanding Test Results

### Backend Test Output

```text
============================= test session starts ==============================
collected 45 items

apps/accounts/tests.py::test_user_creation PASSED                    [  2%]
apps/services/tests.py::test_service_creation PASSED                 [  4%]
apps/bookings/tests.py::test_booking_flow PASSED                     [  6%]

============================== 45 passed in 2.34s ==============================
```

### Frontend Test Output

```text
 PASS  src/components/ServiceCard.test.tsx
  ServiceCard
    ✓ renders service information (92 ms)
    ✓ handles click events (14 ms)
    ✓ displays loading state (6 ms)

Test Suites: 15 passed, 15 total
Tests:       87 passed, 87 total
Coverage:    85.2% of statements
```

### Coverage Report

```text
---------- coverage: platform win32 -----------
Name                           Stmts   Miss  Cover   Missing
------------------------------------------------------------
apps/accounts/models.py           45      2    96%   89-90
apps/services/views.py            78      5    94%   156-160
src/components/ServiceCard.tsx    67      3    96%   134-136
------------------------------------------------------------
TOTAL                           1,234     67    95%
```

## 🔧 Test Configuration

### Backend Test Settings

```python
# backend/pytest.ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = sewabazaar.settings.test
addopts = --cov=apps --cov-report=html --cov-report=term-missing
testpaths = apps
python_files = tests.py test_*.py *_tests.py
```

### Frontend Test Configuration

```javascript
// frontend/jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 🚨 Troubleshooting

### Common Issues

#### Tests Running Slowly

- Check for unneeded database queries
- Use factories instead of creating data manually
- Mock external services properly

#### Flaky Tests

- Avoid time-dependent tests
- Use proper async/await in frontend tests
- Clean up side effects between tests

#### Low Coverage

- Identify untested code paths
- Add tests for error conditions
- Test both success and failure scenarios

#### Frontend Test Failures

- Check for proper mocking of Next.js features
- Ensure proper cleanup of state between tests
- Use proper async testing patterns

## 📚 Additional Resources

### Documentation Links

- [Backend Testing Details](./BACKEND_TESTING.md)
- [Frontend Testing Details](./FRONTEND_TESTING.md)
- [E2E Testing Guide](./E2E_TESTING.md)

### External Resources

- [Django Testing Documentation](https://docs.djangoproject.com/en/4.2/topics/testing/)
- [React Testing Library Guide](https://testing-library.com/docs/react-testing-library/intro)
- [Cypress Documentation](https://docs.cypress.io/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## Testing Philosophy

Testing is not about proving that your code works—it's about building confidence
that it will continue to work. Happy testing! 🧪
