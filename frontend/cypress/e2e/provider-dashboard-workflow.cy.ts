describe('Provider Dashboard - Complete Workflow', () => {
  beforeEach(() => {
    // Seed test data
    cy.seedTestData()
    
    // Login as provider
    cy.loginAsProvider()
    
    // Visit provider dashboard
    cy.visit('/dashboard/provider')
    cy.waitForDashboard()
  })

  describe('Dashboard Overview', () => {
    it('should display dashboard statistics correctly', () => {
      cy.get('[data-testid="dashboard-stats"]').should('be.visible')
      
      // Check stat cards
      cy.get('[data-testid="total-bookings-stat"]').should('contain', '234')
      cy.get('[data-testid="monthly-earnings-stat"]').should('contain', '₹23,450')
      cy.get('[data-testid="avg-rating-stat"]').should('contain', '4.8')
      cy.get('[data-testid="active-services-stat"]').should('contain', '6')
      
      // Check charts are rendered
      cy.get('[data-testid="bookings-chart"]').should('be.visible')
      cy.get('[data-testid="earnings-chart"]').should('be.visible')
      
      // Check recent activities
      cy.get('[data-testid="recent-activities"]').should('be.visible')
      cy.get('[data-testid="activity-item"]').should('have.length.at.least', 1)
    })

    it('should handle dashboard loading states', () => {
      // Mock slow API response
      cy.intercept('GET', '/api/provider/dashboard/', (req) => {
        req.reply((res) => {
          res.delay(2000)
          res.send({ fixture: 'dashboard-stats.json' })
        })
      }).as('slowDashboard')
      
      cy.visit('/dashboard/provider')
      
      // Should show loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      
      // Wait for data to load
      cy.wait('@slowDashboard')
      cy.get('[data-testid="loading-spinner"]').should('not.exist')
      cy.get('[data-testid="dashboard-stats"]').should('be.visible')
    })

    it('should handle dashboard error states', () => {
      // Mock API error
      cy.mockApiError('/api/provider/dashboard/', 500)
      
      cy.visit('/dashboard/provider')
      
      // Should show error state
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
      
      // Retry should work
      cy.mockApiSuccess('/api/provider/dashboard/', 'dashboard-stats.json')
      cy.get('[data-testid="retry-button"]').click()
      
      cy.wait('@apiSuccess')
      cy.get('[data-testid="dashboard-stats"]').should('be.visible')
    })
  })

  describe('Bookings Management', () => {
    beforeEach(() => {
      cy.navigateToProviderSection('bookings')
      cy.wait('@getBookings')
    })

    it('should display bookings list with correct information', () => {
      // Check bookings are displayed
      cy.get('[data-testid="bookings-list"]').should('be.visible')
      cy.get('[data-testid="booking-card"]').should('have.length.at.least', 1)
      
      // Check first booking details
      cy.get('[data-testid="booking-card"]').first().within(() => {
        cy.get('[data-testid="booking-number"]').should('contain', 'BK-2024-001')
        cy.get('[data-testid="customer-name"]').should('contain', 'Sarah Johnson')
        cy.get('[data-testid="service-title"]').should('contain', 'House Cleaning')
        cy.get('[data-testid="booking-status"]').should('contain', 'Pending')
        cy.get('[data-testid="scheduled-date"]').should('be.visible')
        cy.get('[data-testid="total-amount"]').should('contain', '₹1,500')
      })
    })

    it('should filter bookings by status', () => {
      // Click on different status tabs
      cy.get('[data-testid="status-filter-pending"]').click()
      cy.get('[data-testid="booking-card"]').should('have.length', 1)
      cy.get('[data-testid="booking-status"]').should('contain', 'Pending')
      
      cy.get('[data-testid="status-filter-confirmed"]').click()
      cy.get('[data-testid="booking-card"]').should('have.length', 1)
      cy.get('[data-testid="booking-status"]').should('contain', 'Confirmed')
      
      cy.get('[data-testid="status-filter-completed"]').click()
      cy.get('[data-testid="booking-card"]').should('have.length', 1)
      cy.get('[data-testid="booking-status"]').should('contain', 'Completed')
    })

    it('should update booking status', () => {
      // Mock status update API
      cy.intercept('PATCH', '/api/bookings/1/', {
        statusCode: 200,
        body: { status: 'confirmed' }
      }).as('updateBookingStatus')
      
      // Find pending booking and confirm it
      cy.get('[data-testid="booking-card"]').first().within(() => {
        cy.get('[data-testid="confirm-booking-btn"]').click()
      })
      
      // Confirm in modal
      cy.get('[data-testid="confirm-modal"]').should('be.visible')
      cy.get('[data-testid="confirm-yes-btn"]').click()
      
      cy.wait('@updateBookingStatus')
      cy.verifyNotification('Booking confirmed successfully')
    })

    it('should mark booking as completed', () => {
      // Mock completion API
      cy.intercept('PATCH', '/api/bookings/2/', {
        statusCode: 200,
        body: { status: 'completed' }
      }).as('completeBooking')
      
      // Switch to confirmed bookings
      cy.get('[data-testid="status-filter-confirmed"]').click()
      
      // Complete the booking
      cy.get('[data-testid="booking-card"]').first().within(() => {
        cy.get('[data-testid="complete-booking-btn"]').click()
      })
      
      // Fill completion form
      cy.get('[data-testid="completion-modal"]').should('be.visible')
      cy.get('[data-testid="completion-notes"]').type('Service completed successfully')
      cy.get('[data-testid="submit-completion-btn"]').click()
      
      cy.wait('@completeBooking')
      cy.verifyNotification('Booking marked as completed')
    })

    it('should search bookings by customer name', () => {
      cy.get('[data-testid="search-input"]').type('Sarah')
      cy.get('[data-testid="booking-card"]').should('have.length', 1)
      cy.get('[data-testid="customer-name"]').should('contain', 'Sarah Johnson')
    })

    it('should view booking details', () => {
      cy.get('[data-testid="booking-card"]').first().click()
      
      // Should open booking details modal
      cy.get('[data-testid="booking-details-modal"]').should('be.visible')
      cy.get('[data-testid="booking-details-customer"]').should('contain', 'Sarah Johnson')
      cy.get('[data-testid="booking-details-address"]').should('be.visible')
      cy.get('[data-testid="booking-details-notes"]').should('be.visible')
      
      // Close modal
      cy.get('[data-testid="close-modal-btn"]').click()
      cy.get('[data-testid="booking-details-modal"]').should('not.exist')
    })
  })

  describe('Services Management', () => {
    beforeEach(() => {
      cy.navigateToProviderSection('services')
      cy.wait('@getServices')
    })

    it('should display services list', () => {
      cy.get('[data-testid="services-list"]').should('be.visible')
      cy.get('[data-testid="service-card"]').should('have.length.at.least', 1)
      
      // Check service details
      cy.get('[data-testid="service-card"]').first().within(() => {
        cy.get('[data-testid="service-title"]').should('be.visible')
        cy.get('[data-testid="service-price"]').should('be.visible')
        cy.get('[data-testid="service-status"]').should('be.visible')
        cy.get('[data-testid="service-rating"]').should('be.visible')
      })
    })

    it('should create new service', () => {
      // Mock create service API
      cy.intercept('POST', '/api/provider/services/', {
        statusCode: 201,
        body: {
          id: 10,
          title: 'New Test Service',
          description: 'Test service description',
          price: 2000,
          duration: 90,
          is_active: true
        }
      }).as('createService')
      
      // Click add service button
      cy.get('[data-testid="add-service-btn"]').click()
      
      // Fill service form
      cy.get('[data-testid="service-form-modal"]').should('be.visible')
      cy.fillServiceForm({
        title: 'New Test Service',
        description: 'Test service description',
        price: 2000,
        duration: 90,
        category: 'Cleaning'
      })
      
      // Submit form
      cy.get('[data-testid="submit-service-btn"]').click()
      
      cy.wait('@createService')
      cy.verifyNotification('Service created successfully')
      cy.get('[data-testid="service-form-modal"]').should('not.exist')
    })

    it('should edit existing service', () => {
      // Mock update service API
      cy.intercept('PUT', '/api/provider/services/1/', {
        statusCode: 200,
        body: {
          id: 1,
          title: 'Updated House Cleaning',
          description: 'Updated description',
          price: 1800,
          duration: 120,
          is_active: true
        }
      }).as('updateService')
      
      // Click edit on first service
      cy.get('[data-testid="service-card"]').first().within(() => {
        cy.get('[data-testid="edit-service-btn"]').click()
      })
      
      // Update service details
      cy.get('[data-testid="service-form-modal"]').should('be.visible')
      cy.get('[data-testid="service-title-input"]').clear().type('Updated House Cleaning')
      cy.get('[data-testid="service-price-input"]').clear().type('1800')
      
      // Submit form
      cy.get('[data-testid="submit-service-btn"]').click()
      
      cy.wait('@updateService')
      cy.verifyNotification('Service updated successfully')
    })

    it('should toggle service status', () => {
      // Mock toggle status API
      cy.intercept('PATCH', '/api/provider/services/1/', {
        statusCode: 200,
        body: { is_active: false }
      }).as('toggleServiceStatus')
      
      // Toggle service status
      cy.get('[data-testid="service-card"]').first().within(() => {
        cy.get('[data-testid="toggle-status-btn"]').click()
      })
      
      cy.wait('@toggleServiceStatus')
      cy.verifyNotification('Service status updated')
    })

    it('should delete service', () => {
      // Mock delete service API
      cy.intercept('DELETE', '/api/provider/services/1/', {
        statusCode: 204
      }).as('deleteService')
      
      // Delete service
      cy.get('[data-testid="service-card"]').first().within(() => {
        cy.get('[data-testid="delete-service-btn"]').click()
      })
      
      // Confirm deletion
      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible')
      cy.get('[data-testid="confirm-delete-btn"]').click()
      
      cy.wait('@deleteService')
      cy.verifyNotification('Service deleted successfully')
    })
  })

  describe('Earnings Management', () => {
    beforeEach(() => {
      cy.navigateToProviderSection('earnings')
      cy.wait('@getEarnings')
    })

    it('should display earnings overview', () => {
      cy.get('[data-testid="earnings-overview"]').should('be.visible')
      
      // Check earnings stats
      cy.get('[data-testid="total-earnings"]').should('be.visible')
      cy.get('[data-testid="monthly-earnings"]').should('be.visible')
      cy.get('[data-testid="pending-payouts"]').should('be.visible')
      
      // Check earnings chart
      cy.get('[data-testid="earnings-chart"]').should('be.visible')
    })

    it('should filter earnings by date range', () => {
      // Set date range
      cy.get('[data-testid="date-range-picker"]').click()
      cy.get('[data-testid="start-date"]').type('2024-01-01')
      cy.get('[data-testid="end-date"]').type('2024-01-31')
      cy.get('[data-testid="apply-filter-btn"]').click()
      
      // Should update earnings display
      cy.get('[data-testid="earnings-list"]').should('be.visible')
    })

    it('should export earnings report', () => {
      // Mock export API
      cy.intercept('GET', '/api/provider/earnings/export/', {
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf'
        },
        body: 'PDF content'
      }).as('exportEarnings')
      
      cy.get('[data-testid="export-earnings-btn"]').click()
      
      cy.wait('@exportEarnings')
      cy.verifyNotification('Earnings report exported successfully')
    })
  })

  describe('Profile Management', () => {
    beforeEach(() => {
      cy.navigateToProviderSection('profile')
    })

    it('should display provider profile information', () => {
      cy.get('[data-testid="profile-form"]').should('be.visible')
      
      // Check profile fields
      cy.get('[data-testid="business-name"]').should('have.value', 'John\'s Home Services')
      cy.get('[data-testid="description"]').should('be.visible')
      cy.get('[data-testid="experience-years"]').should('have.value', '5')
      cy.get('[data-testid="service-areas"]').should('be.visible')
    })

    it('should update profile information', () => {
      // Mock update profile API
      cy.intercept('PUT', '/api/provider/profile/', {
        statusCode: 200,
        body: { message: 'Profile updated successfully' }
      }).as('updateProfile')
      
      // Update business name
      cy.get('[data-testid="business-name"]').clear().type('Updated Business Name')
      cy.get('[data-testid="description"]').clear().type('Updated description')
      
      // Submit form
      cy.get('[data-testid="save-profile-btn"]').click()
      
      cy.wait('@updateProfile')
      cy.verifyNotification('Profile updated successfully')
    })

    it('should upload profile image', () => {
      // Mock image upload API
      cy.intercept('POST', '/api/provider/profile/upload-image/', {
        statusCode: 200,
        body: { image_url: '/media/profiles/new-image.jpg' }
      }).as('uploadImage')
      
      // Upload image
      cy.get('[data-testid="profile-image-input"]').selectFile('cypress/fixtures/test-image.jpg')
      
      cy.wait('@uploadImage')
      cy.verifyNotification('Profile image updated successfully')
    })
  })

  describe('Notifications', () => {
    beforeEach(() => {
      cy.navigateToProviderSection('notifications')
      cy.wait('@getNotifications')
    })

    it('should display notifications list', () => {
      cy.get('[data-testid="notifications-list"]').should('be.visible')
      cy.get('[data-testid="notification-item"]').should('have.length.at.least', 1)
    })

    it('should mark notification as read', () => {
      // Mock mark as read API
      cy.intercept('PATCH', '/api/notifications/1/', {
        statusCode: 200,
        body: { is_read: true }
      }).as('markAsRead')
      
      // Click on unread notification
      cy.get('[data-testid="notification-item"]').first().click()
      
      cy.wait('@markAsRead')
    })

    it('should mark all notifications as read', () => {
      // Mock mark all as read API
      cy.intercept('POST', '/api/notifications/mark-all-read/', {
        statusCode: 200,
        body: { message: 'All notifications marked as read' }
      }).as('markAllAsRead')
      
      cy.get('[data-testid="mark-all-read-btn"]').click()
      
      cy.wait('@markAllAsRead')
      cy.verifyNotification('All notifications marked as read')
    })
  })

  describe('Real-time Updates', () => {
    it('should receive real-time booking notifications', () => {
      // Mock EventSource for real-time updates
      cy.window().then((win) => {
        const mockEventSource = {
          addEventListener: cy.stub(),
          close: cy.stub()
        }
        
        win.EventSource = cy.stub().returns(mockEventSource)
      })
      
      cy.visit('/dashboard/provider')
      cy.waitForDashboard()
      
      // Simulate new booking notification
      cy.window().its('EventSource').should('have.been.called')
    })
  })

  describe('Performance and Accessibility', () => {
    it('should load dashboard within acceptable time', () => {
      cy.measurePageLoad('Provider Dashboard')
    })

    it('should be accessible', () => {
      cy.visit('/dashboard/provider')
      cy.waitForDashboard()
      cy.checkA11y()
    })

    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x')
      cy.visit('/dashboard/provider')
      cy.waitForDashboard()
      
      // Check mobile navigation
      cy.get('[data-testid="mobile-menu-btn"]').should('be.visible')
      cy.get('[data-testid="mobile-menu-btn"]').click()
      cy.get('[data-testid="mobile-nav"]').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/dashboard/provider')
      
      // Should show network error message
      cy.get('[data-testid="network-error"]').should('be.visible')
      cy.get('[data-testid="retry-btn"]').should('be.visible')
    })

    it('should handle authentication errors', () => {
      // Mock 401 response
      cy.intercept('GET', '/api/provider/dashboard/', {
        statusCode: 401,
        body: { error: 'Authentication required' }
      }).as('authError')
      
      cy.visit('/dashboard/provider')
      
      // Should redirect to login
      cy.url().should('include', '/auth/login')
    })
  })
})