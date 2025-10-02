# Provider Dashboard E2E Testing Suite

This directory contains comprehensive end-to-end tests for the Provider Dashboard using Cypress.

## Overview

The E2E testing suite covers:

- Critical user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance testing
- Visual regression testing
- API integration testing

## Test Structure

```bash
cypress/
├── e2e/                          # E2E test files
│   ├── smoke/                    # Smoke tests for critical paths
│   ├── performance/              # Performance and load time tests
│   ├── visual/                   # Visual regression tests
│   └── provider-dashboard-workflow.cy.ts  # Main workflow tests
├── fixtures/                     # Test data fixtures
├── support/                      # Support files and custom commands
│   ├── commands.ts              # Custom Cypress commands
│   └── e2e.ts                   # Global configuration and hooks
├── screenshots/                  # Test screenshots (auto-generated)
├── videos/                      # Test videos (auto-generated)
└── reports/                     # Test reports (auto-generated)
```

## Test Categories

### 1. Smoke Tests (`cypress/e2e/smoke/`)

Quick tests that verify critical functionality is working:

- Dashboard loads successfully
- Navigation works
- Authentication is functional
- Basic API connectivity

**Run with:** `npm run test:e2e:smoke`

### 2. Full Workflow Tests (`provider-dashboard-workflow.cy.ts`)

Comprehensive tests covering:

- Dashboard overview and statistics
- Bookings management (view, filter, update status)
- Services management (CRUD operations)
- Earnings tracking and reporting
- Profile management
- Notifications system
- Real-time updates

**Run with:** `npm run test:e2e`

### 3. Performance Tests (`cypress/e2e/performance/`)

Tests focused on performance metrics:

- Page load times
- API response times
- Chart rendering performance
- Large dataset handling

**Run with:** `npm run test:e2e:performance`

### 4. Cross-Browser Tests

Tests run across multiple browsers:

- Chrome
- Firefox
- Edge

**Run with:** `npm run test:e2e:cross-browser`

### 5. Mobile Tests

Tests on mobile viewports:

- Responsive design
- Touch interactions
- Mobile navigation

**Run with:** `npm run test:e2e:mobile`

## Custom Commands

The test suite includes custom Cypress commands for common operations:

### Authentication

```typescript
cy.loginAsProvider()     // Login as test provider
cy.loginAsCustomer()     // Login as test customer
```

### Navigation

```typescript
cy.navigateToProviderSection('bookings')  // Navigate to specific section
cy.waitForDashboard()                     // Wait for dashboard to load
```

### Data Management

```typescript
cy.createTestBooking(serviceId)           // Create test booking
cy.seedTestData()                         // Seed test database
```

### Assertions

```typescript
cy.verifyNotification('Success message')  // Verify toast notification
cy.checkA11y()                           // Check accessibility
```

### Performance

```typescript
cy.measurePageLoad('Dashboard')           // Measure page load time
```

## Test Data

Test fixtures are located in `cypress/fixtures/`:

- `provider-profile.json` - Test provider profile data
- `dashboard-stats.json` - Dashboard statistics data
- `provider-bookings.json` - Sample bookings data
- `provider-services.json` - Sample services data
- `notifications.json` - Sample notifications data

## Configuration

### Environment Variables

Set in `cypress.config.ts` or via command line:

- `baseUrl` - Application base URL
- `apiUrl` - API base URL
- `providerEmail` - Test provider email
- `providerPassword` - Test provider password

### Test Environments

- **Local**: `http://localhost:3000`
- **Staging**: `https://staging.sewabazaar.com`
- **Production**: `https://sewabazaar.com`

## Running Tests

### Prerequisites

1. Install dependencies: `npm install`
2. Start the application: `npm run dev`
3. Ensure backend API is running

### Command Line Options

