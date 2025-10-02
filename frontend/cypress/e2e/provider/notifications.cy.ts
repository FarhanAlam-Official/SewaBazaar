describe('Provider Notifications', () => {
  beforeEach(() => {
    cy.loginAsProvider()
    cy.intercept('GET', '/api/notifications/', { fixture: 'notifications.json' }).as('getNotifications')
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
  })

  describe('Notifications List', () => {
    it('should display all notifications correctly', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Check page title and unread count
      cy.get('h1').should('contain', 'Notifications')
      cy.get('[data-testid="unread-count"]').should('contain', '3 unread')

      // Check that notifications are displayed
      cy.get('[data-testid="notification-item"]').should('have.length', 6)

      // Verify first notification details from fixture
      cy.get('[data-testid="notification-item"]').first().within(() => {
        cy.should('contain', 'New Booking Request')
        cy.should('contain', 'House Deep Cleaning')
        cy.get('[data-testid="unread-indicator"]').should('exist')
        cy.get('[data-testid="priority-high"]').should('exist')
      })
    })

    it('should show correct notification icons based on type', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Check different notification types have appropriate icons
      cy.get('[data-testid="notification-booking_request"]').should('exist')
      cy.get('[data-testid="notification-payment"]').should('exist')
      cy.get('[data-testid="notification-review"]').should('exist')
      cy.get('[data-testid="notification-system"]').should('exist')
    })

    it('should display priority indicators correctly', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // High priority should have red border
      cy.get('[data-testid="notification-1"]').should('have.class', 'border-l-red-500')
      
      // Medium priority should have yellow border
      cy.get('[data-testid="notification-2"]').should('have.class', 'border-l-yellow-500')
      
      // Low priority should have blue border
      cy.get('[data-testid="notification-3"]').should('have.class', 'border-l-blue-500')
    })

    it('should show relative timestamps', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Should show relative time like "2 hours ago"
      cy.get('[data-testid="notification-timestamp"]').should('contain', 'ago')
    })
  })

  describe('Notification Interactions', () => {
    it('should mark notification as read when clicked', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.intercept('PATCH', '/api/notifications/1/', {
        statusCode: 200,
        body: { id: 1, is_read: true }
      }).as('markAsRead')

      // Click on unread notification
      cy.get('[data-testid="notification-1"]').click()
      cy.wait('@markAsRead')

      // Should remove unread indicator
      cy.get('[data-testid="notification-1"]')
        .find('[data-testid="unread-indicator"]')
        .should('not.exist')

      // Should update unread count
      cy.get('[data-testid="unread-count"]').should('contain', '2 unread')
    })

    it('should mark all notifications as read', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.intercept('POST', '/api/notifications/mark-all-read/', {
        statusCode: 200,
        body: { message: 'All notifications marked as read' }
      }).as('markAllAsRead')

      cy.get('[data-testid="mark-all-read"]').click()
      cy.wait('@markAllAsRead')

      // Should show success message
      cy.get('[data-testid="toast-success"]').should('contain', 'All marked as read')

      // Unread count should be 0
      cy.get('[data-testid="unread-count"]').should('contain', 'All caught up!')
    })

    it('should delete notification', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.intercept('DELETE', '/api/notifications/1/', {
        statusCode: 204
      }).as('deleteNotification')

      // Click delete button on first notification
      cy.get('[data-testid="notification-1"]')
        .find('[data-testid="delete-notification"]')
        .click()

      // Confirm deletion in alert dialog
      cy.get('[data-testid="confirm-delete"]').click()
      cy.wait('@deleteNotification')

      // Notification should be removed from list
      cy.get('[data-testid="notification-1"]').should('not.exist')
      cy.get('[data-testid="toast-success"]').should('contain', 'Notification deleted')
    })

    it('should refresh notifications', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Mock updated notifications
      cy.intercept('GET', '/api/notifications/', {
        body: [
          {
            id: 7,
            title: 'New Notification',
            message: 'This is a new notification',
            type: 'system',
            is_read: false,
            priority: 'medium',
            created_at: new Date().toISOString()
          },
          ...require('../../fixtures/notifications.json')
        ]
      }).as('getRefreshedNotifications')

      cy.get('[data-testid="refresh-notifications"]').click()
      cy.wait('@getRefreshedNotifications')

      // Should show new notification
      cy.get('[data-testid="notification-7"]').should('contain', 'New Notification')
    })
  })

  describe('Notification Filtering', () => {
    it('should filter by unread notifications', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Click unread tab
      cy.get('[data-testid="tab-unread"]').click()

      // Should only show unread notifications (3 from fixture)
      cy.get('[data-testid="notification-item"]').should('have.length', 3)
      
      // All visible notifications should be unread
      cy.get('[data-testid="notification-item"]').each(($notification) => {
        cy.wrap($notification).find('[data-testid="unread-indicator"]').should('exist')
      })
    })

    it('should filter by booking notifications', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.get('[data-testid="tab-bookings"]').click()

      // Should only show booking-related notifications
      cy.get('[data-testid="notification-item"]').should('have.length', 2)
      cy.get('[data-testid="notification-1"]').should('be.visible') // booking_request
      cy.get('[data-testid="notification-4"]').should('be.visible') // booking_update
    })

    it('should filter by review notifications', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.get('[data-testid="tab-reviews"]').click()

      // Should only show review notifications
      cy.get('[data-testid="notification-item"]').should('have.length', 1)
      cy.get('[data-testid="notification-3"]').should('be.visible')
    })

    it('should filter by system notifications', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.get('[data-testid="tab-system"]').click()

      // Should only show system notifications
      cy.get('[data-testid="notification-item"]').should('have.length', 1)
      cy.get('[data-testid="notification-5"]').should('be.visible')
    })

    it('should show empty state for filtered results', () => {
      // Mock notifications with no reviews
      cy.intercept('GET', '/api/notifications/', {
        body: require('../../fixtures/notifications.json').filter(n => n.type !== 'review')
      }).as('getNoReviews')

      cy.navigateToNotifications()
      cy.wait('@getNoReviews')

      cy.get('[data-testid="tab-reviews"]').click()

      // Should show empty state
      cy.get('[data-testid="empty-state"]').should('be.visible')
      cy.get('[data-testid="empty-message"]').should('contain', 'No review notifications')
    })
  })

  describe('Notification Preferences', () => {
    it('should open preferences dialog', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')
      cy.wait('@getPreferences')

      cy.get('[data-testid="notification-settings"]').click()

      // Dialog should open
      cy.get('[data-testid="preferences-dialog"]').should('be.visible')
      cy.get('[data-testid="dialog-title"]').should('contain', 'Notification Preferences')
    })

    it('should display current preference values', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')
      cy.wait('@getPreferences')

      cy.get('[data-testid="notification-settings"]').click()

      // Check that switches reflect current preferences
      cy.get('[data-testid="pref-email_notifications"]').should('be.checked')
      cy.get('[data-testid="pref-push_notifications"]').should('be.checked')
      cy.get('[data-testid="pref-sms_notifications"]').should('not.be.checked')
      cy.get('[data-testid="pref-marketing_notifications"]').should('not.be.checked')
    })

    it('should update preferences', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')
      cy.wait('@getPreferences')

      cy.get('[data-testid="notification-settings"]').click()

      cy.intercept('PATCH', '/api/notifications/preferences/', {
        statusCode: 200,
        body: {
          email_notifications: false,
          push_notifications: true,
          sms_notifications: true,
          booking_requests: true,
          booking_updates: true,
          payment_notifications: true,
          review_notifications: true,
          system_notifications: true,
          marketing_notifications: true,
          reminder_notifications: true
        }
      }).as('updatePreferences')

      // Toggle some preferences
      cy.get('[data-testid="pref-email_notifications"]').uncheck()
      cy.get('[data-testid="pref-sms_notifications"]').check()
      cy.get('[data-testid="pref-marketing_notifications"]').check()

      cy.wait('@updatePreferences')

      // Should show success message
      cy.get('[data-testid="toast-success"]').should('contain', 'Preferences updated')
    })

    it('should close preferences dialog', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')
      cy.wait('@getPreferences')

      cy.get('[data-testid="notification-settings"]').click()
      cy.get('[data-testid="preferences-dialog"]').should('be.visible')

      cy.get('[data-testid="close-preferences"]').click()
      cy.get('[data-testid="preferences-dialog"]').should('not.exist')
    })
  })

  describe('Action Required Notifications', () => {
    it('should show action buttons for booking requests', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Booking request notification should have action buttons
      cy.get('[data-testid="notification-1"]').within(() => {
        cy.get('[data-testid="action-accept"]').should('be.visible')
        cy.get('[data-testid="action-decline"]').should('be.visible')
      })
    })

    it('should handle booking acceptance', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.intercept('POST', '/api/provider/bookings/123/accept/', {
        statusCode: 200,
        body: { id: 123, status: 'confirmed' }
      }).as('acceptBooking')

      cy.get('[data-testid="notification-1"]')
        .find('[data-testid="action-accept"]')
        .click()

      cy.wait('@acceptBooking')

      // Should show success message and update notification
      cy.get('[data-testid="toast-success"]').should('contain', 'Booking accepted')
    })

    it('should handle booking decline', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.intercept('POST', '/api/provider/bookings/123/decline/', {
        statusCode: 200,
        body: { id: 123, status: 'declined' }
      }).as('declineBooking')

      cy.get('[data-testid="notification-1"]')
        .find('[data-testid="action-decline"]')
        .click()

      // Should show decline reason dialog
      cy.get('[data-testid="decline-reason-dialog"]').should('be.visible')
      cy.get('[data-testid="decline-reason"]').type('Schedule conflict')
      cy.get('[data-testid="confirm-decline"]').click()

      cy.wait('@declineBooking')

      cy.get('[data-testid="toast-success"]').should('contain', 'Booking declined')
    })

    it('should not show action buttons for non-action notifications', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Payment notification should not have action buttons
      cy.get('[data-testid="notification-2"]').within(() => {
        cy.get('[data-testid="action-accept"]').should('not.exist')
        cy.get('[data-testid="action-decline"]').should('not.exist')
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should receive real-time notifications', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Mock EventSource for real-time updates
      cy.window().then((win) => {
        const mockEventSource = {
          onmessage: null,
          onerror: null,
          close: cy.stub()
        }

        cy.stub(win, 'EventSource').returns(mockEventSource)

        // Simulate receiving a new notification
        const newNotification = {
          id: 8,
          title: 'Real-time Notification',
          message: 'This came via real-time',
          type: 'booking_request',
          is_read: false,
          priority: 'high',
          created_at: new Date().toISOString()
        }

        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify(newNotification)
          })
        }

        // Should show new notification at top of list
        cy.get('[data-testid="notification-8"]').should('contain', 'Real-time Notification')
      })
    })

    it('should show browser notifications when supported', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Mock Notification API
      cy.window().then((win) => {
        const mockNotification = cy.stub(win, 'Notification')
        Object.defineProperty(win.Notification, 'permission', { value: 'granted' })

        // Simulate real-time notification
        cy.get('[data-testid="simulate-notification"]').click()

        // Should create browser notification
        expect(mockNotification).to.have.been.calledWith('New Booking Request', {
          body: 'You have a new booking request',
          icon: '/favicon.ico'
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/notifications/', {
        statusCode: 500,
        body: { message: 'Server error' }
      }).as('getNotificationsError')

      cy.navigateToNotifications()
      cy.wait('@getNotificationsError')

      // Should show error state
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load notifications')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should retry failed requests', () => {
      cy.intercept('GET', '/api/notifications/', {
        statusCode: 500,
        body: { message: 'Server error' }
      }).as('getNotificationsError')

      cy.navigateToNotifications()
      cy.wait('@getNotificationsError')

      // Mock successful retry
      cy.intercept('GET', '/api/notifications/', { fixture: 'notifications.json' }).as('getNotificationsRetry')

      cy.get('[data-testid="retry-button"]').click()
      cy.wait('@getNotificationsRetry')

      // Should show notifications
      cy.get('[data-testid="notification-item"]').should('have.length', 6)
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      cy.checkAccessibility()

      // Should be able to navigate with keyboard
      cy.get('body').tab()
      cy.focused().should('be.visible')

      // Should be able to reach notification items
      cy.get('[data-testid="notification-1"]').focus()
      cy.focused().should('have.attr', 'data-testid', 'notification-1')
    })

    it('should have proper ARIA labels', () => {
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Check ARIA labels
      cy.get('[data-testid="notifications-list"]').should('have.attr', 'role', 'list')
      cy.get('[data-testid="notification-item"]').should('have.attr', 'role', 'listitem')
      cy.get('[data-testid="mark-all-read"]').should('have.attr', 'aria-label')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport()
      cy.navigateToNotifications()
      cy.wait('@getNotifications')

      // Should be responsive on mobile
      cy.get('[data-testid="notifications-page"]').should('be.visible')
      cy.get('[data-testid="notification-item"]').should('be.visible')

      // Tabs should be scrollable on mobile
      cy.get('[data-testid="notification-tabs"]').should('be.visible')
    })
  })
})