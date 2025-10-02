describe('Complete Provider Workflow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('should complete full provider journey from registration to service delivery', () => {
    // Step 1: Register as a new provider
    cy.log('Step 1: Provider Registration')
    cy.visit('/auth/register')
    cy.waitForPageLoad()

    const providerData = {
      email: 'newprovider@test.com',
      password: 'securepass123',
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '+977-9876543210',
      role: 'provider'
    }

    cy.registerUser(providerData)

    // Step 2: Login as the new provider
    cy.log('Step 2: Provider Login')
    cy.loginAsProvider(providerData.email, providerData.password)

    // Step 3: Complete profile setup
    cy.log('Step 3: Profile Setup')
    cy.navigateToProfile()

    const profileData = {
      bio: 'Professional cleaning service provider with 5+ years experience',
      city: 'Kathmandu',
      years_of_experience: '5',
      company_name: 'Clean Pro Services'
    }

    cy.updateProfile(profileData)

    // Step 4: Upload portfolio images
    cy.log('Step 4: Portfolio Upload')
    cy.uploadPortfolioImage('sample-work.jpg')

    // Step 5: Create services
    cy.log('Step 5: Service Creation')
    cy.navigateToServices()

    const services = [
      {
        title: 'Deep House Cleaning',
        description: 'Comprehensive deep cleaning service for entire house',
        price: '2500',
        duration: '180',
        category: 'Cleaning'
      },
      {
        title: 'Kitchen Deep Clean',
        description: 'Specialized kitchen cleaning with appliance care',
        price: '1800',
        duration: '120',
        category: 'Cleaning'
      }
    ]

    services.forEach(service => {
      cy.createService(service)
    })

    // Step 6: Set up schedule
    cy.log('Step 6: Schedule Setup')
    cy.visit('/dashboard/provider/schedule')
    cy.waitForPageLoad()

    const scheduleData = {
      schedules: [
        { day_of_week: 1, start_time: '09:00', end_time: '17:00', is_available: true },
        { day_of_week: 2, start_time: '09:00', end_time: '17:00', is_available: true },
        { day_of_week: 3, start_time: '09:00', end_time: '17:00', is_available: true },
        { day_of_week: 4, start_time: '09:00', end_time: '17:00', is_available: true },
        { day_of_week: 5, start_time: '09:00', end_time: '17:00', is_available: true }
      ]
    }

    cy.intercept('POST', '/api/provider/schedule/', {
      statusCode: 200,
      body: scheduleData.schedules
    }).as('updateSchedule')

    // Set working hours for weekdays
    scheduleData.schedules.forEach((schedule, index) => {
      cy.get(`[data-testid="day-${schedule.day_of_week}"]`).within(() => {
        cy.get('[data-testid="available-toggle"]').check()
        cy.get('[data-testid="start-time"]').type(schedule.start_time)
        cy.get('[data-testid="end-time"]').type(schedule.end_time)
      })
    })

    cy.get('[data-testid="save-schedule"]').click()
    cy.wait('@updateSchedule')

    // Step 7: Receive and handle booking requests
    cy.log('Step 7: Booking Management')
    cy.navigateToNotifications()

    // Mock incoming booking notification
    cy.intercept('GET', '/api/notifications/', {
      body: [
        {
          id: 1,
          title: 'New Booking Request',
          message: 'You have received a new booking request for Deep House Cleaning',
          type: 'booking_request',
          is_read: false,
          priority: 'high',
          action_required: true,
          data: { booking_id: 101 },
          created_at: new Date().toISOString()
        }
      ]
    }).as('getBookingNotification')

    cy.wait('@getBookingNotification')

    // Accept the booking request
    cy.intercept('POST', '/api/provider/bookings/101/accept/', {
      statusCode: 200,
      body: { id: 101, status: 'confirmed' }
    }).as('acceptBooking')

    cy.get('[data-testid="notification-1"]')
      .find('[data-testid="action-accept"]')
      .click()

    cy.wait('@acceptBooking')

    // Step 8: View booking details
    cy.log('Step 8: Booking Details Review')
    cy.navigateToBookings()

    cy.intercept('GET', '/api/provider/bookings/', {
      body: {
        results: [
          {
            id: 101,
            customer: {
              first_name: 'John',
              last_name: 'Doe',
              phone: '+977-9876543210',
              email: 'john@customer.com'
            },
            service: {
              title: 'Deep House Cleaning',
              duration: 180
            },
            booking_date: '2024-02-25',
            booking_time: '10:00',
            status: 'confirmed',
            total_amount: 2500,
            address: 'Thamel, Kathmandu',
            notes: 'Please focus on kitchen and bathrooms'
          }
        ]
      }
    }).as('getBookings')

    cy.wait('@getBookings')

    // View booking details
    cy.get('[data-testid="booking-101"]').click()
    cy.get('[data-testid="booking-details"]').should('be.visible')

    // Step 9: Mark service as completed
    cy.log('Step 9: Service Completion')
    cy.intercept('PATCH', '/api/provider/bookings/101/', {
      statusCode: 200,
      body: { id: 101, status: 'completed' }
    }).as('completeBooking')

    cy.get('[data-testid="booking-101"]').within(() => {
      cy.get('[data-testid="status-dropdown"]').click()
      cy.get('[data-testid="status-completed"]').click()
    })

    cy.wait('@completeBooking')

    // Step 10: Check earnings update
    cy.log('Step 10: Earnings Verification')
    cy.navigateToEarnings()

    cy.intercept('GET', '/api/provider/earnings/overview/', {
      body: {
        total_earnings: 2500,
        this_month_earnings: 2500,
        completed_payments: 1,
        pending_payments: 0,
        average_booking_value: 2500
      }
    }).as('getEarnings')

    cy.wait('@getEarnings')

    cy.get('[data-testid="total-earnings"]').should('contain', '₹2,500')
    cy.get('[data-testid="completed-payments"]').should('contain', '1')

    // Step 11: Receive customer review
    cy.log('Step 11: Review Management')
    cy.intercept('GET', '/api/notifications/', {
      body: [
        {
          id: 2,
          title: 'New 5-Star Review!',
          message: 'John Doe left a 5-star review: "Excellent service! Very thorough and professional."',
          type: 'review',
          is_read: false,
          priority: 'low',
          data: { review_id: 201, rating: 5 },
          created_at: new Date().toISOString()
        }
      ]
    }).as('getReviewNotification')

    cy.navigateToNotifications()
    cy.wait('@getReviewNotification')

    // View the review
    cy.get('[data-testid="notification-2"]').click()

    // Step 12: Check updated dashboard stats
    cy.log('Step 12: Dashboard Stats Verification')
    cy.intercept('GET', '/api/provider/dashboard/stats/', {
      body: {
        total_bookings: 1,
        completed_bookings: 1,
        total_earnings: 2500,
        this_month_earnings: 2500,
        average_rating: 5.0,
        total_reviews: 1,
        active_services: 2,
        completion_rate: 100
      }
    }).as('getUpdatedStats')

    cy.navigateToProviderDashboard()
    cy.wait('@getUpdatedStats')

    // Verify updated statistics
    cy.get('[data-testid="total-bookings"]').should('contain', '1')
    cy.get('[data-testid="completed-bookings"]').should('contain', '1')
    cy.get('[data-testid="total-earnings"]').should('contain', '₹2,500')
    cy.get('[data-testid="average-rating"]').should('contain', '5.0')
    cy.get('[data-testid="completion-rate"]').should('contain', '100%')

    // Step 13: Set up notification preferences
    cy.log('Step 13: Notification Preferences')
    cy.navigateToNotifications()

    cy.intercept('GET', '/api/notifications/preferences/', {
      body: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        booking_requests: true,
        booking_updates: true,
        payment_notifications: true,
        review_notifications: true,
        system_notifications: true,
        marketing_notifications: false,
        reminder_notifications: true
      }
    }).as('getPreferences')

    cy.wait('@getPreferences')

    cy.get('[data-testid="notification-settings"]').click()

    // Update preferences to enable SMS for important notifications
    cy.intercept('PATCH', '/api/notifications/preferences/', {
      statusCode: 200,
      body: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: true,
        booking_requests: true,
        booking_updates: true,
        payment_notifications: true,
        review_notifications: true,
        system_notifications: true,
        marketing_notifications: false,
        reminder_notifications: true
      }
    }).as('updatePreferences')

    cy.get('[data-testid="pref-sms_notifications"]').check()
    cy.wait('@updatePreferences')

    cy.get('[data-testid="close-preferences"]').click()

    // Step 14: View analytics
    cy.log('Step 14: Analytics Review')
    cy.navigateToAnalytics()

    cy.intercept('GET', '/api/provider/analytics/performance/', {
      body: {
        completion_rate: 100,
        average_rating: 5.0,
        response_time: 1.5,
        total_customers: 1,
        repeat_customers: 0,
        customer_satisfaction: 5.0,
        monthly_trends: [
          { month: '2024-02', bookings: 1, revenue: 2500, rating: 5.0 }
        ]
      }
    }).as('getAnalytics')

    cy.wait('@getAnalytics')

    cy.get('[data-testid="completion-rate"]').should('contain', '100%')
    cy.get('[data-testid="customer-satisfaction"]').should('contain', '5.0')

    // Step 15: Plan for future bookings
    cy.log('Step 15: Future Planning')
    cy.navigateToServices()

    // Add another service for expansion
    const newService = {
      title: 'Bathroom Deep Clean',
      description: 'Specialized bathroom cleaning and sanitization',
      price: '1200',
      duration: '90',
      category: 'Cleaning'
    }

    cy.createService(newService)

    // Verify service was added
    cy.get('[data-testid="services-list"]').should('contain', 'Bathroom Deep Clean')

    // Final verification - check that provider is fully set up
    cy.log('Final Verification: Complete Provider Setup')
    cy.navigateToProviderDashboard()

    // Should show a fully functional provider dashboard
    cy.get('[data-testid="provider-dashboard"]').should('be.visible')
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome back, Sarah!')
    cy.get('[data-testid="active-services"]').should('contain', '3') // 3 services created
    cy.get('[data-testid="completion-rate"]').should('contain', '100%')

    // Take a screenshot of the completed setup
    cy.takeFullPageScreenshot('provider-workflow-complete')

    cy.log('✅ Complete provider workflow successfully completed!')
  })

  it('should handle booking conflicts and rescheduling', () => {
    cy.log('Testing booking conflict resolution')
    
    cy.loginAsProvider()
    cy.navigateToBookings()

    // Mock conflicting bookings
    cy.intercept('GET', '/api/provider/bookings/', {
      body: {
        results: [
          {
            id: 201,
            customer: { first_name: 'Alice', last_name: 'Smith' },
            service: { title: 'House Cleaning' },
            booking_date: '2024-02-25',
            booking_time: '10:00',
            status: 'confirmed',
            total_amount: 2000
          },
          {
            id: 202,
            customer: { first_name: 'Bob', last_name: 'Johnson' },
            service: { title: 'Kitchen Cleaning' },
            booking_date: '2024-02-25',
            booking_time: '10:30',
            status: 'pending',
            total_amount: 1500
          }
        ]
      }
    }).as('getConflictingBookings')

    cy.wait('@getConflictingBookings')

    // Should show conflict warning
    cy.get('[data-testid="conflict-warning"]').should('be.visible')

    // Reschedule the conflicting booking
    cy.intercept('PATCH', '/api/provider/bookings/202/', {
      statusCode: 200,
      body: { id: 202, booking_date: '2024-02-25', booking_time: '14:00' }
    }).as('rescheduleBooking')

    cy.get('[data-testid="booking-202"]').within(() => {
      cy.get('[data-testid="reschedule-booking"]').click()
    })

    cy.get('[data-testid="new-time"]').select('14:00')
    cy.get('[data-testid="confirm-reschedule"]').click()

    cy.wait('@rescheduleBooking')

    // Conflict should be resolved
    cy.get('[data-testid="conflict-warning"]').should('not.exist')
  })

  it('should handle service deactivation and reactivation', () => {
    cy.log('Testing service lifecycle management')
    
    cy.loginAsProvider()
    cy.navigateToServices()

    // Mock services
    cy.intercept('GET', '/api/provider/services/', {
      body: {
        results: [
          {
            id: 301,
            title: 'House Cleaning',
            description: 'Professional house cleaning',
            price: 2000,
            is_active: true,
            bookings_count: 5
          }
        ]
      }
    }).as('getServices')

    cy.wait('@getServices')

    // Deactivate service
    cy.deactivateService(301)

    // Verify service is deactivated
    cy.get('[data-testid="service-301"]').should('contain', 'Inactive')

    // Reactivate service
    cy.intercept('PATCH', '/api/provider/services/301/', {
      statusCode: 200,
      body: { id: 301, is_active: true }
    }).as('reactivateService')

    cy.get('[data-testid="service-301"]').within(() => {
      cy.get('[data-testid="reactivate-service"]').click()
    })

    cy.wait('@reactivateService')

    // Service should be active again
    cy.get('[data-testid="service-301"]').should('contain', 'Active')
  })

  it('should handle emergency booking cancellation', () => {
    cy.log('Testing emergency cancellation workflow')
    
    cy.loginAsProvider()
    cy.navigateToBookings()

    // Mock urgent booking
    cy.intercept('GET', '/api/provider/bookings/', {
      body: {
        results: [
          {
            id: 401,
            customer: { first_name: 'Emergency', last_name: 'Client' },
            service: { title: 'Urgent Cleaning' },
            booking_date: new Date().toISOString().split('T')[0], // Today
            booking_time: '15:00',
            status: 'confirmed',
            total_amount: 3000,
            is_urgent: true
          }
        ]
      }
    }).as('getUrgentBooking')

    cy.wait('@getUrgentBooking')

    // Should show urgent indicator
    cy.get('[data-testid="booking-401"]').should('contain', 'URGENT')

    // Provider needs to cancel due to emergency
    cy.intercept('PATCH', '/api/provider/bookings/401/', {
      statusCode: 200,
      body: { id: 401, status: 'cancelled', cancellation_reason: 'Provider emergency' }
    }).as('cancelBooking')

    cy.get('[data-testid="booking-401"]').within(() => {
      cy.get('[data-testid="cancel-booking"]').click()
    })

    // Fill cancellation reason
    cy.get('[data-testid="cancellation-reason"]').type('Family emergency - unable to provide service')
    cy.get('[data-testid="offer-reschedule"]').check()
    cy.get('[data-testid="confirm-cancellation"]').click()

    cy.wait('@cancelBooking')

    // Should show cancellation confirmation
    cy.get('[data-testid="toast-success"]').should('contain', 'Booking cancelled')
    cy.get('[data-testid="booking-401"]').should('contain', 'Cancelled')
  })
})