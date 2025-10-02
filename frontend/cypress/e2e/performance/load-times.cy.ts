describe('Provider Dashboard - Performance Tests', () => {
  beforeEach(() => {
    cy.loginAsProvider()
  })

  it('should load dashboard within 3 seconds', () => {
    const startTime = Date.now()
    
    cy.visit('/dashboard/provider')
    cy.waitForDashboard()
    
    cy.then(() => {
      const loadTime = Date.now() - startTime
      expect(loadTime).to.be.lessThan(3000)
      cy.task('log', `Dashboard load time: ${loadTime}ms`)
    })
  })

  it('should load bookings page within 2 seconds', () => {
    cy.measurePageLoad('Bookings')
    cy.navigateToProviderSection('bookings')
  })

  it('should load services page within 2 seconds', () => {
    cy.measurePageLoad('Services')
    cy.navigateToProviderSection('services')
  })

  it('should handle large datasets efficiently', () => {
    // Mock large dataset
    cy.intercept('GET', '/api/provider/bookings/', {
      fixture: 'large-bookings-dataset.json'
    }).as('largeBookings')
    
    const startTime = Date.now()
    
    cy.navigateToProviderSection('bookings')
    cy.wait('@largeBookings')
    
    cy.then(() => {
      const loadTime = Date.now() - startTime
      expect(loadTime).to.be.lessThan(5000)
      cy.task('log', `Large dataset load time: ${loadTime}ms`)
    })
  })

  it('should render charts efficiently', () => {
    cy.visit('/dashboard/provider')
    cy.waitForDashboard()
    
    // Measure chart rendering time
    cy.window().then((win) => {
      const startTime = win.performance.now()
      
      cy.get('[data-testid="bookings-chart"]').should('be.visible').then(() => {
        const endTime = win.performance.now()
        const renderTime = endTime - startTime
        
        expect(renderTime).to.be.lessThan(1000)
        cy.task('log', `Chart render time: ${renderTime.toFixed(2)}ms`)
      })
    })
  })

  it('should handle rapid navigation efficiently', () => {
    const pages = ['bookings', 'services', 'earnings', 'profile']
    
    pages.forEach((page, index) => {
      const startTime = Date.now()
      
      cy.navigateToProviderSection(page)
      
      cy.then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(2000)
        cy.task('log', `${page} navigation time: ${loadTime}ms`)
      })
    })
  })

  it('should optimize API calls', () => {
    let apiCallCount = 0
    
    // Count API calls
    cy.intercept('GET', '/api/**', (req) => {
      apiCallCount++
      req.continue()
    }).as('apiCalls')
    
    cy.visit('/dashboard/provider')
    cy.waitForDashboard()
    
    cy.then(() => {
      // Should not make excessive API calls
      expect(apiCallCount).to.be.lessThan(10)
      cy.task('log', `Total API calls on dashboard load: ${apiCallCount}`)
    })
  })
})