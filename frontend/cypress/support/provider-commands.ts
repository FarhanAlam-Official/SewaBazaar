/// <reference types="cypress" />

// Provider-specific custom commands

Cypress.Commands.add('navigateToProviderDashboard', () => {
  cy.log('Navigating to provider dashboard')
  
  // Ensure user is authenticated as provider
  cy.getCurrentUser().then((user) => {
    if (!user || user.role !== 'provider') {
      cy.loginAsProvider()
    }
  })
  
  cy.visit('/dashboard/provider')
  cy.waitForPageLoad()
  
  // Verify we're on the provider dashboard
  cy.get('[data-testid="provider-dashboard"]').should('be.visible')
  cy.get('h1').should('contain', 'Welcome back')
})

Cypress.Commands.add('createTestBooking', (bookingData = {}) => {
  cy.log('Creating test booking')
  
  const defaultBookingData = {
    customer_name: 'Test Customer',
    service_title: 'House Cleaning',
    booking_date: '2024-02-15',
    booking_time: '10:00',
    status: 'pending',
    total_amount: 1500,
    ...bookingData
  }
  
  // Mock API call to create booking
  cy.intercept('POST', '/api/bookings/', {
    statusCode: 201,
    body: {
      id: Math.floor(Math.random() * 1000),
      ...defaultBookingData,
      created_at: new Date().toISOString()
    }
  }).as('createBooking')
  
  // If we're on the bookings page, use the UI
  cy.url().then((url) => {
    if (url.includes('/bookings')) {
      cy.get('[data-testid="create-booking-button"]').click()
      cy.fillBookingForm(defaultBookingData)
      cy.get('[data-testid="submit-booking"]').click()
      cy.wait('@createBooking')
    }
  })
  
  return cy.wrap(defaultBookingData)
})

Cypress.Commands.add('createTestService', (serviceData = {}) => {
  cy.log('Creating test service')
  
  const defaultServiceData = {
    title: 'Test Service',
    description: 'A test service for E2E testing',
    price: 2000,
    duration: 120,
    category: 'Cleaning',
    ...serviceData
  }
  
  cy.intercept('POST', '/api/provider/services/', {
    statusCode: 201,
    body: {
      id: Math.floor(Math.random() * 1000),
      ...defaultServiceData,
      is_active: true,
      created_at: new Date().toISOString()
    }
  }).as('createService')
  
  return cy.wrap(defaultServiceData)
})

// Provider dashboard specific actions
Cypress.Commands.add('checkDashboardStats', () => {
  cy.log('Checking dashboard statistics')
  
  cy.get('[data-testid="stats-grid"]').should('be.visible')
  
  // Check that all stat cards are present
  const expectedStats = [
    'Total Bookings',
    'Pending Requests', 
    'This Month Earnings',
    'Average Rating'
  ]
  
  expectedStats.forEach(stat => {
    cy.get('[data-testid="stats-grid"]').should('contain', stat)
  })
  
  // Verify numbers are displayed
  cy.get('[data-testid="stat-value"]').should('have.length.at.least', 4)
})

Cypress.Commands.add('navigateToBookings', () => {
  cy.log('Navigating to bookings page')
  
  cy.get('[data-testid="nav-bookings"]').click()
  cy.url().should('include', '/dashboard/provider/bookings')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="bookings-page"]').should('be.visible')
})

Cypress.Commands.add('navigateToServices', () => {
  cy.log('Navigating to services page')
  
  cy.get('[data-testid="nav-services"]').click()
  cy.url().should('include', '/dashboard/provider/services')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="services-page"]').should('be.visible')
})

Cypress.Commands.add('navigateToEarnings', () => {
  cy.log('Navigating to earnings page')
  
  cy.get('[data-testid="nav-earnings"]').click()
  cy.url().should('include', '/dashboard/provider/earnings')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="earnings-page"]').should('be.visible')
})

Cypress.Commands.add('navigateToNotifications', () => {
  cy.log('Navigating to notifications page')
  
  cy.get('[data-testid="nav-notifications"]').click()
  cy.url().should('include', '/dashboard/provider/notifications')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="notifications-page"]').should('be.visible')
})

