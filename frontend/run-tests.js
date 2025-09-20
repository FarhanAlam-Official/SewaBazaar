#!/usr/bin/env node

/**
 * Comprehensive Frontend Test Runner
 * Runs Jest tests with coverage and generates reports
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function runCommand(command, description) {
  log(`\n${colors.blue}Running: ${description}${colors.reset}`)
  log(`${colors.cyan}Command: ${command}${colors.reset}`)
  
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname })
    return true
  } catch (error) {
    log(`${colors.red}Error: ${error.message}${colors.reset}`)
    return false
  }
}

function displayHeader() {
  log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                    FRONTEND TEST SUITE                       ║
║                  Provider Dashboard Tests                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`)
}

function displayTestCategories() {
  log(`${colors.bright}Test Categories:${colors.reset}`)
  log(`${colors.green}1. Component Tests${colors.reset} - React component rendering and interactions`)
  log(`${colors.green}2. Hook Tests${colors.reset} - Custom React hooks functionality`)
  log(`${colors.green}3. API Tests${colors.reset} - API service integration and error handling`)
  log(`${colors.green}4. Integration Tests${colors.reset} - Component + API integration`)
  log(`${colors.green}5. Accessibility Tests${colors.reset} - A11y compliance and keyboard navigation`)
}

function runAllTests() {
  displayHeader()
  displayTestCategories()
  
  log(`\n${colors.bright}Starting comprehensive test suite...${colors.reset}`)
  
  const testCommands = [
    {
      command: 'npm test -- --coverage --watchAll=false --verbose',
      description: 'Running all tests with coverage'
    }
  ]
  
  let allPassed = true
  
  for (const { command, description } of testCommands) {
    const success = runCommand(command, description)
    if (!success) {
      allPassed = false
      break
    }
  }
  
  if (allPassed) {
    log(`\n${colors.bright}${colors.green}✅ ALL TESTS PASSED!${colors.reset}`)
    displayCoverageInfo()
  } else {
    log(`\n${colors.bright}${colors.red}❌ SOME TESTS FAILED!${colors.reset}`)
    process.exit(1)
  }
}

function runSpecificTests() {
  displayHeader()
  
  const testCategories = {
    '1': {
      name: 'Component Tests',
      pattern: 'src/__tests__/provider/*.test.tsx',
      description: 'React component tests'
    },
    '2': {
      name: 'Hook Tests', 
      pattern: 'src/__tests__/hooks/*.test.ts',
      description: 'Custom React hooks tests'
    },
    '3': {
      name: 'API Tests',
      pattern: 'src/__tests__/api/*.test.ts',
      description: 'API service integration tests'
    },
    '4': {
      name: 'Integration Tests',
      pattern: 'src/__tests__/integration/*.test.tsx',
      description: 'Component + API integration tests'
    },
    '5': {
      name: 'Accessibility Tests',
      pattern: 'src/__tests__/a11y/*.test.tsx',
      description: 'Accessibility and keyboard navigation tests'
    }
  }
  
  log(`${colors.bright}Available test categories:${colors.reset}`)
  Object.entries(testCategories).forEach(([key, category]) => {
    log(`${colors.green}${key}. ${category.name}${colors.reset} - ${category.description}`)
  })
  log(`${colors.green}0. Run all tests${colors.reset}`)
  
  // In a real CLI, you'd use readline or inquirer
  // For now, we'll just run all tests
  runAllTests()
}

function runWatchMode() {
  displayHeader()
  log(`${colors.bright}Starting test watch mode...${colors.reset}`)
  
  const success = runCommand(
    'npm test -- --watch',
    'Running tests in watch mode'
  )
  
  if (!success) {
    process.exit(1)
  }
}

function runCoverageOnly() {
  displayHeader()
  log(`${colors.bright}Generating coverage report...${colors.reset}`)
  
  const success = runCommand(
    'npm run test:coverage',
    'Generating test coverage report'
  )
  
  if (success) {
    displayCoverageInfo()
  } else {
    process.exit(1)
  }
}

function displayCoverageInfo() {
  log(`\n${colors.bright}${colors.cyan}Coverage Report Generated:${colors.reset}`)
  log(`${colors.yellow}📊 HTML Report: coverage/lcov-report/index.html${colors.reset}`)
  log(`${colors.yellow}📋 Text Report: Displayed above${colors.reset}`)
  log(`${colors.yellow}📄 LCOV File: coverage/lcov.info${colors.reset}`)
  
  // Check if coverage directory exists
  const coverageDir = path.join(__dirname, 'coverage')
  if (fs.existsSync(coverageDir)) {
    log(`\n${colors.green}✅ Coverage files generated successfully${colors.reset}`)
    
    // Try to read coverage summary
    const summaryPath = path.join(coverageDir, 'coverage-summary.json')
    if (fs.existsSync(summaryPath)) {
      try {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
        const total = summary.total
        
        log(`\n${colors.bright}Coverage Summary:${colors.reset}`)
        log(`${colors.cyan}Lines: ${total.lines.pct}%${colors.reset}`)
        log(`${colors.cyan}Functions: ${total.functions.pct}%${colors.reset}`)
        log(`${colors.cyan}Branches: ${total.branches.pct}%${colors.reset}`)
        log(`${colors.cyan}Statements: ${total.statements.pct}%${colors.reset}`)
        
        // Check if coverage meets thresholds
        const threshold = 80
        const meetsThreshold = 
          total.lines.pct >= threshold &&
          total.functions.pct >= threshold &&
          total.branches.pct >= threshold &&
          total.statements.pct >= threshold
        
        if (meetsThreshold) {
          log(`\n${colors.green}✅ Coverage meets threshold (${threshold}%)${colors.reset}`)
        } else {
          log(`\n${colors.yellow}⚠️  Coverage below threshold (${threshold}%)${colors.reset}`)
        }
      } catch (error) {
        log(`${colors.yellow}⚠️  Could not read coverage summary${colors.reset}`)
      }
    }
  }
}

function runLinting() {
  displayHeader()
  log(`${colors.bright}Running ESLint...${colors.reset}`)
  
  const success = runCommand(
    'npm run lint',
    'Running ESLint checks'
  )
  
  if (success) {
    log(`\n${colors.green}✅ No linting errors found${colors.reset}`)
  } else {
    log(`\n${colors.red}❌ Linting errors found${colors.reset}`)
    process.exit(1)
  }
}

function runTypeCheck() {
  displayHeader()
  log(`${colors.bright}Running TypeScript type check...${colors.reset}`)
  
  const success = runCommand(
    'npx tsc --noEmit',
    'Running TypeScript type check'
  )
  
  if (success) {
    log(`\n${colors.green}✅ No type errors found${colors.reset}`)
  } else {
    log(`\n${colors.red}❌ Type errors found${colors.reset}`)
    process.exit(1)
  }
}

function runFullQualityCheck() {
  displayHeader()
  log(`${colors.bright}Running full quality check...${colors.reset}`)
  
  const checks = [
    { fn: runTypeCheck, name: 'TypeScript Check' },
    { fn: runLinting, name: 'ESLint Check' },
    { fn: runAllTests, name: 'Test Suite' }
  ]
  
  for (const check of checks) {
    log(`\n${colors.bright}${colors.blue}Running ${check.name}...${colors.reset}`)
    try {
      check.fn()
    } catch (error) {
      log(`\n${colors.red}❌ ${check.name} failed${colors.reset}`)
      process.exit(1)
    }
  }
  
  log(`\n${colors.bright}${colors.green}✅ ALL QUALITY CHECKS PASSED!${colors.reset}`)
}

// Main execution
function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'watch':
      runWatchMode()
      break
    case 'coverage':
      runCoverageOnly()
      break
    case 'lint':
      runLinting()
      break
    case 'type-check':
      runTypeCheck()
      break
    case 'quality':
      runFullQualityCheck()
      break
    case 'specific':
      runSpecificTests()
      break
    case 'help':
      displayHelp()
      break
    default:
      runAllTests()
  }
}

function displayHelp() {
  displayHeader()
  log(`${colors.bright}Usage: node run-tests.js [command]${colors.reset}`)
  log(`\n${colors.bright}Commands:${colors.reset}`)
  log(`${colors.green}  (no command)${colors.reset}  Run all tests with coverage`)
  log(`${colors.green}  watch${colors.reset}         Run tests in watch mode`)
  log(`${colors.green}  coverage${colors.reset}      Generate coverage report only`)
  log(`${colors.green}  lint${colors.reset}          Run ESLint checks`)
  log(`${colors.green}  type-check${colors.reset}    Run TypeScript type checking`)
  log(`${colors.green}  quality${colors.reset}       Run full quality check (types + lint + tests)`)
  log(`${colors.green}  specific${colors.reset}      Run specific test categories`)
  log(`${colors.green}  help${colors.reset}          Show this help message`)
  
  log(`\n${colors.bright}Examples:${colors.reset}`)
  log(`${colors.cyan}  node run-tests.js${colors.reset}           # Run all tests`)
  log(`${colors.cyan}  node run-tests.js watch${colors.reset}     # Watch mode`)
  log(`${colors.cyan}  node run-tests.js quality${colors.reset}   # Full quality check`)
}

// Run the main function
if (require.main === module) {
  main()
}

module.exports = {
  runAllTests,
  runSpecificTests,
  runWatchMode,
  runCoverageOnly,
  runLinting,
  runTypeCheck,
  runFullQualityCheck
}    ret
urn false
  }
}

// Update snapshots
async function updateSnapshots() {
  printHeader('UPDATING TEST SNAPSHOTS')
  
  try {
    await runJest({
      updateSnapshots: true,
      verbose: true
    })
    
    console.log('\n' + colorize('✅ Snapshots updated successfully!', 'green'))
    return true
  } catch (error) {
    console.error('\n' + colorize('❌ Failed to update snapshots!', 'red'))
    console.error(colorize(error.message, 'red'))
    return false
  }
}

// Print usage information
function printUsage() {
  printHeader('FRONTEND TEST RUNNER - USAGE')
  
  console.log(colorize('Available commands:', 'yellow'))
  console.log('')
  console.log('  npm run test              - Run all tests with coverage')
  console.log('  npm run test:watch        - Run tests in watch mode')
  console.log('  npm run test:hooks        - Run React hooks tests')
  console.log('  npm run test:components   - Run component tests')
  console.log('  npm run test:pages        - Run page tests')
  console.log('  npm run test:services     - Run API service tests')
  console.log('  npm run test:utils        - Run utility tests')
  console.log('  npm run test:integration  - Run integration tests')
  console.log('  npm run test:performance  - Run performance tests')
  console.log('  npm run test:report       - Generate comprehensive test report')
  console.log('  npm run test:snapshots    - Update test snapshots')
  console.log('')
  
  console.log(colorize('Test Categories:', 'yellow'))
  Object.entries(testCategories).forEach(([key, category]) => {
    console.log(`  ${colorize(key.padEnd(12), 'cyan')} - ${category.description}`)
  })
  
  console.log('')
  console.log(colorize('Examples:', 'yellow'))
  console.log('  node run-tests.js all              # Run all tests')
  console.log('  node run-tests.js hooks            # Run only hooks tests')
  console.log('  node run-tests.js watch             # Watch mode')
  console.log('  node run-tests.js report            # Generate report')
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'
  
  console.log(colorize('🧪 Provider Dashboard Frontend Test Runner', 'bright'))\n  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error(colorize('❌ Error: package.json not found. Please run from the frontend directory.', 'red'))
    process.exit(1)
  }
  
  // Check if Jest is installed
  if (!fs.existsSync('node_modules/.bin/jest') && !fs.existsSync('node_modules/jest')) {
    console.error(colorize('❌ Error: Jest not found. Please run npm install first.', 'red'))
    process.exit(1)
  }
  
  let success = false
  
  switch (command) {\n    case 'all':\n    case 'coverage':\n      success = await runAllTestsWithCoverage()\n      break\n      \n    case 'watch':\n      await runTestsInWatchMode()\n      return // Watch mode doesn't exit normally\n      \n    case 'performance':\n    case 'perf':\n      success = await runPerformanceTests()\n      break\n      \n    case 'report':\n      success = await generateTestReport()\n      break\n      \n    case 'snapshots':\n    case 'update-snapshots':\n      success = await updateSnapshots()\n      break\n      \n    case 'help':\n    case '--help':\n    case '-h':\n      printUsage()\n      return\n      \n    default:\n      // Check if it's a test category\n      if (testCategories[command]) {\n        success = await runTestCategory(command)\n      } else {\n        console.error(colorize(`❌ Unknown command: ${command}`, 'red'))\n        printUsage()\n        process.exit(1)\n      }\n      break\n  }\n  \n  if (success) {\n    console.log('\\n' + colorize('🎉 Test execution completed successfully!', 'green'))\n    process.exit(0)\n  } else {\n    console.log('\\n' + colorize('💥 Test execution failed!', 'red'))\n    process.exit(1)\n  }\n}\n\n// Handle uncaught errors\nprocess.on('unhandledRejection', (error) => {\n  console.error('\\n' + colorize('💥 Unhandled error:', 'red'))\n  console.error(colorize(error.message, 'red'))\n  process.exit(1)\n})\n\n// Run main function\nif (require.main === module) {\n  main().catch((error) => {\n    console.error('\\n' + colorize('💥 Fatal error:', 'red'))\n    console.error(colorize(error.message, 'red'))\n    process.exit(1)\n  })\n}\n\nmodule.exports = {\n  runAllTestsWithCoverage,\n  runTestCategory,\n  runTestsInWatchMode,\n  runPerformanceTests,\n  generateTestReport,\n  updateSnapshots\n}