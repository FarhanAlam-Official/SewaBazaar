# Provider Dashboard E2E Testing

This document provides a quick start guide for running E2E tests for the Provider Dashboard.

## Quick Start

### Prerequisites
1. Node.js and npm installed
2. Frontend application running on `http://localhost:3000`
3. Backend API running on `http://localhost:8000`

### Installation
```bash
cd frontend
npm install
```

### Running Tests

#### Basic Commands
```bash
# Run validation tests (no server required)
npm run test:e2e:validation

# Run smoke tests (server independent)
npm run test:e2e:smoke

# Run all smoke tests (requires server)
npm run test:e2e:smoke-all

# Run full test suite
npm run test:e2e

# Open Cypress Test Runner (interactive)
npm run test:e2e:open

# Run mobile tests
npm run test:e2e:mobile

# Run cross-browser tests
npm run test:e2e:cross-browser

# Run performance tests
npm run test:e2e:performance
```

#### Advanced Commands
```bash
# Run validation without server
node run-e2e-tests.js validation

# Run server-independent smoke tests
node run-e2e-tests.js smoke

# Run all smoke tests (requires server)
node run-e2e-tests.js smoke-all

# Run tests on staging environment
node run-e2e-tests.js full staging

# Run CI pipeline
npm run test:e2e:ci

# Generate test report
node run-e2e-tests.js report
```

## Test Structure

- **Smoke Tests** (`cypress/e2e/smoke/`) - Critical path validation
- **Full Workflow Tests** (`cypress/e2e/provider-dashboard-workflow.cy.ts`) - Complete feature testing
- **Performance Tests** (`cypress/e2e/performance/`) - Load time and performance metrics
- **Fixtures** (`cypress/fixtures/`) - Test data and mock responses

## Key Features Tested

✅ **Dashboard Overview**
- Statistics display
- Charts and analytics
- Recent activities

✅ **Bookings Management**
- View and filter bookings
- Update booking status
- Booking details and actions

✅ **Services Management**
- CRUD operations for services
- Service activation/deactivation
- Portfolio management

✅ **Earnings Tracking**
- Earnings overview and trends
- Transaction history
- Report generation

✅ **Profile Management**
- Profile information updates
- Image uploads
- Verification status

✅ **Notifications**
- Real-time notifications
- Notification preferences
- Mark as read functionality

## Troubleshooting

### Common Issues

**Tests not finding elements:**
- Ensure `data-testid` attributes are present in components
- Check if application is running on correct port

**API-related failures:**
- Verify backend is running and accessible
- Check API endpoints in test fixtures

**Timeout errors:**
- Increase timeout values in `cypress.config.ts`
- Ensure application loads within expected time

### Debug Mode
```bash
# Open Cypress Test Runner for debugging
npm run cypress:open

# Run specific test file
npx cypress run --spec "cypress/e2e/provider-dashboard-workflow.cy.ts"
```

## CI/CD Integration

The E2E tests are configured to run in CI/CD pipelines with:
- Multi-browser testing (Chrome, Firefox, Edge)
- Mobile viewport testing
- Performance monitoring
- Test report generation
- Slack notifications on failure

See `.github/workflows/e2e-tests.yml` for complete CI configuration.

## Documentation

For detailed documentation, see `cypress/README.md`.