Cypress.Commands.add('navigateToProfile', () => {
  cy.log('Navigating to profile page')
  
  cy.get('[data-testid="nav-profile"]').click()
  cy.url().should('include', '/dashboard/provider/profile')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="profile-page"]').should('be.visible')
})

Cypress.Commands.add('navigateToAnalytics', () => {
  cy.log('Navigating to analytics page')
  
  cy.get('[data-testid="nav-analytics"]').click()
  cy.url().should('include', '/dashboard/provider/analytics')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="analytics-page"]').should('be.visible')
})

// Booking management actions
Cypress.Commands.add('updateBookingStatus', (bookingId: number, newStatus: string) => {
  cy.log(`Updating booking ${bookingId} status to ${newStatus}`)
  
  cy.intercept('PATCH', `/api/provider/bookings/${bookingId}/`, {
    statusCode: 200,
    body: { id: bookingId, status: newStatus }
  }).as('updateBookingStatus')
  
  cy.get(`[data-testid="booking-${bookingId}"]`).within(() => {
    cy.get('[data-testid="status-dropdown"]').click()
    cy.get(`[data-testid="status-${newStatus}"]`).click()
  })
  
  cy.wait('@updateBookingStatus')
  
  // Verify status updated in UI
  cy.get(`[data-testid="booking-${bookingId}"]`)
    .find('[data-testid="status-badge"]')
    .should('contain', newStatus)
})

Cypress.Commands.add('filterBookings', (filterType: string, filterValue: string) => {
  cy.log(`Filtering bookings by ${filterType}: ${filterValue}`)
  
  cy.get(`[data-testid="filter-${filterType}"]`).click()
  cy.get(`[data-testid="filter-option-${filterValue}"]`).click()
  
  // Wait for filtered results
  cy.get('[data-testid="bookings-list"]').should('be.visible')
})

// Service management actions
Cypress.Commands.add('createService', (serviceData: any) => {
  cy.log('Creating new service via UI')
  
  cy.navigateToServices()
  cy.get('[data-testid="add-service-button"]').click()
  
  // Fill service form
  cy.get('[data-testid="service-title"]').type(serviceData.title)
  cy.get('[data-testid="service-description"]').type(serviceData.description)
  cy.get('[data-testid="service-price"]').type(serviceData.price.toString())
  cy.get('[data-testid="service-duration"]').type(serviceData.duration.toString())
  
  if (serviceData.category) {
    cy.get('[data-testid="service-category"]').select(serviceData.category)
  }
  
  cy.intercept('POST', '/api/provider/services/', {
    statusCode: 201,
    body: { id: Math.floor(Math.random() * 1000), ...serviceData }
  }).as('createService')
  
  cy.get('[data-testid="submit-service"]').click()
  cy.wait('@createService')
  
  // Verify service appears in list
  cy.get('[data-testid="services-list"]').should('contain', serviceData.title)
})

Cypress.Commands.add('editService', (serviceId: number, updates: any) => {
  cy.log(`Editing service ${serviceId}`)
  
  cy.get(`[data-testid="service-${serviceId}"]`).within(() => {
    cy.get('[data-testid="edit-service"]').click()
  })
  
  // Update fields
  Object.entries(updates).forEach(([field, value]) => {
    cy.get(`[data-testid="service-${field}"]`).clear().type(value as string)
  })
  
  cy.intercept('PATCH', `/api/provider/services/${serviceId}/`, {
    statusCode: 200,
    body: { id: serviceId, ...updates }
  }).as('updateService')
  
  cy.get('[data-testid="save-service"]').click()
  cy.wait('@updateService')
})

Cypress.Commands.add('deactivateService', (serviceId: number) => {
  cy.log(`Deactivating service ${serviceId}`)
  
  cy.intercept('PATCH', `/api/provider/services/${serviceId}/`, {
    statusCode: 200,
    body: { id: serviceId, is_active: false }
  }).as('deactivateService')
  
  cy.get(`[data-testid="service-${serviceId}"]`).within(() => {
    cy.get('[data-testid="deactivate-service"]').click()
  })
  
  // Confirm deactivation
  cy.get('[data-testid="confirm-deactivate"]').click()
  cy.wait('@deactivateService')
  
  // Verify service is marked as inactive
  cy.get(`[data-testid="service-${serviceId}"]`)
    .should('contain', 'Inactive')
})

