#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner for Provider Dashboard
 * Runs Cypress tests with different configurations and generates reports
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function printHeader(title) {
  console.log('\n' + '='.repeat(80))
  console.log(colorize(title, 'cyan'))
  console.log('='.repeat(80))
}

function printSection(title) {
  console.log('\n' + colorize(title, 'yellow'))
  console.log('-'.repeat(60))
}

// Test configurations
const testConfigs = {
  validation: {
    name: 'Validation Tests',
    description: 'Basic setup validation without server dependency',
    spec: 'cypress/e2e/smoke/basic-validation.cy.ts',
    browser: 'chrome',
    headless: true
  },
  smoke: {
    name: 'Smoke Tests (Server Independent)',
    description: 'Quick smoke tests that work without server',
    spec: 'cypress/e2e/smoke/basic-validation.cy.ts,cypress/e2e/smoke/config-validation.cy.ts',
    browser: 'chrome',
    headless: true
  },
  smokeAll: {
    name: 'All Smoke Tests',
    description: 'All smoke tests including server-dependent ones',
    spec: 'cypress/e2e/smoke/**/*.cy.ts',
    browser: 'chrome',
    headless: true
  },
  full: {
    name: 'Full Test Suite',
    description: 'Complete end-to-end test suite',
    spec: 'cypress/e2e/**/*.cy.ts',
    browser: 'chrome',
    headless: true
  },
  mobile: {
    name: 'Mobile Tests',
    description: 'Tests on mobile viewport',
    spec: 'cypress/e2e/**/*.cy.ts',
    browser: 'chrome',
    headless: true,
    viewport: 'iphone-x'
  },
  crossBrowser: {
    name: 'Cross-Browser Tests',
    description: 'Tests across different browsers',
    spec: 'cypress/e2e/provider-dashboard-workflow.cy.ts',
    browsers: ['chrome', 'firefox', 'edge'],
    headless: true
  },
  visual: {
    name: 'Visual Regression Tests',
    description: 'Visual regression testing',
    spec: 'cypress/e2e/visual/**/*.cy.ts',
    browser: 'chrome',
    headless: true
  }
}

// Environment configurations
const environments = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:8000/api'
  },
  staging: {
    baseUrl: 'https://staging.sewabazaar.com',
    apiUrl: 'https://staging-api.sewabazaar.com/api'
  },
  production: {
    baseUrl: 'https://sewabazaar.com',
    apiUrl: 'https://api.sewabazaar.com/api'
  }
}

// Cypress command builder
function buildCypressCommand(options = {}) {
  const baseCmd = ['npx', 'cypress']
  
  if (options.mode === 'open') {
    baseCmd.push('open')
  } else {
    baseCmd.push('run')
  }
  
  if (options.spec) {
    baseCmd.push('--spec', options.spec)
  }
  
  if (options.browser) {
    baseCmd.push('--browser', options.browser)
  }
  
  if (options.headless) {
    baseCmd.push('--headless')
  }
  
  if (options.record) {
    baseCmd.push('--record')
  }
  
  if (options.key) {
    baseCmd.push('--key', options.key)
  }
  
  if (options.parallel) {
    baseCmd.push('--parallel')
  }
  
  if (options.env) {
    Object.entries(options.env).forEach(([key, value]) => {
      baseCmd.push('--env', `${key}=${value}`)
    })
  }
  
  if (options.config) {
    Object.entries(options.config).forEach(([key, value]) => {
      baseCmd.push('--config', `${key}=${value}`)
    })
  }
  
  return baseCmd
}