```bash
# Run all E2E tests
npm run test:e2e

# Run smoke tests only
npm run test:e2e:smoke

# Run tests on specific environment
node run-e2e-tests.js full staging

# Open Cypress Test Runner (interactive)
npm run test:e2e:open

# Run CI pipeline tests
npm run test:e2e:ci

# Run performance tests
npm run test:e2e:performance

# Run cross-browser tests
npm run test:e2e:cross-browser

# Run mobile tests
npm run test:e2e:mobile
```

### Test Runner Script

The `run-e2e-tests.js` script provides advanced testing options:

```bash
# Available commands
node run-e2e-tests.js <command> [environment]

# Commands:
#   smoke         - Run smoke tests
#   full          - Run full test suite
#   mobile        - Run mobile tests
#   cross-browser - Run cross-browser tests
#   visual        - Run visual regression tests
#   performance   - Run performance tests
#   open          - Open Cypress Test Runner
#   report        - Generate test report
#   ci            - Run CI/CD pipeline

# Examples:
node run-e2e-tests.js smoke local
node run-e2e-tests.js full staging
node run-e2e-tests.js ci production
```

## CI/CD Integration

### Pipeline Tests

The CI pipeline runs tests in this order:

1. **Smoke Tests** - Quick validation
2. **Full Test Suite** - Comprehensive testing
3. **Mobile Tests** - Mobile compatibility
4. **Cross-Browser Tests** - Browser compatibility
5. **Report Generation** - Test results and coverage

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: |
    npm install
    npm run build
    npm run test:e2e:ci staging
```

## Test Reports

Test reports are generated in multiple formats:

- **HTML Report**: `cypress/reports/index.html`
- **JSON Report**: `cypress/reports/results.json`
- **Screenshots**: `cypress/screenshots/`
- **Videos**: `cypress/videos/`

## Best Practices

### Writing Tests

1. **Use data-testid attributes** for reliable element selection
2. **Mock API responses** for consistent test data
3. **Test user workflows** rather than implementation details
4. **Keep tests independent** - each test should be able to run in isolation
5. **Use descriptive test names** that explain what is being tested

### Test Data

1. **Use fixtures** for consistent test data
2. **Clean up after tests** to avoid side effects
3. **Use realistic data** that matches production scenarios

### Performance

1. **Minimize API calls** during test setup
2. **Use cy.intercept()** to mock slow API responses
3. **Measure and assert on performance metrics**

### Debugging

1. **Use cy.debug()** to pause test execution
2. **Take screenshots** at key points
3. **Use browser dev tools** in interactive mode
4. **Check network tab** for API issues

## Troubleshooting

### Common Issues

**Tests failing due to timing issues:**

- Increase timeout values in `cypress.config.ts`
- Use `cy.wait()` for specific API calls
- Add explicit waits for elements: `cy.get('[data-testid="element"]', { timeout: 10000 })`

**Authentication issues:**

- Check test credentials in environment variables
- Verify API endpoints are correct
- Clear browser storage between tests

**Element not found:**

- Verify `data-testid` attributes exist in components
- Check if element is visible: `cy.get('[data-testid="element"]').should('be.visible')`
- Wait for page to load completely

**API mocking issues:**

- Verify intercept patterns match actual API calls
- Check fixture files exist and have correct data
- Use `cy.wait('@aliasName')` to ensure intercepts are triggered

Common causes:

1. Missing or incorrectly structured fixture files
2. Environment variables not properly configured
3. Custom commands not being loaded correctly

### Debug Mode

Run tests in debug mode:

```bash
# Open Cypress Test Runner for debugging
npm run cypress:open

# Run specific test file
npx cypress run --spec "cypress/e2e/provider-dashboard-workflow.cy.ts"

# Run with debug output
DEBUG=cypress:* npm run test:e2e
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Add appropriate `data-testid` attributes to new components
3. Update fixtures if new test data is needed
4. Document any new custom commands
5. Ensure tests pass in all supported browsers

## Support

For issues with the E2E testing suite:

1. Check this documentation first
2. Review Cypress documentation: <https://docs.cypress.io/>
3. Check existing issues in the project repository
4. Create a new issue with detailed reproduction steps
