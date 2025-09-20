import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test files location
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'cypress/support/e2e.ts',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshotOnRunFailure: true,
    
    // Test settings
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry settings
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      // API endpoints
      apiUrl: 'http://localhost:8000/api',
      
      // Test user credentials
      providerEmail: 'test.provider@example.com',
      providerPassword: 'testpassword123',
      customerEmail: 'test.customer@example.com',
      customerPassword: 'testpassword123',
      
      // Test data
      testServiceId: 1,
      testBookingId: 1,
      
      // Feature flags
      enableNotifications: true,
      enableRealTimeUpdates: true
    },
    
    setupNodeEvents(on, config) {
      // Task definitions for custom commands
      on('task', {
        // Database seeding tasks
        seedDatabase() {
          // This would connect to test database and seed data
          return null
        },
        
        clearDatabase() {
          // This would clear test database
          return null
        },
        
        // API mocking tasks
        mockApiResponse({ endpoint, response }) {
          // Mock specific API responses for testing
          return null
        },
        
        // File system tasks
        readFile(filename) {
          return require('fs').readFileSync(filename, 'utf8')
        },
        
        // Log tasks for debugging
        log(message) {
          console.log(message)
          return null
        }
      })
      
      // Browser launch options
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--no-sandbox')
        }
        
        return launchOptions
      })
      
      // Test result processing
      on('after:run', (results) => {
        // Process test results, send to reporting service, etc.
        console.log('Test run completed:', {
          totalTests: results.totalTests,
          totalPassed: results.totalPassed,
          totalFailed: results.totalFailed,
          totalSkipped: results.totalSkipped
        })
      })
      
      return config
    }
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts'
  }
})