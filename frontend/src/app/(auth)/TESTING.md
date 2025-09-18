# Authentication Functionality Testing

This directory contains comprehensive tests for all authentication flows in the application.

## Test Files Overview

1. **Individual Component Tests**:
   - `register/page.test.tsx` - Tests for the registration page
   - `login/page.test.tsx` - Tests for the login page
   - `login-otp/page.test.tsx` - Tests for the login with OTP page
   - `forgot-password/page.test.tsx` - Tests for the forgot password page
   - `reset-password-otp/page.test.tsx` - Tests for the reset password with OTP page
   - `reset-password/[uid]/[token]/page.test.tsx` - Tests for the reset password with token page

2. **Integration Tests**:
   - `auth.integration.test.tsx` - Tests the complete user journey through all authentication flows

3. **Verification Script**:
   - `../scripts/test-auth.js` - A simple Node.js script to verify all authentication functionality

## Running the Tests

### Unit and Integration Tests

To run the Jest tests:

```bash
npm test
```

Or to run tests in watch mode:

```bash
npm run test:watch
```

To run tests for authentication components specifically:

```bash
npm test -- src/app/(auth)
```

### Verification Script

To run the simple verification script:

```bash
node scripts/test-auth.js
```

## What the Tests Cover

### 1. Registration Flow

- User registration with form validation
- OTP request and verification
- Auto-submit functionality when all OTP digits are entered
- Redirect to dashboard after successful registration

### 2. Regular Login Flow

- Email and password authentication
- Form validation
- Redirect to user dashboard after successful login
- Error handling for invalid credentials

### 3. Login with OTP Flow

- OTP request for existing users
- OTP verification and login
- Auto-submit functionality
- Redirect to customer dashboard after successful login

### 4. Forgot Password Flow

- Password reset request with email validation
- Success state with important information
- Cooldown timer for resend functionality
- Navigation back to login page

### 5. Password Reset with OTP Flow

- Request password reset with email
- Password strength validation
- Password generation functionality
- OTP verification for password reset
- Auto-submit functionality
- Redirect to login page after successful reset

### 6. Password Reset with Token Flow

- Token-based password reset
- Password strength validation
- Password generation functionality
- Redirect to login page after successful reset

### 7. Common Functionality

- Password generation
- Password strength calculation
- Auto-submit when OTP is complete
- Proper redirect behavior
- Error handling

## Test Results

All tests should pass with the current implementation. If any tests fail, check:

1. Service implementations in `@/services/api`
2. Toast notification configurations
3. Router navigation paths
4. Component state management
5. Form validation logic

## Continuous Integration

These tests are run automatically in the CI pipeline to ensure authentication functionality remains intact during development.
