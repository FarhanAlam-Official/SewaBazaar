# SewaBazaar Test Naming Conventions

This document outlines the naming conventions for test files and directories across the SewaBazaar project.

## Overview

Consistent test naming helps with:

- Easy identification of test files
- Clear understanding of what is being tested
- Improved maintainability
- Better organization

## Global Rules

1. All test files should be easily identifiable as tests
2. The naming pattern should indicate what is being tested
3. Tests should be organized in directories that match the structure of the code they're testing

## Backend Test Naming (Python)

### Test Files

All backend test files should:

- Be prefixed with `test_`
- Use snake_case naming convention
- Have the `.py` extension

Examples:

```text
test_models.py
test_views.py
test_serializers.py
test_api_endpoints.py
test_khalti_integration.py
```

### Test Classes

Test classes should:

- Use PascalCase
- End with `Test` suffix
- Be descriptive of what they're testing

Examples:

```python
class UserModelTest(TestCase):
    """Test cases for User model"""
    pass

class ServiceAPITest(APITestCase):
    """Test cases for Service API endpoints"""
    pass
```

### Test Methods

Test methods should:

- Start with `test_`
- Use snake_case
- Describe the scenario being tested
- Include expected behavior

Examples:

```python
def test_create_user_with_valid_data(self):
    """Test user creation with valid data"""
    pass

def test_service_list_api_returns_200_status(self):
    """Test service list API returns 200 status code"""
    pass
```

## Frontend Test Naming (JavaScript/TypeScript)

### Component Test Files

Component test files should:

- Have the same name as the component they test
- Use the `.test.tsx`, `.test.jsx`, `.test.ts`, or `.test.js` extension
- Use PascalCase for React components

Examples:

```text
Button.tsx          → Button.test.tsx
ServiceCard.tsx     → ServiceCard.test.tsx
LoginForm.tsx       → LoginForm.test.tsx
```

### Utility/Service Test Files

Service and utility test files should:

- Have the same name as the service/utility they test
- Use the `.test.ts` or `.test.js` extension
- Use camelCase for services and utilities

Examples:

```text
timeSlotService.ts  → timeSlotService.test.ts
authService.ts      → authService.test.ts
```

### End-to-End Tests

Cypress test files should:

- Use descriptive names of the flow being tested
- Use the `.cy.js` extension
- Use camelCase

Examples:

```text
auth.cy.js
booking.cy.js
search.cy.js
```

## Directory Structure

### Backend Tests

Backend tests should be organized by test type and feature:

```text
tests/
├── backend/
│   ├── api/                 # API endpoint tests
│   │   ├── test_service_api.py
│   │   └── test_api_endpoints.py
│   ├── services/            # Service tests
│   │   └── payment/
│   │       ├── test_khalti.py
│   │       └── test_khalti_service.py
│   └── unit/                # Unit tests
│       ├── test_models.py
│       └── test_serializers.py
├── conftest.py              # Shared pytest configuration
└── run_tests.py             # Main test runner script
```

### Frontend Tests

Frontend tests can be organized in three ways:

1. **Co-located with components** (recommended for component tests):

   ```text
   src/
   ├── components/
   │   ├── Button/
   │   │   ├── Button.tsx
   │   │   └── Button.test.tsx
   │   └── ServiceCard/
   │       ├── ServiceCard.tsx
   │       └── ServiceCard.test.tsx
   ```

2. **In a dedicated test directory** (for more complex tests or tests that span multiple files):

   ```text
   src/
   ├── __tests__/            # General tests
   │   ├── integration/
   │   └── unit/
   ├── components/
   │   └── ui/
   │       └── __tests__/    # Component-specific tests
   ```

3. **In the tests directory** (for moving to a unified structure):

   ```text
   tests/
   └── frontend/
       ├── unit/
       │   ├── components/
       │   │   └── Button.test.tsx
       │   └── hooks/
       │       └── useAuth.test.tsx
       └── integration/
           └── services/
               └── ServiceListing.test.tsx
   ```

## Implementation Strategy

When creating new test files or refactoring existing ones:

1. Use the naming conventions described in this document
2. Only rename files when necessary (to avoid breaking things)
3. Prioritize test files that are actively being worked on
4. Update references to renamed files in imports and documentation

For existing test files that don't follow these conventions:

- They can be renamed gradually during regular development
- Focus on consistency within new tests first
