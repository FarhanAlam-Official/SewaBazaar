# Frontend Testing Guide for SewaBazaar

## 🎯 What is Frontend Testing?

Frontend testing is like testing the user interface of your website. It makes sure that buttons work, forms submit correctly, and users can interact with your app without problems. Think of it as testing the "face" of your application!

## 📚 Testing Concepts Explained

### 1. **Unit Tests**
- **What**: Testing individual components or functions in isolation
- **Example**: Testing if a button component renders correctly
- **Why**: To make sure each UI component works properly

### 2. **Integration Tests**
- **What**: Testing how components work together
- **Example**: Testing if a form submission updates the page correctly
- **Why**: To ensure different parts of the UI work well together

### 3. **User Interaction Tests**
- **What**: Testing how users interact with your app
- **Example**: Testing if clicking a button triggers the right action
- **Why**: To make sure the app responds correctly to user actions

### 4. **Accessibility Tests**
- **What**: Testing if your app is usable by people with disabilities
- **Example**: Testing if screen readers can read your content
- **Why**: To make your app accessible to everyone

## 🛠️ Tools We Use

### 1. **Jest** (Main Testing Framework)
```bash
# Install Jest
npm install --save-dev jest

# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 2. **React Testing Library** (Component Testing)
- **What**: Helps you test React components like a real user would
- **Why**: More reliable than testing implementation details

### 3. **Coverage** (Code Coverage Tool)
- **What**: Shows how much of your code is tested
- **Goal**: Aim for 80%+ coverage
- **Command**: `npm run test:coverage`

## 📁 Test File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── services/
│   │   │   ├── ServiceCard.tsx
│   │   │   └── ServiceCard.test.tsx    # Tests for ServiceCard
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx         # Tests for Button
│   │   └── forms/
│   │       ├── LoginForm.tsx
│   │       └── LoginForm.test.tsx      # Tests for LoginForm
├── jest.config.js                      # Jest configuration
├── jest.setup.js                       # Jest setup file
└── src/types/jest.d.ts                 # TypeScript types for Jest
```

## 🧪 How to Write Tests

### Basic Test Structure

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ServiceCard } from './ServiceCard'

describe('ServiceCard', () => {
  it('renders service information correctly', () => {
    // Arrange: Prepare test data
    const mockService = {
      id: '1',
      name: 'Plumbing Service',
      provider: 'John Doe',
      price: 1500,
      rating: 4.5
    }
    
    // Act: Render the component
    render(<ServiceCard service={mockService} />)
    
    // Assert: Check if it rendered correctly
    expect(screen.getByText('Plumbing Service')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Rs. 1500')).toBeInTheDocument()
  })
})
```

### Testing User Interactions

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('calls onClick when clicked', () => {
    // Arrange: Create a mock function
    const mockOnClick = jest.fn()
    
    // Act: Render and click the button
    render(<Button onClick={mockOnClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    
    // Assert: Check if the function was called
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})
```

## 🚀 Running Tests

### 1. **Run All Tests**
```bash
cd frontend
npm test
```

### 2. **Run Tests in Watch Mode**
```bash
npm run test:watch
```

### 3. **Run Tests with Coverage**
```bash
npm run test:coverage
```

### 4. **Run Tests in CI Mode**
```bash
npm run test:ci
```

## 📊 Understanding Test Results

### Test Output Example
```
 PASS  src/components/services/ServiceCard.test.tsx
  ServiceCard
    ✓ renders service information correctly (92 ms)
    ✓ renders service image with correct alt text (7 ms)
    ✓ displays star rating correctly (6 ms)
    ✓ calls onAction when action button is clicked (14 ms)
    ✓ handles missing optional fields gracefully (3 ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        1.52 s
```

### Coverage Report Example
```
---------- coverage: platform win32, node 18.0.0 -----------
File                           | % Stmts | % Branch | % Funcs | % Lines
----------------------------------------------------------------------
All files                      |   85.23 |    78.45 |   82.10 |   85.23
 src/components/services/      |   92.50 |    88.00 |   90.00 |   92.50
  ServiceCard.tsx             |   92.50 |    88.00 |   90.00 |   92.50
 src/components/ui/           |   78.95 |    70.00 |   75.00 |   78.95
  Button.tsx                  |   78.95 |    70.00 |   75.00 |   78.95
----------------------------------------------------------------------
```

## 🔧 Test Categories Explained

### 1. **Component Rendering Tests**
```typescript
it('renders with all required props', () => {
  render(<ServiceCard service={mockService} />)
  
  expect(screen.getByText('Plumbing Service')).toBeInTheDocument()
  expect(screen.getByText('John Doe')).toBeInTheDocument()
  expect(screen.getByText('Rs. 1500')).toBeInTheDocument()
})
```

### 2. **User Interaction Tests**
```typescript
it('handles button clicks correctly', () => {
  const mockOnAction = jest.fn()
  render(
    <ServiceCard 
      service={mockService} 
      onAction={mockOnAction}
      actionLabel="Book Now"
    />
  )
  
  fireEvent.click(screen.getByText('Book Now'))
  expect(mockOnAction).toHaveBeenCalledWith('1')
})
```

### 3. **Props and State Tests**
```typescript
it('renders different variants correctly', () => {
  const { rerender } = render(<ServiceCard service={mockService} variant="default" />)
  expect(screen.getByText('Plumbing Service')).toBeInTheDocument()
  
  rerender(<ServiceCard service={mockService} variant="history" />)
  expect(screen.getByText('Plumbing Service')).toBeInTheDocument()
})
```

### 4. **Error Handling Tests**
```typescript
it('handles missing data gracefully', () => {
  const incompleteService = {
    id: '1',
    name: 'Service',
    provider: 'Provider',
    price: 100,
    rating: 0
  }
  
  render(<ServiceCard service={incompleteService} />)
  expect(screen.getByText('Service')).toBeInTheDocument()
  expect(screen.getByText('0')).toBeInTheDocument()
})
```

### 5. **Accessibility Tests**
```typescript
it('maintains accessibility features', () => {
  render(<ServiceCard service={mockService} />)
  
  // Check for proper image alt text
  expect(screen.getByAltText('Plumbing Service')).toBeInTheDocument()
  
  // Check for proper heading structure
  expect(screen.getByRole('heading')).toBeInTheDocument()
})
```

## 🐛 Common Testing Patterns

### 1. **Mocking External Dependencies**
```typescript
// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pathname: '/',
      query: {}
    }
  }
}))

// Mock API calls
jest.mock('@/lib/api', () => ({
  fetchServices: jest.fn(() => Promise.resolve([]))
}))
```

### 2. **Testing Async Operations**
```typescript
it('loads data asynchronously', async () => {
  render(<ServiceList />)
  
  // Wait for loading to complete
  await screen.findByText('Plumbing Service')
  
  expect(screen.getByText('Plumbing Service')).toBeInTheDocument()
})
```

### 3. **Testing Form Submissions**
```typescript
it('submits form with correct data', async () => {
  const mockSubmit = jest.fn()
  render(<LoginForm onSubmit={mockSubmit} />)
  
  // Fill out the form
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password123' }
  })
  
  // Submit the form
  fireEvent.click(screen.getByText('Login'))
  
  expect(mockSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
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