// Notification actions
Cypress.Commands.add('markNotificationAsRead', (notificationId: number) => {
  cy.log(`Marking notification ${notificationId} as read`)
  
  cy.intercept('PATCH', `/api/notifications/${notificationId}/`, {
    statusCode: 200,
    body: { id: notificationId, is_read: true }
  }).as('markAsRead')
  
  cy.get(`[data-testid="notification-${notificationId}"]`).click()
  cy.wait('@markAsRead')
})

Cypress.Commands.add('markAllNotificationsAsRead', () => {
  cy.log('Marking all notifications as read')
  
  cy.intercept('POST', '/api/notifications/mark-all-read/', {
    statusCode: 200,
    body: { message: 'All notifications marked as read' }
  }).as('markAllAsRead')
  
  cy.get('[data-testid="mark-all-read"]').click()
  cy.wait('@markAllAsRead')
  
  // Verify all notifications are marked as read
  cy.get('[data-testid="unread-count"]').should('contain', '0')
})

Cypress.Commands.add('updateNotificationPreferences', (preferences: any) => {
  cy.log('Updating notification preferences')
  
  cy.navigateToNotifications()
  cy.get('[data-testid="notification-settings"]').click()
  
  // Update preferences
  Object.entries(preferences).forEach(([key, value]) => {
    const toggle = cy.get(`[data-testid="pref-${key}"]`)
    if (value) {
      toggle.check()
    } else {
      toggle.uncheck()
    }
  })
  
  cy.intercept('PATCH', '/api/notifications/preferences/', {
    statusCode: 200,
    body: preferences
  }).as('updatePreferences')
  
  cy.get('[data-testid="save-preferences"]').click()
  cy.wait('@updatePreferences')
})

// Profile management actions
Cypress.Commands.add('updateProfile', (profileData: any) => {
  cy.log('Updating provider profile')
  
  cy.navigateToProfile()
  
  // Fill profile form
  Object.entries(profileData).forEach(([field, value]) => {
    cy.get(`[data-testid="profile-${field}"]`).clear().type(value as string)
  })
  
  cy.intercept('PATCH', '/api/provider/profile/', {
    statusCode: 200,
    body: profileData
  }).as('updateProfile')
  
  cy.get('[data-testid="save-profile"]').click()
  cy.wait('@updateProfile')
  
  // Verify success message
  cy.get('[data-testid="success-message"]').should('be.visible')
})

Cypress.Commands.add('uploadPortfolioImage', (imagePath: string) => {
  cy.log('Uploading portfolio image')
  
  cy.intercept('POST', '/api/provider/portfolio/', {
    statusCode: 201,
    body: {
      id: Math.floor(Math.random() * 1000),
      file_url: 'https://example.com/image.jpg',
      title: 'Portfolio Image'
    }
  }).as('uploadImage')
  
  cy.get('[data-testid="upload-portfolio"]').click()
  cy.uploadFile('[data-testid="file-input"]', imagePath)
  cy.get('[data-testid="upload-submit"]').click()
  
  cy.wait('@uploadImage')
  
  // Verify image appears in portfolio
  cy.get('[data-testid="portfolio-images"]').should('contain', 'Portfolio Image')
})

// Helper to fill booking form
Cypress.Commands.add('fillBookingForm', (bookingData: any) => {
  cy.get('[data-testid="customer-name"]').type(bookingData.customer_name)
  cy.get('[data-testid="service-select"]').select(bookingData.service_title)
  cy.get('[data-testid="booking-date"]').type(bookingData.booking_date)
  cy.get('[data-testid="booking-time"]').type(bookingData.booking_time)
  
  if (bookingData.notes) {
    cy.get('[data-testid="booking-notes"]').type(bookingData.notes)
  }
})