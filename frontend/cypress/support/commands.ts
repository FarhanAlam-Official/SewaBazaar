/// <reference types="cypress" />

// Authentication Commands
Cypress.Commands.add('loginAsProvider', () => {
  cy.session('provider-session', () => {
    cy.visit('/auth/login')
    
    // Fill login form
    cy.get('[data-testid="email-input"]').type(Cypress.env('providerEmail'))
    cy.get('[data-testid="password-input"]').type(Cypress.env('providerPassword'))
    cy.get('[data-testid="login-button"]').click()
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard/provider')
    cy.get('[data-testid="provider-dashboard"]').should('be.visible')
  })
})

Cypress.Commands.add('loginAsCustomer', () => {
  cy.session('customer-session', () => {
    cy.visit('/auth/login')
    
    // Fill login form
    cy.get('[data-testid="email-input"]').type(Cypress.env('customerEmail'))
    cy.get('[data-testid="password-input"]').type(Cypress.env('customerPassword'))
    cy.get('[data-testid="login-button"]').click()
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="customer-dashboard"]').should('be.visible')
  })
})

// Navigation Commands
Cypress.Commands.add('waitForDashboard', () => {
  // Wait for dashboard stats to load
  cy.wait('@getDashboard')
  cy.get('[data-testid="dashboard-stats"]').should('be.visible')
  
  // Wait for loading states to complete
  cy.get('[data-testid="loading-spinner"]').should('not.exist')
  cy.get('[data-testid="error-message"]').should('not.exist')
})

Cypress.Commands.add('navigateToProviderSection', (section: string) => {
  const sectionMap = {
    'dashboard': '/dashboard/provider',
    'bookings': '/dashboard/provider/bookings',
    'services': '/dashboard/provider/services',
    'earnings': '/dashboard/provider/earnings',
    'profile': '/dashboard/provider/profile',
    'schedule': '/dashboard/provider/schedule',
    'analytics': '/dashboard/provider/analytics',
    'notifications': '/dashboard/provider/notifications'
  }
  
  const url = sectionMap[section as keyof typeof sectionMap]
  if (!url) {
    throw new Error(`Unknown provider section: ${section}`)
  }
  
  cy.visit(url)
  cy.get(`[data-testid="${section}-page"]`).should('be.visible')
})

// Data Management Commands
Cypress.Commands.add('createTestBooking', (serviceId: number) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/bookings/`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
    },
    body: {
      service: serviceId,
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      scheduled_time: '10:00:00',
      address: '123 Test Street, Test City',
      notes: 'Test booking created by Cypress'
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    cy.wrap(response.body.id).as('testBookingId')
  })
})

Cypress.Commands.add('verifyNotification', (message: string) => {
  // Check for toast notification
  cy.get('[data-testid="toast-notification"]', { timeout: 10000 })
    .should('be.visible')
    .and('contain.text', message)
  
  // Wait for notification to disappear
  cy.get('[data-testid="toast-notification"]', { timeout: 10000 }).should('not.exist')
})

Cypress.Commands.add('waitForApiCalls', () => {
  // Wait for common API calls to complete
  cy.wait(['@getProfile', '@getDashboard'], { timeout: 15000 })
})

Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase')
})

// Accessibility Commands
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt')
  })
  
  cy.get('button, a').each(($el) => {
    cy.wrap($el).should('be.visible').and('not.be.disabled')
  })
  
  // Check for proper heading hierarchy
  cy.get('h1').should('have.length.at.most', 1)
  cy.get('h1, h2, h3, h4, h5, h6').should('be.visible')
})

// Utility Commands
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`)
})

// Form Helpers
Cypress.Commands.add('fillServiceForm', (serviceData: any) => {
  cy.get('[data-testid="service-title-input"]').clear().type(serviceData.title)
  cy.get('[data-testid="service-description-input"]').clear().type(serviceData.description)
  cy.get('[data-testid="service-price-input"]').clear().type(serviceData.price.toString())
  cy.get('[data-testid="service-duration-input"]').clear().type(serviceData.duration.toString())
  
  if (serviceData.category) {
    cy.get('[data-testid="service-category-select"]').select(serviceData.category)
  }
})

// API Mocking Helpers
Cypress.Commands.add('mockApiError', (endpoint: string, statusCode: number = 500) => {
  cy.intercept('GET', endpoint, {
    statusCode,
    body: { error: 'Internal Server Error' }
  }).as('apiError')
})

Cypress.Commands.add('mockApiSuccess', (endpoint: string, fixture: string) => {
  cy.intercept('GET', endpoint, { fixture }).as('apiSuccess')
})

// Performance Helpers
Cypress.Commands.add('measurePageLoad', (pageName: string) => {
  cy.window().then((win) => {
    const startTime = win.performance.now()
    
    cy.get('[data-testid="page-loaded"]').should('be.visible').then(() => {
      const endTime = win.performance.now()
      const loadTime = endTime - startTime
      
      cy.task('log', `${pageName} page load time: ${loadTime.toFixed(2)}ms`)
      
      // Assert reasonable load time (less than 3 seconds)
      expect(loadTime).to.be.lessThan(3000)
    })
  })
})

// Screenshot Helpers
Cypress.Commands.add('takeScreenshot', (name: string) => {
  cy.screenshot(name, {
    capture: 'viewport',
    clip: { x: 0, y: 0, width: 1280, height: 720 }
  })
})

// Wait Helpers
Cypress.Commands.add('waitForElement', (selector: string, timeout: number = 10000) => {
  cy.get(selector, { timeout }).should('be.visible')
})

Cypress.Commands.add('waitForText', (text: string, timeout: number = 10000) => {
  cy.contains(text, { timeout }).should('be.visible')
})

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>
      fillServiceForm(serviceData: any): Chainable<void>
      mockApiError(endpoint: string, statusCode?: number): Chainable<void>
      mockApiSuccess(endpoint: string, fixture: string): Chainable<void>
      measurePageLoad(pageName: string): Chainable<void>
      takeScreenshot(name: string): Chainable<void>
      waitForElement(selector: string, timeout?: number): Chainable<void>
      waitForText(text: string, timeout?: number): Chainable<void>
    }
  }
}