// Run Cypress with given options
function runCypress(options = {}) {
  return new Promise((resolve, reject) => {
    const cmd = buildCypressCommand(options)
    
    console.log(colorize(`Running: ${cmd.join(' ')}`, 'blue'))
    
    const childProcess = spawn(cmd[0], cmd.slice(1), {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ...options.envVars
      }
    })
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Cypress exited with code ${code}`))
      }
    })
    
    childProcess.on('error', (error) => {
      reject(error)
    })
  })
}

// Run validation tests
async function runValidationTests(environment = 'local') {
  printHeader('RUNNING VALIDATION TESTS')
  
  const env = environments[environment]
  if (!env) {
    throw new Error(`Unknown environment: ${environment}`)
  }
  
  console.log(colorize(`Environment: ${environment}`, 'blue'))
  console.log(colorize('Running basic setup validation (no server required)', 'blue'))
  
  try {
    await runCypress({
      spec: testConfigs.validation.spec,
      browser: testConfigs.validation.browser,
      headless: testConfigs.validation.headless,
      env: {
        baseUrl: env.baseUrl,
        apiUrl: env.apiUrl
      }
    })
    
    console.log('\n' + colorize('✅ Validation tests passed!', 'green'))
    return true
  } catch (error) {
    console.error('\n' + colorize('❌ Validation tests failed!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Run smoke tests (server independent)
async function runSmokeTests(environment = 'local') {
  printHeader('RUNNING SMOKE TESTS (SERVER INDEPENDENT)')
  
  const env = environments[environment]
  if (!env) {
    throw new Error(`Unknown environment: ${environment}`)
  }
  
  console.log(colorize(`Environment: ${environment}`, 'blue'))
  console.log(colorize('Running server-independent smoke tests', 'blue'))
  
  try {
    await runCypress({
      spec: testConfigs.smoke.spec,
      browser: testConfigs.smoke.browser,
      headless: testConfigs.smoke.headless,
      env: {
        baseUrl: env.baseUrl,
        apiUrl: env.apiUrl
      }
    })
    
    console.log('\n' + colorize('✅ Smoke tests passed!', 'green'))
    return true
  } catch (error) {
    console.error('\n' + colorize('❌ Smoke tests failed!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Run all smoke tests (including server dependent)
async function runAllSmokeTests(environment = 'local') {
  printHeader('RUNNING ALL SMOKE TESTS')
  
  const env = environments[environment]
  if (!env) {
    throw new Error(`Unknown environment: ${environment}`)
  }
  
  console.log(colorize(`Environment: ${environment}`, 'blue'))
  console.log(colorize(`Base URL: ${env.baseUrl}`, 'blue'))
  console.log(colorize('⚠️ Requires application server to be running', 'yellow'))
  
  try {
    await runCypress({
      spec: testConfigs.smokeAll.spec,
      browser: testConfigs.smokeAll.browser,
      headless: testConfigs.smokeAll.headless,
      env: {
        baseUrl: env.baseUrl,
        apiUrl: env.apiUrl
      }
    })
    
    console.log('\n' + colorize('✅ All smoke tests passed!', 'green'))
    return true
  } catch (error) {
    console.error('\n' + colorize('❌ Some smoke tests failed!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Run full test suite
async function runFullTests(environment = 'local') {
  printHeader('RUNNING FULL TEST SUITE')
  
  const env = environments[environment]
  console.log(colorize(`Environment: ${environment}`, 'blue'))
  
  try {
    await runCypress({
      spec: testConfigs.full.spec,
      browser: testConfigs.full.browser,
      headless: testConfigs.full.headless,
      env: {
        baseUrl: env.baseUrl,
        apiUrl: env.apiUrl
      },
      config: {
        video: true,
        screenshotOnRunFailure: true
      }
    })
    
    console.log('\n' + colorize('✅ Full test suite passed!', 'green'))
    return true
  } catch (error) {
    console.error('\n' + colorize('❌ Full test suite failed!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Run cross-browser tests
async function runCrossBrowserTests(environment = 'local') {
  printHeader('RUNNING CROSS-BROWSER TESTS')
  
  const env = environments[environment]
  const browsers = testConfigs.crossBrowser.browsers
  const results = []
  
  for (const browser of browsers) {
    printSection(`Testing on ${browser.toUpperCase()}`)
    
    try {
      await runCypress({
        spec: testConfigs.crossBrowser.spec,
        browser: browser,
        headless: true,
        env: {
          baseUrl: env.baseUrl,
          apiUrl: env.apiUrl
        }
      })
      
      console.log(colorize(`✅ ${browser} tests passed!`, 'green'))
      results.push({ browser, status: 'passed' })
    } catch (error) {
      console.error(colorize(`❌ ${browser} tests failed!`, 'red'))
      results.push({ browser, status: 'failed', error: error.message })
    }
  }
  
  // Summary
  printSection('CROSS-BROWSER TEST RESULTS')
  results.forEach(result => {
    const status = result.status === 'passed' 
      ? colorize('PASSED', 'green') 
      : colorize('FAILED', 'red')
    console.log(`${result.browser.padEnd(10)} ${status}`)
  })
  
  const allPassed = results.every(r => r.status === 'passed')
  return allPassed
}

// Run mobile tests
async function runMobileTests(environment = 'local') {
  printHeader('RUNNING MOBILE TESTS')
  
  const env = environments[environment]
  
  try {
    await runCypress({
      spec: testConfigs.mobile.spec,
      browser: testConfigs.mobile.browser,
      headless: testConfigs.mobile.headless,
      env: {
        baseUrl: env.baseUrl,
        apiUrl: env.apiUrl
      },
      config: {
        viewportWidth: 375,
        viewportHeight: 812
      }
    })
    
    console.log('\n' + colorize('✅ Mobile tests passed!', 'green'))
    return true
  } catch (error) {
    console.error('\n' + colorize('❌ Mobile tests failed!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Run visual regression tests
async function runVisualTests(environment = 'local') {
  printHeader('RUNNING VISUAL REGRESSION TESTS')
  
  const env = environments[environment]
  
  try {
    await runCypress({
      spec: testConfigs.visual.spec,
      browser: testConfigs.visual.browser,
      headless: testConfigs.visual.headless,
      env: {
        baseUrl: env.baseUrl,
        apiUrl: env.apiUrl
      },
      config: {
        screenshotsFolder: 'cypress/screenshots/visual',
        video: false
      }
    })
    
    console.log('\n' + colorize('✅ Visual regression tests passed!', 'green'))
    return true
  } catch (error) {
    console.error('\n' + colorize('❌ Visual regression tests failed!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Run performance tests
async function runPerformanceTests(environment = 'local') {
  printHeader('RUNNING PERFORMANCE TESTS')
  
  const env = environments[environment]
  
  try {
    await runCypress({
      spec: 'cypress/e2e/performance/**/*.cy.ts',
      browser: 'chrome',
      headless: true,
      env: {
        baseUrl: env.baseUrl,
        apiUrl: env.apiUrl
      }
    })
    
    console.log('\n' + colorize('✅ Performance tests passed!', 'green'))
    return true
  } catch (error) {
    console.error('\n' + colorize('❌ Performance tests failed!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Open Cypress Test Runner
async function openCypress(environment = 'local') {
  printHeader('OPENING CYPRESS TEST RUNNER')
  
  const env = environments[environment]
  console.log(colorize(`Environment: ${environment}`, 'blue'))
  
  try {
    await runCypress({
      mode: 'open',
      env: {
        baseUrl: env.baseUrl,
        apiUrl: env.apiUrl
      }
    })
  } catch (error) {
    console.error(colorize('Failed to open Cypress:', 'red'))
    console.error(colorize(error.message, 'red'))
  }
}

// Generate test report
async function generateTestReport() {
  printHeader('GENERATING TEST REPORT')
  
  try {
    // Run tests with JSON reporter
    await runCypress({
      spec: testConfigs.full.spec,
      browser: 'chrome',
      headless: true,
      config: {
        reporter: 'mochawesome',
        reporterOptions: {
          reportDir: 'cypress/reports',
          overwrite: false,
          html: true,
          json: true
        }
      }
    })
    
    console.log(colorize('📊 Test report generated successfully!', 'green'))
    console.log(colorize('📁 Report location: ./cypress/reports/', 'blue'))
    
    return true
  } catch (error) {
    console.error(colorize('❌ Failed to generate test report!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Run CI/CD pipeline tests
async function runCIPipeline(environment = 'staging') {
  printHeader('RUNNING CI/CD PIPELINE TESTS')
  
  const results = {
    smoke: false,
    full: false,
    mobile: false,
    crossBrowser: false
  }
  
  try {
    // Run smoke tests first
    printSection('Step 1: Smoke Tests')
    results.smoke = await runSmokeTests(environment)
    
    if (!results.smoke) {
      throw new Error('Smoke tests failed - stopping pipeline')
    }
    
    // Run full test suite
    printSection('Step 2: Full Test Suite')
    results.full = await runFullTests(environment)
    
    // Run mobile tests
    printSection('Step 3: Mobile Tests')
    results.mobile = await runMobileTests(environment)
    
    // Run cross-browser tests
    printSection('Step 4: Cross-Browser Tests')
    results.crossBrowser = await runCrossBrowserTests(environment)
    
    // Generate report
    printSection('Step 5: Generate Report')
    await generateTestReport()
    
    // Summary
    printSection('PIPELINE RESULTS')
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? colorize('PASSED', 'green') : colorize('FAILED', 'red')
      console.log(`${test.padEnd(15)} ${status}`)
    })
    
    const allPassed = Object.values(results).every(Boolean)
    
    if (allPassed) {
      console.log('\n' + colorize('🎉 All pipeline tests passed!', 'green'))
    } else {
      console.log('\n' + colorize('❌ Some pipeline tests failed!', 'red'))
    }
    
    return allPassed
    
  } catch (error) {
    console.error('\n' + colorize('❌ Pipeline failed!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const environment = args[1] || 'local'
  
  if (!environments[environment]) {
    console.error(colorize(`Unknown environment: ${environment}`, 'red'))
    console.error(colorize('Available environments: local, staging, production', 'yellow'))
    process.exit(1)
  }
  
  try {
    switch (command) {
      case 'validation':
        await runValidationTests(environment)
        break
        
      case 'smoke':
        await runSmokeTests(environment)
        break
        
      case 'smoke-all':
        await runAllSmokeTests(environment)
        break
        
      case 'full':
        await runFullTests(environment)
        break
        
      case 'mobile':
        await runMobileTests(environment)
        break
        
      case 'cross-browser':
        await runCrossBrowserTests(environment)
        break
        
      case 'visual':
        await runVisualTests(environment)
        break
        
      case 'performance':
        await runPerformanceTests(environment)
        break
        
      case 'open':
        await openCypress(environment)
        break
        
      case 'report':
        await generateTestReport()
        break
        
      case 'ci':
        const success = await runCIPipeline(environment)
        process.exit(success ? 0 : 1)
        break
        
      default:
        console.log(colorize('E2E Test Runner for Provider Dashboard', 'cyan'))
        console.log('\nUsage: node run-e2e-tests.js <command> [environment]')
        console.log('\nCommands:')
        console.log('  validation    Run basic validation tests (no server required)')
        console.log('  smoke         Run smoke tests (server independent)')
        console.log('  smoke-all     Run all smoke tests (requires server)')
        console.log('  full          Run full test suite')
        console.log('  mobile        Run mobile tests')
        console.log('  cross-browser Run cross-browser tests')
        console.log('  visual        Run visual regression tests')
        console.log('  performance   Run performance tests')
        console.log('  open          Open Cypress Test Runner')
        console.log('  report        Generate test report')
        console.log('  ci            Run CI/CD pipeline')
        console.log('\nEnvironments:')
        console.log('  local         Local development (default)')
        console.log('  staging       Staging environment')
        console.log('  production    Production environment')
        console.log('\nExamples:')
        console.log('  node run-e2e-tests.js smoke')
        console.log('  node run-e2e-tests.js full staging')
        console.log('  node run-e2e-tests.js ci production')
        break
    }
  } catch (error) {
    console.error(colorize('Error:', 'red'), error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = {
  runValidationTests,
  runSmokeTests,
  runAllSmokeTests,
  runFullTests,
  runCrossBrowserTests,
  runMobileTests,
  runVisualTests,
  runPerformanceTests,
  runCIPipeline,
  generateTestReport
}