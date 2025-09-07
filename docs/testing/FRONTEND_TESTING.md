# Frontend Testing

This document covers how to write and run tests for the frontend of SewaBazaar.

## Types of Tests

### 1. Unit Tests

Unit tests test individual components in isolation. We use Jest and React Testing Library for unit testing.

Example of a unit test:

```jsx
import { render, screen } from '@testing-library/react'
import Button from '@/components/common/Button'

describe('Button component', () => {
  it('renders correctly', () => {
    render(<Button label="Click me" />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button label="Click me" onClick={handleClick} />)
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### 2. Integration Tests

Integration tests verify that multiple components work together correctly. We also use Jest and React Testing Library for these.

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import ServiceCard from '@/components/services/ServiceCard'
import { AppProvider } from '@/context/AppContext'

describe('ServiceCard integration', () => {
  it('adds service to favorites when favorite button is clicked', () => {
    render(
      <AppProvider>
        <ServiceCard 
          id="123" 
          title="Plumbing Service" 
          price={1500} 
        />
      </AppProvider>
    )
    
    const favoriteButton = screen.getByLabelText('Add to favorites')
    fireEvent.click(favoriteButton)
    
    // Check if component shows as favorited
    expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument()
  })
})
```

### 3. End-to-End Tests

End-to-end tests simulate user flows through the entire application. We use Cypress for E2E testing.

```js
// cypress/e2e/booking.cy.js
describe('Booking Flow', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password123')
  })

  it('allows a user to book a service', () => {
    // Visit service page
    cy.visit('/services/plumbing')
    
    // Click book now button
    cy.contains('Book Now').click()
    
    // Fill in booking details
    cy.get('[data-testid="date-picker"]').click()
    cy.contains('15').click()
    cy.get('[data-testid="time-slot"]').select('10:00 AM')
    
    // Submit booking
    cy.contains('Confirm Booking').click()
    
    // Verify success message
    cy.contains('Booking Confirmed').should('be.visible')
  })
})
```

## Running Tests

### 1. Run All Frontend Tests

```bash
# From project root
python -m tests.run_tests --frontend
```

### 2. Run Specific Test Types

```bash
# Run only unit tests
python -m tests.run_tests --frontend --unit

# Run only integration tests 
python -m tests.run_tests --frontend --integration

# Run end-to-end tests
python -m tests.run_tests --frontend --e2e
```

### 3. Run Tests with Coverage

```bash
python -m tests.run_tests --frontend --coverage
```

### 4. Run Tests in Watch Mode

```bash
# From the frontend directory
npm test -- --watch
```

### 5. Running Cypress E2E Tests Directly

```bash
# Open Cypress test runner
cd frontend
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run
```

## File Naming Conventions

To maintain consistency across our test files, we follow these naming conventions:

### 1. Component Test Files

Component test files should use the `.test.tsx` extension and have the same name as the component they test:

```text
Button.tsx          → Button.test.tsx
ServiceCard.tsx     → ServiceCard.test.tsx
LoginForm.tsx       → LoginForm.test.tsx
```

### 2. Utility/Service Test Files

Service and utility test files should also use the `.test.ts` extension:

```text
timeSlotService.ts  → timeSlotService.test.ts
authService.ts      → authService.test.ts
```

### 3. Page Test Files

Page component test files follow the same pattern:

```text
page.tsx            → page.test.tsx
```

### 4. Cypress End-to-End Tests

Cypress test files should use the `.cy.js` extension:

```text
auth.cy.js
booking.cy.js
search.cy.js
```

### 5. Test File Location

Test files should be placed in one of these locations:

1. **Co-located with the component** (preferred for component tests):

   ```text
   components/services/ServiceCard.tsx
   components/services/ServiceCard.test.tsx
   ```

2. **In a `__tests__` directory** (for groups of related tests):

   ```text
   components/ui/__tests__/animation-components.test.tsx
   ```

3. **In the tests directory** (for new tests under our structure):

   ```text
   tests/frontend/unit/components/Button.test.tsx
   tests/frontend/integration/services/ServiceListing.test.tsx
   ```

## API Mocking

For mocking API calls, we use `jest.mock()` to mock our API service modules:

```jsx
// Mocking example
import { render, screen, waitFor } from '@testing-library/react'
import ServiceList from '@/components/services/ServiceList'
import { fetchServices } from '@/api/services'

// Mock the API module
jest.mock('@/api/services')

describe('ServiceList', () => {
  it('renders services from API', async () => {
    // Setup the mock return value
    fetchServices.mockResolvedValue([
      { id: '1', title: 'Plumbing', price: 1500 },
      { id: '2', title: 'Electrician', price: 2000 }
    ])
    
    render(<ServiceList />)
    
    // Wait for the services to load
    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument()
      expect(screen.getByText('Electrician')).toBeInTheDocument()
    })
  })
})
```

### 3. End-to-End Tests

End-to-end tests simulate user flows through the entire application. We use Cypress for E2E testing.

