/**
 * Integration tests for all authentication flows
 * Tests the complete user journey through registration, login, and password reset
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';

// Mock all auth services
jest.mock('@/services/api', () => ({
  authService: {
    register: jest.fn(),
    requestOTP: jest.fn(),
    verifyOTP: jest.fn(),
    verifyOTPLogin: jest.fn(),
    resetPasswordWithOTP: jest.fn(),
    confirmPasswordReset: jest.fn(),
  },
}));

// Mock toast notifications
jest.mock('@/components/ui/enhanced-toast', () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useParams: () => ({
    uid: 'test-uid',
    token: 'test-token',
  }),
}));

// Import all auth components
import RegisterPage from './register/page';
import LoginPage from './login/page';
import LoginWithOTPPage from './login-otp/page';
import ForgotPasswordPage from './forgot-password/page';
import ResetPasswordOTPPage from './reset-password-otp/page';
import ResetPasswordLinkPage from './reset-password/[uid]/[token]/page';

describe('Authentication Integration Tests', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe('Complete User Journey', () => {
    it('should allow a user to register, login, and reset password', async () => {
      const { authService } = require('@/services/api');
      
      // Mock all service responses
      authService.register.mockResolvedValue({ success: true });
      authService.requestOTP.mockResolvedValue({ success: true });
      authService.verifyOTP.mockResolvedValue({ success: true });
      authService.verifyOTPLogin.mockResolvedValue({ success: true });
      authService.resetPasswordWithOTP.mockResolvedValue({ success: true });
      authService.confirmPasswordReset.mockResolvedValue({ success: true });

      // 1. User registers
      render(<RegisterPage />);
      
      // Fill registration form
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
      
      // Submit registration
      const registerButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(registerButton);
      
      // Verify registration service was called
      await waitFor(() => {
        expect(authService.requestOTP).toHaveBeenCalledWith('john@example.com');
      });
      
      // 2. User verifies OTP
      // Fill in OTP
      const otpInputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        await user.type(otpInputs[i], '1');
      }
      
      // Wait for auto-submit
      jest.useFakeTimers();
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(authService.verifyOTP).toHaveBeenCalledWith('john@example.com', '111111');
      });
      
      // Verify redirect to dashboard
      jest.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
      
      jest.useRealTimers();
      
      // 3. User logs out and logs back in with regular login
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText('Email address'), 'john@example.com');
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
      
      const loginButton = screen.getByRole('button', { name: 'Sign in' });
      await user.click(loginButton);
      
      // Verify login service was called
      const { useAuth } = require('@/contexts/AuthContext');
      await waitFor(() => {
        expect(useAuth().login).toHaveBeenCalledWith('john@example.com', 'StrongPassword123!', false);
      });
      
      // Verify redirect to dashboard
      jest.useFakeTimers();
      jest.advanceTimersByTime(1500);
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard/customer');
      });
      jest.useRealTimers();
      
      // 4. User logs out and logs back in with OTP
      // (simulate being on login OTP page)
      render(<LoginWithOTPPage />);
      
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      
      const loginOTPButton = screen.getByRole('button', { name: 'Send code' });
      await user.click(loginOTPButton);
      
      // Verify OTP was requested
      await waitFor(() => {
        expect(authService.requestOTP).toHaveBeenCalledWith('john@example.com');
      });
      
      // Fill in OTP
      const loginOtpInputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        await user.type(loginOtpInputs[i], '2');
      }
      
      // Wait for auto-submit
      jest.useFakeTimers();
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(authService.verifyOTPLogin).toHaveBeenCalledWith('john@example.com', '222222', false);
      });
      
      // Verify redirect to dashboard
      jest.advanceTimersByTime(500);
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard/customer');
      });
      
      jest.useRealTimers();
      
      // 5. User requests password reset
      render(<ForgotPasswordPage />);
      
      await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
      
      const resetRequestButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(resetRequestButton);
      
      // Verify password reset request was sent
      await waitFor(() => {
        expect(authService.requestPasswordReset).toHaveBeenCalledWith('john@example.com');
      });
      
      // 6. User resets password via OTP
      render(<ResetPasswordOTPPage />);
      
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      await user.type(screen.getByLabelText('New Password'), 'NewStrongPassword456@');
      await user.type(screen.getByLabelText('Confirm Password'), 'NewStrongPassword456@');
      
      const resetOTPButton = screen.getByRole('button', { name: 'Send Verification Code' });
      await user.click(resetOTPButton);
      
      // Verify OTP was requested
      await waitFor(() => {
        expect(authService.requestOTP).toHaveBeenCalledWith('john@example.com');
      });
      
      // Fill in OTP
      const resetOtpInputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        await user.type(resetOtpInputs[i], '3');
      }
      
      // Wait for auto-submit
      jest.useFakeTimers();
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(authService.resetPasswordWithOTP).toHaveBeenCalledWith(
          'john@example.com',
          '333333',
          'NewStrongPassword456@'
        );
      });
      
      // Verify redirect to login
      jest.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
      
      jest.useRealTimers();
      
      console.log('✓ Complete user journey test passed');
    });

    it('should allow password reset via token link', async () => {
      const { authService } = require('@/services/api');
      authService.confirmPasswordReset.mockResolvedValue({ success: true });
      
      render(<ResetPasswordLinkPage />);
      
      // Fill in new password
      await user.type(screen.getByLabelText('New Password'), 'NewStrongPassword789#');
      await user.type(screen.getByLabelText('Confirm Password'), 'NewStrongPassword789#');
      
      // Submit form
      const updateButton = screen.getByRole('button', { name: 'Update Password' });
      await user.click(updateButton);
      
      // Verify password reset service was called
      await waitFor(() => {
        expect(authService.confirmPasswordReset).toHaveBeenCalledWith(
          'test-uid',
          'test-token',
          'NewStrongPassword789#'
        );
      });
      
      // Verify redirect to login
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
      jest.useRealTimers();
      
      console.log('✓ Password reset via token test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle registration errors gracefully', async () => {
      const { authService, showToast } = require('@/services/api');
      authService.requestOTP.mockRejectedValue(new Error('Email already exists'));
      
      render(<RegisterPage />);
      
      // Fill registration form
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
      
      // Submit registration
      const registerButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(registerButton);
      
      // Verify error toast is shown
      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalled();
      });
      
      console.log('✓ Registration error handling test passed');
    });

    it('should handle OTP verification errors gracefully', async () => {
      const { authService, showToast } = require('@/services/api');
      authService.requestOTP.mockResolvedValue({ success: true });
      authService.verifyOTP.mockRejectedValue(new Error('Invalid OTP'));
      
      render(<RegisterPage />);
      
      // Fill registration form
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
      
      // Submit registration
      const registerButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(registerButton);
      
      // Fill in OTP
      const otpInputs = screen.getAllByRole('textbox');
      for (let i = 0; i < 6; i++) {
        await user.type(otpInputs[i], '1');
      }
      
      // Wait for auto-submit
      jest.useFakeTimers();
      jest.advanceTimersByTime(500);
      
      // Verify error toast is shown
      await waitFor(() => {
        expect(showToast.error).toHaveBeenCalled();
      });
      
      jest.useRealTimers();
      
      console.log('✓ OTP verification error handling test passed');
    });
  });
});