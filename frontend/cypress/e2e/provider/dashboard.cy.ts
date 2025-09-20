describe('Provider Dashboard', () => {
  beforeEach(() => {
    cy.loginAsProvider()
    cy.intercept('GET', '/api/provider/dashboard/stats/', { fixture: 'dashboard-stats.json' }).as('getDashboardStats')
    cy.intercept('GET', '/api/notifications/', { fixture: 'notifications.json' }).as('getNotifications')
  })

  describe('Dashboard Overview', () => {
    it('should display dashboard with correct stats', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      // Check welcome message
      cy.get('h1').should('contain', 'Welcome back, John!')

      // Check stats cards
      cy.checkDashboardStats()

      // Verify specific stat values from fixture
      cy.get('[data-testid="total-bookings"]').should('contain', '45')
      cy.get('[data-testid="pending-bookings"]').should('contain', '8')
      cy.get('[data-testid="this-month-earnings"]').should('contain', '₹18,500')
      cy.get('[data-testid="average-rating"]').should('contain', '4.8')
    })

    it('should display recent bookings', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      cy.get('[data-testid="recent-bookings"]').should('be.visible')
      
      // Check that recent bookings are displayed
      cy.get('[data-testid="booking-item"]').should('have.length.at.least', 1)
      
      // Verify booking details from fixture
      cy.get('[data-testid="booking-item"]').first().within(() => {
        cy.should('contain', 'Alice Johnson')
        cy.should('contain', 'House Deep Cleaning')
        cy.should('contain', 'pending')
        cy.should('contain', '₹2,500')
      })
    })

    it('should show notification badge with unread count', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getNotifications')

      // Should show unread notification count (3 unread in fixture)
      cy.get('[data-testid="notification-badge"]').should('contain', '3')
      cy.get('[data-testid="notification-badge"]').should('have.class', 'bg-red-500')
    })

    it('should display earnings chart', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      cy.get('[data-testid="earnings-chart"]').should('be.visible')
      cy.get('[data-testid="chart-container"]').should('exist')
    })

    it('should display booking trends chart', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      cy.get('[data-testid="booking-trends-chart"]').should('be.visible')
      cy.get('[data-testid="chart-container"]').should('exist')
    })
  })

  describe('Quick Actions', () => {
    it('should navigate to services when add service is clicked', () => {
      cy.navigateToProviderDashboard()

      cy.get('[data-testid="add-service-button"]').click()
      cy.url().should('include', '/dashboard/provider/services')
    })

    it('should navigate to schedule when update schedule is clicked', () => {
      cy.navigateToProviderDashboard()

      cy.get('[data-testid="update-schedule-button"]').click()
      cy.url().should('include', '/dashboard/provider/schedule')
    })

    it('should navigate to analytics when view analytics is clicked', () => {
      cy.navigateToProviderDashboard()

      cy.get('[data-testid="view-analytics-button"]').click()
      cy.url().should('include', '/dashboard/provider/analytics')
    })

    it('should navigate to all bookings when view all is clicked', () => {
      cy.navigateToProviderDashboard()

      cy.get('[data-testid="view-all-bookings"]').click()
      cy.url().should('include', '/dashboard/provider/bookings')
    })
  })

  describe('Navigation', () => {
    it('should navigate between dashboard sections', () => {
      cy.navigateToProviderDashboard()

      // Test navigation to each section
      cy.navigateToBookings()
      cy.get('[data-testid="bookings-page"]').should('be.visible')

      cy.navigateToServices()
      cy.get('[data-testid="services-page"]').should('be.visible')

      cy.navigateToEarnings()
      cy.get('[data-testid="earnings-page"]').should('be.visible')

      cy.navigateToNotifications()
      cy.get('[data-testid="notifications-page"]').should('be.visible')

      cy.navigateToProfile()
      cy.get('[data-testid="profile-page"]').should('be.visible')

      cy.navigateToAnalytics()
      cy.get('[data-testid="analytics-page"]').should('be.visible')

      // Navigate back to dashboard
      cy.get('[data-testid="nav-dashboard"]').click()
      cy.get('[data-testid="provider-dashboard"]').should('be.visible')
    })

    it('should highlight active navigation item', () => {
      cy.navigateToProviderDashboard()

      cy.get('[data-testid="nav-dashboard"]').should('have.class', 'active')

      cy.navigateToBookings()
      cy.get('[data-testid="nav-bookings"]').should('have.class', 'active')
      cy.get('[data-testid="nav-dashboard"]').should('not.have.class', 'active')
    })
  })

  describe('Real-time Updates', () => {
    it('should update stats when new booking is received', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      // Initial pending count
      cy.get('[data-testid="pending-bookings"]').should('contain', '8')

      // Simulate real-time update
      cy.intercept('GET', '/api/provider/dashboard/stats/', {
        body: {
          ...require('../../fixtures/dashboard-stats.json'),
          pending_bookings: 9,
          total_bookings: 46
        }
      }).as('getUpdatedStats')

      // Trigger refresh (could be automatic in real app)
      cy.get('[data-testid="refresh-dashboard"]').click()
      cy.wait('@getUpdatedStats')

      // Should show updated counts
      cy.get('[data-testid="pending-bookings"]').should('contain', '9')
      cy.get('[data-testid="total-bookings"]').should('contain', '46')
    })

    it('should show new notification badge when notification arrives', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getNotifications')

      // Initial unread count
      cy.get('[data-testid="notification-badge"]').should('contain', '3')

      // Simulate new notification
      cy.intercept('GET', '/api/notifications/', {
        body: [
          {
            id: 7,
            title: 'New Booking Request',
            message: 'New booking request received',
            type: 'booking_request',
            is_read: false,
            priority: 'high',
            created_at: new Date().toISOString()
          },
          ...require('../../fixtures/notifications.json')
        ]
      }).as('getNewNotifications')

      // Trigger notification refresh
      cy.get('[data-testid="refresh-notifications"]').click()
      cy.wait('@getNewNotifications')

      // Should show updated count
      cy.get('[data-testid="notification-badge"]').should('contain', '4')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/provider/dashboard/stats/', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('getStatsError')

      cy.navigateToProviderDashboard()
      cy.wait('@getStatsError')

      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should retry failed requests', () => {
      cy.intercept('GET', '/api/provider/dashboard/stats/', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('getStatsError')

      cy.navigateToProviderDashboard()
      cy.wait('@getStatsError')

      // Mock successful retry
      cy.intercept('GET', '/api/provider/dashboard/stats/', { fixture: 'dashboard-stats.json' }).as('getStatsRetry')

      cy.get('[data-testid="retry-button"]').click()
      cy.wait('@getStatsRetry')

      // Should show dashboard content
      cy.get('[data-testid="provider-dashboard"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('not.exist')
    })

    it('should handle network connectivity issues', () => {
      cy.intercept('GET', '/api/provider/dashboard/stats/', { forceNetworkError: true }).as('networkError')

      cy.navigateToProviderDashboard()
      cy.wait('@networkError')

      cy.get('[data-testid="network-error"]').should('be.visible')
      cy.get('[data-testid="offline-indicator"]').should('be.visible')
    })
  })

  describe('Loading States', () => {
    it('should show loading skeleton while fetching data', () => {
      // Delay the API response to see loading state
      cy.intercept('GET', '/api/provider/dashboard/stats/', {
        delay: 2000,
        fixture: 'dashboard-stats.json'
      }).as('getStatsDelayed')

      cy.navigateToProviderDashboard()

      // Should show loading skeletons
      cy.get('[data-testid="stats-skeleton"]').should('be.visible')
      cy.get('[data-testid="chart-skeleton"]').should('be.visible')

      cy.wait('@getStatsDelayed')

      // Loading should disappear
      cy.get('[data-testid="stats-skeleton"]').should('not.exist')
      cy.get('[data-testid="chart-skeleton"]').should('not.exist')
    })
  })

  describe('Performance', () => {
    it('should load dashboard within acceptable time', () => {
      cy.navigateToProviderDashboard()
      cy.measurePageLoad()

      // Dashboard should be interactive quickly
      cy.get('[data-testid="provider-dashboard"]').should('be.visible')
      cy.get('[data-testid="stats-grid"]').should('be.visible')
    })

    it('should handle large datasets efficiently', () => {
      // Mock large dataset
      const largeBookingsList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        customer: { first_name: `Customer${i}`, last_name: 'Test' },
        service: { title: `Service ${i}` },
        booking_date: '2024-02-20',
        booking_time: '10:00',
        status: 'pending',
        total_amount: 1500 + i
      }))

      cy.intercept('GET', '/api/provider/dashboard/stats/', {
        body: {
          ...require('../../fixtures/dashboard-stats.json'),
          recent_bookings: largeBookingsList.slice(0, 10) // Only show recent 10
        }
      }).as('getLargeDataset')

      cy.navigateToProviderDashboard()
      cy.wait('@getLargeDataset')

      // Should still render efficiently
      cy.get('[data-testid="recent-bookings"]').should('be.visible')
      cy.get('[data-testid="booking-item"]').should('have.length', 10)
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport()
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      // Dashboard should be responsive
      cy.get('[data-testid="provider-dashboard"]').should('be.visible')
      cy.get('[data-testid="stats-grid"]').should('be.visible')

      // Stats should stack vertically on mobile
      cy.get('[data-testid="stats-grid"]').should('have.class', 'grid-cols-1')

      // Navigation should be mobile-friendly
      cy.get('[data-testid="mobile-nav-toggle"]').should('be.visible')
    })

    it('should work on tablet devices', () => {
      cy.setTabletViewport()
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      cy.get('[data-testid="provider-dashboard"]').should('be.visible')
      
      // Should show 2 columns on tablet
      cy.get('[data-testid="stats-grid"]').should('have.class', 'sm:grid-cols-2')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      cy.checkAccessibility()

      // Should be able to navigate with keyboard
      cy.get('body').tab()
      cy.focused().should('be.visible')

      // Should be able to reach all interactive elements
      cy.get('[data-testid="add-service-button"]').focus()
      cy.focused().should('have.attr', 'data-testid', 'add-service-button')
    })

    it('should have proper ARIA labels and roles', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      // Check main content area
      cy.get('[role="main"]').should('exist')

      // Check headings hierarchy
      cy.get('h1').should('exist')
      cy.get('h2').should('exist')

      // Check interactive elements have proper labels
      cy.get('[data-testid="add-service-button"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="notification-bell"]').should('have.attr', 'aria-label')
    })

    it('should support screen readers', () => {
      cy.navigateToProviderDashboard()
      cy.wait('@getDashboardStats')

      // Check for screen reader friendly content
      cy.get('[data-testid="stats-grid"]').should('have.attr', 'role', 'region')
      cy.get('[data-testid="stats-grid"]').should('have.attr', 'aria-label', 'Dashboard Statistics')

      // Charts should have descriptions
      cy.get('[data-testid="earnings-chart"]').should('have.attr', 'aria-label')
    })
  })
})