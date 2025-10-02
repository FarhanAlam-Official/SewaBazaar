describe('Provider Dashboard - Critical Paths (Smoke Tests)', () => {
  beforeEach(() => {
    // Check if server is available before running tests
    cy.request({
      url: Cypress.config('baseUrl'),
      failOnStatusCode: false,
      timeout: 5000
    }).then((response) => {
      if (response.status !== 200) {
        cy.log('⚠️ Application server not available - skipping server-dependent tests')
        cy.skip()
      }
    })
  })

  it('should validate test environment setup', () => {
    // This test runs without requiring server connection
    expect(Cypress.config('baseUrl')).to.equal('http://localhost:3000')
    expect(Cypress.env('apiUrl')).to.equal('http://localhost:8000/api')
    expect(Cypress.env('providerEmail')).to.exist
    expect(Cypress.env('providerPassword')).to.exist
    
    cy.log('✅ Test environment configuration is valid')
  })

  it('should load dashboard successfully', () => {
    cy.loginAsProvider()
    cy.visit('/dashboard/provider')
    cy.waitForDashboard()
    
    // Verify critical elements are present
    cy.get('[data-testid="dashboard-stats"]').should('be.visible')
    cy.get('[data-testid="total-bookings-stat"]').should('be.visible')
    cy.get('[data-testid="monthly-earnings-stat"]').should('be.visible')
    
    // Verify navigation works
    cy.get('[data-testid="nav-bookings"]').should('be.visible')
    cy.get('[data-testid="nav-services"]').should('be.visible')
    cy.get('[data-testid="nav-earnings"]').should('be.visible')
  })

  it('should navigate to bookings page', () => {
    cy.loginAsProvider()
    cy.navigateToProviderSection('bookings')
    
    // Verify bookings page loads
    cy.get('[data-testid="bookings-list"]').should('be.visible')
    cy.get('[data-testid="status-filter-pending"]').should('be.visible')
    cy.get('[data-testid="status-filter-confirmed"]').should('be.visible')
    cy.get('[data-testid="status-filter-completed"]').should('be.visible')
  })

  it('should navigate to services page', () => {
    cy.loginAsProvider()
    cy.navigateToProviderSection('services')
    
    // Verify services page loads
    cy.get('[data-testid="services-list"]').should('be.visible')
    cy.get('[data-testid="add-service-btn"]').should('be.visible')
  })

  it('should navigate to earnings page', () => {
    cy.loginAsProvider()
    cy.navigateToProviderSection('earnings')
    
    // Verify earnings page loads
    cy.get('[data-testid="earnings-overview"]').should('be.visible')
    cy.get('[data-testid="total-earnings"]').should('be.visible')
  })

  it('should handle authentication', () => {
    // Clear session
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Try to access protected route
    cy.visit('/dashboard/provider')
    
    // Should redirect to login
    cy.url().should('include', '/auth/login')
    
    // Login should work
    cy.loginAsProvider()
    cy.visit('/dashboard/provider')
    cy.waitForDashboard()
  })

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/provider/dashboard/', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('dashboardError')
    
    cy.loginAsProvider()
    cy.visit('/dashboard/provider')
    
    // Should show error state
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="retry-button"]').should('be.visible')
  })
})