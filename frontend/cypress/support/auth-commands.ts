/// <reference types="cypress" />

// Authentication-related custom commands

Cypress.Commands.add('loginAsProvider', (email = 'provider@test.com', password = 'testpass123') => {
  cy.log('Logging in as provider')
  
  // Visit login page
  cy.visit('/auth/login')
  cy.waitForPageLoad()
  
  // Fill login form
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  
  // Mock successful login response
  cy.intercept('POST', '/api/auth/login/', {
    statusCode: 200,
    body: {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user: {
        id: 1,
        email: email,
        role: 'provider',
        first_name: 'Test',
        last_name: 'Provider'
      }
    }
  }).as('login')
  
  // Submit form
  cy.get('[data-testid="login-button"]').click()
  
  // Wait for login to complete
  cy.wait('@login')
  
  // Verify redirect to provider dashboard
  cy.url().should('include', '/dashboard/provider')
  
  // Set authentication tokens in localStorage
  cy.setLocalStorage('access_token', 'mock-access-token')
  cy.setLocalStorage('refresh_token', 'mock-refresh-token')
  cy.setLocalStorage('user', JSON.stringify({
    id: 1,
    email: email,
    role: 'provider',
    first_name: 'Test',
    last_name: 'Provider'
  }))
})

Cypress.Commands.add('loginAsCustomer', (email = 'customer@test.com', password = 'testpass123') => {
  cy.log('Logging in as customer')
  
  cy.visit('/auth/login')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  
  cy.intercept('POST', '/api/auth/login/', {
    statusCode: 200,
    body: {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user: {
        id: 2,
        email: email,
        role: 'customer',
        first_name: 'Test',
        last_name: 'Customer'
      }
    }
  }).as('customerLogin')
  
  cy.get('[data-testid="login-button"]').click()
  cy.wait('@customerLogin')
  
  cy.url().should('include', '/dashboard/customer')
  
  cy.setLocalStorage('access_token', 'mock-access-token')
  cy.setLocalStorage('refresh_token', 'mock-refresh-token')
  cy.setLocalStorage('user', JSON.stringify({
    id: 2,
    email: email,
    role: 'customer',
    first_name: 'Test',
    last_name: 'Customer'
  }))
})

Cypress.Commands.add('logout', () => {
  cy.log('Logging out')
  
  // Clear authentication data
  cy.clearLocalStorage()
  cy.clearCookies()
  
  // Mock logout API call
  cy.intercept('POST', '/api/auth/logout/', {
    statusCode: 200,
    body: { message: 'Logged out successfully' }
  }).as('logout')
  
  // Click logout button if on a dashboard page
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="logout-button"]').length > 0) {
      cy.get('[data-testid="logout-button"]').click()
      cy.wait('@logout')
    }
  })
  
  // Verify redirect to home page
  cy.visit('/')
  cy.url().should('not.include', '/dashboard')
})

// Helper to check if user is authenticated
Cypress.Commands.add('isAuthenticated', () => {
  return cy.getLocalStorage('access_token').then((token) => {
    return !!token
  })
})

// Helper to get current user from localStorage
Cypress.Commands.add('getCurrentUser', () => {
  return cy.getLocalStorage('user').then((userStr) => {
    return userStr ? JSON.parse(userStr) : null
  })
})

// Login with API call (faster for setup)
Cypress.Commands.add('loginViaAPI', (email = 'provider@test.com', password = 'testpass123', role = 'provider') => {
  cy.log(`Logging in via API as ${role}`)
  
  const userData = {
    id: role === 'provider' ? 1 : 2,
    email: email,
    role: role,
    first_name: 'Test',
    last_name: role === 'provider' ? 'Provider' : 'Customer'
  }
  
  // Set tokens directly without UI interaction
  cy.setLocalStorage('access_token', 'mock-access-token')
  cy.setLocalStorage('refresh_token', 'mock-refresh-token')
  cy.setLocalStorage('user', JSON.stringify(userData))
  
  // Mock API responses for authenticated requests
  cy.intercept('GET', '/api/auth/user/', {
    statusCode: 200,
    body: userData
  }).as('getAuthUser')
})

// Register new user
Cypress.Commands.add('registerUser', (userData: {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'provider' | 'customer'
  phone?: string
}) => {
  cy.log('Registering new user')
  
  cy.visit('/auth/register')
  cy.waitForPageLoad()
  
  // Fill registration form
  cy.get('[data-testid="email-input"]').type(userData.email)
  cy.get('[data-testid="password-input"]').type(userData.password)
  cy.get('[data-testid="confirm-password-input"]').type(userData.password)
  cy.get('[data-testid="first-name-input"]').type(userData.first_name)
  cy.get('[data-testid="last-name-input"]').type(userData.last_name)
  
  if (userData.phone) {
    cy.get('[data-testid="phone-input"]').type(userData.phone)
  }
  
  // Select role
  cy.get(`[data-testid="role-${userData.role}"]`).click()
  
  // Mock registration response
  cy.intercept('POST', '/api/auth/register/', {
    statusCode: 201,
    body: {
      id: Math.floor(Math.random() * 1000),
      email: userData.email,
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name
    }
  }).as('register')
  
  // Submit form
  cy.get('[data-testid="register-button"]').click()
  cy.wait('@register')
  
  // Verify success message or redirect
  cy.get('[data-testid="success-message"]').should('be.visible')
    .or(cy.url().should('include', '/auth/login'))
})

// Password reset flow
Cypress.Commands.add('resetPassword', (email: string) => {
  cy.log('Initiating password reset')
  
  cy.visit('/auth/forgot-password')
  cy.waitForPageLoad()
  
  cy.get('[data-testid="email-input"]').type(email)
  
  cy.intercept('POST', '/api/auth/password-reset/', {
    statusCode: 200,
    body: { message: 'Password reset email sent' }
  }).as('passwordReset')
  
  cy.get('[data-testid="reset-button"]').click()
  cy.wait('@passwordReset')
  
  cy.get('[data-testid="success-message"]').should('contain', 'reset email sent')
})

// Verify authentication state
Cypress.Commands.add('verifyAuthState', (expectedRole?: 'provider' | 'customer') => {
  cy.getCurrentUser().then((user) => {
    if (expectedRole) {
      expect(user).to.not.be.null
      expect(user.role).to.equal(expectedRole)
    } else {
      expect(user).to.be.null
    }
  })
})

// Mock authentication for testing without actual login
Cypress.Commands.add('mockAuthentication', (role: 'provider' | 'customer' = 'provider') => {
  const userData = {
    id: role === 'provider' ? 1 : 2,
    email: `${role}@test.com`,
    role: role,
    first_name: 'Test',
    last_name: role === 'provider' ? 'Provider' : 'Customer'
  }
  
  // Set up all necessary interceptors for authenticated requests
  cy.intercept('GET', '/api/auth/user/', { body: userData }).as('getUser')
  cy.intercept('GET', '/api/notifications/**', { fixture: 'notifications.json' }).as('getNotifications')
  
  if (role === 'provider') {
    cy.intercept('GET', '/api/provider/**', { fixture: 'provider-data.json' }).as('getProviderData')
  } else {
    cy.intercept('GET', '/api/customer/**', { fixture: 'customer-data.json' }).as('getCustomerData')
  }
  
  // Set authentication tokens
  cy.setLocalStorage('access_token', 'mock-access-token')
  cy.setLocalStorage('refresh_token', 'mock-refresh-token')
  cy.setLocalStorage('user', JSON.stringify(userData))
})