```js
// cypress/e2e/booking.cy.js
describe('Booking Flow', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password123')
  })

  it('allows a user to book a service', () => {
    // Visit service page
    cy.visit('/services/plumbing')
    
    // Click book now button
    cy.contains('Book Now').click()
    
    // Fill in booking details
    cy.get('[data-testid="date-picker"]').click()
    cy.contains('15').click()
    cy.get('[data-testid="time-slot"]').select('10:00 AM')
    
    // Submit booking
    cy.contains('Confirm Booking').click()
    
    // Verify success message
    cy.contains('Booking Confirmed').should('be.visible')
  })
})
```

## Running Test

### 1. Run All Frontend Tests

```bash
# From project root
python -m tests.run_tests --frontend
```

### 2. Run Specific Test Types

```bash
# Run only unit tests
python -m tests.run_tests --frontend --unit

# Run only integration tests 
python -m tests.run_tests --frontend --integration

# Run end-to-end tests
python -m tests.run_tests --frontend --e2e
```

### 3. Run Tests with Coverage

```bash
python -m tests.run_tests --frontend --coverage
```

### 4. Run Tests in Watch Mode

```bash
# From the frontend directory
npm test -- --watch
```

### 5. Running Cypress E2E Tests Directly

```bash
# Open Cypress test runner
cd frontend
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run
```

## Test Organization

Our tests are organized in a dedicated test directory structure:

```text
tests/
  frontend/
    unit/
      components/
        Button.test.jsx
        Header.test.jsx
      hooks/
        useAuth.test.jsx
    integration/
      services/
        ServiceListing.test.jsx
      booking/
        BookingFlow.test.jsx
    e2e/
      cypress/
        e2e/
          auth.cy.js
          booking.cy.js
          search.cy.js
```

## API Mockings

For mocking API calls, we use `jest.mock()` to mock our API service modules:

```jsx
// Mocking example
import { render, screen, waitFor } from '@testing-library/react'
import ServiceList from '@/components/services/ServiceList'
import { fetchServices } from '@/api/services'

// Mock the API module
jest.mock('@/api/services')

describe('ServiceList', () => {
  it('renders services from API', async () => {
    // Setup the mock return value
    fetchServices.mockResolvedValue([
      { id: '1', title: 'Plumbing', price: 1500 },
      { id: '2', title: 'Electrician', price: 2000 }
    ])
    
    render(<ServiceList />)
    
    // Wait for the services to load
    await waitFor(() => {
      expect(screen.getByText('Plumbing')).toBeInTheDocument()
      expect(screen.getByText('Electrician')).toBeInTheDocument()
    })
  })
})
```

## 📈 Best Practices

### 1. **Test Naming**

- Use descriptive names: `test_renders_service_card_with_all_information`
- Follow pattern: `test_[what]_[when]_[expected_result]`

### 2. **Test Organization**

- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Keep tests independent

### 3. **Testing Philosophy**

- **Test behavior, not implementation**: Test what the component does, not how it does it
- **Test like a user**: Use queries that users would use (getByText, getByRole)
- **Avoid testing implementation details**: Don't test private methods or internal state

### 4. **Common Queries (in order of preference)**

```typescript
// 1. getByRole (most accessible)
screen.getByRole('button', { name: 'Submit' })

// 2. getByLabelText (for form inputs)
screen.getByLabelText('Email')

// 3. getByText (for visible text)
screen.getByText('Welcome to SewaBazaar')

// 4. getByTestId (last resort)
screen.getByTestId('submit-button')
```

## 🚨 Troubleshooting

### Common Issues

1. **TypeScript Errors**

   ```bash
   # Make sure types are properly set up
   npm install --save-dev @types/jest @testing-library/jest-dom
   ```

2. **Import Errors**

   ```bash
   # Check if path aliases are configured in jest.config.js
   moduleNameMapper: {
     '^@/(.*)$': '<rootDir>/src/$1'
   }
   ```

3. **Mock Issues**

   ```bash
   # Clear Jest cache
   npm test -- --clearCache
   ```

### Debugging Tests

```typescript
it('debug example', () => {
  render(<ServiceCard service={mockService} />)
  
  // Print the rendered HTML
  screen.debug()
  
  // Or print specific element
  screen.debug(screen.getByText('Plumbing Service'))
})
```

## 🔧 Configuration Files Explained

### 1. **jest.config.js**

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### 2. **jest.setup.js**

```javascript
import '@testing-library/jest-dom'

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />
}))

// Mock external libraries
jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> }
}))
```

## 📚 Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

## 🎉 Next Steps

1. **Start Simple**: Write basic rendering tests first
2. **Add Interactions**: Test user interactions like clicks and form submissions
3. **Test Edge Cases**: Test error states and edge cases
4. **Add Coverage**: Aim for 80%+ code coverage
5. **Practice**: Write tests for new components

## 💡 Pro Tips

- **Use screen.debug()** to see what's actually rendered
- **Test accessibility** by using getByRole queries
- **Keep tests simple** - one assertion per test when possible
- **Use data-testid sparingly** - prefer semantic queries
- **Test error states** - what happens when things go wrong?

Remember: **Good frontend tests make your app more reliable and easier to maintain!** They help you catch UI bugs before users do.
