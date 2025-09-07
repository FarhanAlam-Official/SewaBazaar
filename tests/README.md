# SewaBazaar Testing Framework

This directory contains the testing framework for the SewaBazaar project. It follows industry best practices for organizing and running tests in a large-scale web application.

## Directory Structure

```txt
tests/
├── conftest.py            # Global pytest configuration and fixtures
├── run_tests.py           # Main test runner script
├── fixtures/              # Shared test fixtures
│   ├── auth_fixtures.py   # Authentication-related fixtures
│   └── db_fixtures.py     # Database-related fixtures
├── backend/               # Backend tests
│   ├── unit/              # Unit tests for backend
│   ├── api/               # API tests
│   └── services/          # Service-layer tests
│       └── payment/       # Payment service tests
├── frontend/              # Frontend tests
│   ├── unit/              # Unit tests for frontend
│   └── components/        # Component tests
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests
```

## Running Tests

### Running All Tests

```bash
python -m tests.run_tests
```

### Running Backend Tests Only

```bash
python -m tests.run_tests --backend
```

### Running Frontend Tests Only

```bash
python -m tests.run_tests --frontend
```

### Running Specific Test Types

```bash
# Run unit tests only
python -m tests.run_tests --unit

# Run API tests only
python -m tests.run_tests --api

# Run integration tests only
python -m tests.run_tests --integration

# Run E2E tests only
python -m tests.run_tests --e2e
```

### Running with Coverage

```bash
python -m tests.run_tests --coverage
```

### Verbose Output

```bash
python -m tests.run_tests --verbose
```

## Adding New Tests

### Backend Tests

1. Create a new test file in the appropriate directory:
   - Unit tests: `tests/backend/unit/`
   - API tests: `tests/backend/api/`
   - Service tests: `tests/backend/services/`

2. Use the pytest marker to categorize your test:

```python
import pytest

@pytest.mark.unit
def test_my_unit_function():
    # Test code here
    pass

@pytest.mark.api
def test_my_api_endpoint():
    # Test code here
    pass
```

### Frontend Tests

1. Create a new test file in the appropriate directory:
   - Unit tests: `tests/frontend/unit/`
   - Component tests: `tests/frontend/components/`

2. Follow the Jest naming convention:
   - `ComponentName.test.tsx` or `FunctionName.test.ts`

```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Test Fixtures

Common test fixtures are available in the `fixtures` directory. These can be imported and used in your tests.

Example:

```python
def test_authenticated_api_call(auth_client):
    client, user = auth_client
    response = client.get('/api/protected-resource/')
    assert response.status_code == 200
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state from other tests.
2. **Mock External Services**: Use mocks for external services like payment gateways.
3. **Meaningful Assertions**: Make assertions that validate the business logic, not just code coverage.
4. **Test Coverage**: Aim for high test coverage, especially for critical business logic.
5. **Clean Setup/Teardown**: Use fixtures for setup and ensure proper teardown after tests.
6. **Clear Test Names**: Name tests clearly to describe what they're testing.
