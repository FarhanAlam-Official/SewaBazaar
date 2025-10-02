describe('Provider Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.visit('/auth/login')
      cy.waitForPageLoad()

      // Fill login form
      cy.get('[data-testid="email-input"]').type('provider@test.com')
      cy.get('[data-testid="password-input"]').type('testpass123')

      // Mock successful login
      cy.intercept('POST', '/api/auth/login/', {
        statusCode: 200,
        body: {
          access: 'mock-access-token',
          refresh: 'mock-refresh-token',
          user: {
            id: 1,
            email: 'provider@test.com',
            role: 'provider',
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      }).as('login')

      cy.get('[data-testid="login-button"]').click()
      cy.wait('@login')

      // Should redirect to provider dashboard
      cy.url().should('include', '/dashboard/provider')
      cy.get('h1').should('contain', 'Welcome back')

      // Verify authentication state
      cy.getLocalStorage('access_token').should('exist')
      cy.getLocalStorage('user').should('exist')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/auth/login')
      cy.waitForPageLoad()

      cy.get('[data-testid="email-input"]').type('invalid@test.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')

      cy.intercept('POST', '/api/auth/login/', {
        statusCode: 401,
        body: { message: 'Invalid credentials' }
      }).as('loginError')

      cy.get('[data-testid="login-button"]').click()
      cy.wait('@loginError')

      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
      cy.url().should('include', '/auth/login')
    })

    it('should validate required fields', () => {
      cy.visit('/auth/login')
      cy.waitForPageLoad()

      // Try to submit without filling fields
      cy.get('[data-testid="login-button"]').click()

      cy.get('[data-testid="email-error"]').should('be.visible')
      cy.get('[data-testid="password-error"]').should('be.visible')
    })

    it('should validate email format', () => {
      cy.visit('/auth/login')
      cy.waitForPageLoad()

      cy.get('[data-testid="email-input"]').type('invalid-email')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()

      cy.get('[data-testid="email-error"]').should('contain', 'valid email')
    })
  })

  describe('Registration', () => {
    it('should register a new provider successfully', () => {
      cy.visit('/auth/register')
      cy.waitForPageLoad()

      // Fill registration form
      cy.get('[data-testid="email-input"]').type('newprovider@test.com')
      cy.get('[data-testid="password-input"]').type('newpassword123')
      cy.get('[data-testid="confirm-password-input"]').type('newpassword123')
      cy.get('[data-testid="first-name-input"]').type('Jane')
      cy.get('[data-testid="last-name-input"]').type('Smith')
      cy.get('[data-testid="phone-input"]').type('+977-9876543210')
      cy.get('[data-testid="role-provider"]').click()

      cy.intercept('POST', '/api/auth/register/', {
        statusCode: 201,
        body: {
          id: 2,
          email: 'newprovider@test.com',
          role: 'provider',
          first_name: 'Jane',
          last_name: 'Smith'
        }
      }).as('register')

      cy.get('[data-testid="register-button"]').click()
      cy.wait('@register')

      // Should show success message or redirect to login
      cy.get('[data-testid="success-message"]').should('be.visible')
        .or(() => cy.url().should('include', '/auth/login'))
    })

    it('should validate password confirmation', () => {
      cy.visit('/auth/register')
      cy.waitForPageLoad()

      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="confirm-password-input"]').type('differentpassword')
      cy.get('[data-testid="register-button"]').click()

      cy.get('[data-testid="password-error"]').should('contain', 'match')
    })

    it('should show error for existing email', () => {
      cy.visit('/auth/register')
      cy.waitForPageLoad()

      cy.get('[data-testid="email-input"]').type('existing@test.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="confirm-password-input"]').type('password123')
      cy.get('[data-testid="first-name-input"]').type('John')
      cy.get('[data-testid="last-name-input"]').type('Doe')
      cy.get('[data-testid="role-provider"]').click()

      cy.intercept('POST', '/api/auth/register/', {
        statusCode: 400,
        body: { email: ['User with this email already exists.'] }
      }).as('registerError')

      cy.get('[data-testid="register-button"]').click()
      cy.wait('@registerError')

      cy.get('[data-testid="email-error"]').should('contain', 'already exists')
    })
  })

  describe('Password Reset', () => {
    it('should send password reset email', () => {
      cy.visit('/auth/forgot-password')
      cy.waitForPageLoad()

      cy.get('[data-testid="email-input"]').type('provider@test.com')

      cy.intercept('POST', '/api/auth/password-reset/', {
        statusCode: 200,
        body: { message: 'Password reset email sent' }
      }).as('passwordReset')

      cy.get('[data-testid="reset-button"]').click()
      cy.wait('@passwordReset')

      cy.get('[data-testid="success-message"]').should('contain', 'reset email sent')
    })

    it('should show error for non-existent email', () => {
      cy.visit('/auth/forgot-password')
      cy.waitForPageLoad()

      cy.get('[data-testid="email-input"]').type('nonexistent@test.com')

      cy.intercept('POST', '/api/auth/password-reset/', {
        statusCode: 404,
        body: { message: 'User not found' }
      }).as('passwordResetError')

      cy.get('[data-testid="reset-button"]').click()
      cy.wait('@passwordResetError')

      cy.get('[data-testid="error-message"]').should('contain', 'User not found')
    })
  })

  describe('Logout', () => {
    it('should logout successfully', () => {
      // Login first
      cy.loginAsProvider()
      cy.navigateToProviderDashboard()

      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()

      // Should redirect to home page
      cy.url().should('not.include', '/dashboard')
      cy.getLocalStorage('access_token').should('not.exist')
      cy.getLocalStorage('user').should('not.exist')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/dashboard/provider')
      cy.url().should('include', '/auth/login')
    })

    it('should redirect customers away from provider dashboard', () => {
      cy.loginAsCustomer()
      cy.visit('/dashboard/provider')
      
      // Should redirect to customer dashboard or show access denied
      cy.url().should('not.include', '/dashboard/provider')
    })
  })

  describe('Session Management', () => {
    it('should handle token expiration', () => {
      cy.loginAsProvider()
      
      // Mock expired token response
      cy.intercept('GET', '/api/**', {
        statusCode: 401,
        body: { message: 'Token expired' }
      }).as('tokenExpired')

      cy.visit('/dashboard/provider')
      cy.wait('@tokenExpired')

      // Should redirect to login
      cy.url().should('include', '/auth/login')
    })

    it('should refresh token automatically', () => {
      cy.loginAsProvider()
      
      // Mock token refresh
      cy.intercept('POST', '/api/auth/refresh/', {
        statusCode: 200,
        body: { access: 'new-access-token' }
      }).as('refreshToken')

      // Simulate token refresh scenario
      cy.setLocalStorage('access_token', 'expired-token')
      cy.visit('/dashboard/provider')
      
      // Should attempt to refresh token
      cy.wait('@refreshToken')
      cy.getLocalStorage('access_token').should('equal', 'new-access-token')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.visit('/auth/login')
      cy.waitForPageLoad()

      // Tab through form elements
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'email-input')

      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'password-input')

      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'login-button')

      // Should be able to submit with Enter
      cy.get('[data-testid="email-input"]').type('provider@test.com')
      cy.get('[data-testid="password-input"]').type('testpass123{enter}')

      // Form should submit
      cy.get('[data-testid="login-button"]').should('be.focused')
    })

    it('should have proper ARIA labels', () => {
      cy.visit('/auth/login')
      cy.waitForPageLoad()

      cy.checkAccessibility()

      // Check specific accessibility features
      cy.get('[data-testid="email-input"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="login-button"]').should('have.attr', 'aria-label')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport()
      cy.visit('/auth/login')
      cy.waitForPageLoad()

      // Form should be visible and usable on mobile
      cy.get('[data-testid="login-form"]').should('be.visible')
      cy.get('[data-testid="email-input"]').should('be.visible')
      cy.get('[data-testid="password-input"]').should('be.visible')
      cy.get('[data-testid="login-button"]').should('be.visible')

      // Should be able to complete login flow on mobile
      cy.loginAsProvider()
      cy.url().should('include', '/dashboard/provider')
    })
  })
})