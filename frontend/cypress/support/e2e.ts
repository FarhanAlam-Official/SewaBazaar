// Import Cypress commands
import './commands'

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that are not related to our tests
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  return true
})

// Global hooks
beforeEach(() => {
  // Clear local storage and cookies before each test
  cy.clearLocalStorage()
  cy.clearCookies()
  
  // Set up API interceptors for common endpoints
  cy.intercept('GET', '/api/auth/me/', { fixture: 'provider-profile.json' }).as('getProfile')
  cy.intercept('GET', '/api/provider/dashboard/', { fixture: 'dashboard-stats.json' }).as('getDashboard')
  cy.intercept('GET', '/api/provider/bookings/', { fixture: 'provider-bookings.json' }).as('getBookings')
  cy.intercept('GET', '/api/provider/services/', { fixture: 'provider-services.json' }).as('getServices')
  cy.intercept('GET', '/api/provider/earnings/', { fixture: 'provider-earnings.json' }).as('getEarnings')
  cy.intercept('GET', '/api/notifications/', { fixture: 'notifications.json' }).as('getNotifications')
})

afterEach(() => {
  // Clean up after each test
  cy.task('log', `Test completed: ${Cypress.currentTest.title}`)
})

// Custom assertions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as provider
       */
      loginAsProvider(): Chainable<void>
      
      /**
       * Custom command to login as customer
       */
      loginAsCustomer(): Chainable<void>
      
      /**
       * Custom command to wait for dashboard to load
       */
      waitForDashboard(): Chainable<void>
      
      /**
       * Custom command to navigate to provider section
       */
      navigateToProviderSection(section: string): Chainable<void>
      
      /**
       * Custom command to create test booking
       */
      createTestBooking(serviceId: number): Chainable<void>
      
      /**
       * Custom command to verify notification
       */
      verifyNotification(message: string): Chainable<void>
      
      /**
       * Custom command to wait for API calls
       */
      waitForApiCalls(): Chainable<void>
      
      /**
       * Custom command to seed test data
       */
      seedTestData(): Chainable<void>
      
      /**
       * Custom command to check accessibility
       */
      checkA11y(): Chainable<void>
    }
  }
}