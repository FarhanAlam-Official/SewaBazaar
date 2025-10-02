import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import LoginOTPPage from './page';

// Mock the auth service
jest.mock('@/services/api', () => ({
  authService: {
    requestOTP: jest.fn(),
    loginWithOTP: jest.fn(),
  },
}));

// Mock the toast component
jest.mock('@/components/ui/enhanced-toast', () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('Login OTP Page', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login OTP form', () => {
    render(<LoginOTPPage />);
    
    expect(screen.getByText('Sign in with code')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Verification Code' })).toBeInTheDocument();
  });

  it('requests OTP when form is submitted with email', async () => {
    const { authService } = require('@/services/api');
    authService.requestOTP.mockResolvedValue({ success: true });
    
    render(<LoginOTPPage />);
    
    // Fill in the email
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Send Verification Code' });
    await user.click(submitButton);
    
    // Check that OTP request was made
    await waitFor(() => {
      expect(authService.requestOTP).toHaveBeenCalledWith('john@example.com');
    });
  });

  it('shows OTP input fields after code is sent', async () => {
    const { authService } = require('@/services/api');
    authService.requestOTP.mockResolvedValue({ success: true });
    
    render(<LoginOTPPage />);
    
    // Fill in the email
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Send Verification Code' });
    await user.click(submitButton);
    
    // Wait for OTP fields to appear
    await waitFor(() => {
      expect(screen.getByText('Enter the 6-digit code we sent to john@example.com')).toBeInTheDocument();
    });
    
    // Check that OTP inputs are visible
    const otpInputs = screen.getAllByRole('textbox');
    expect(otpInputs).toHaveLength(6);
  });

  it('submits OTP automatically when all digits are entered', async () => {
    const { authService } = require('@/services/api');
    authService.requestOTP.mockResolvedValue({ success: true });
    authService.loginWithOTP.mockResolvedValue({ success: true });
    
    jest.useFakeTimers();
    
    render(<LoginOTPPage />);
    
    // Fill in the email
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Send Verification Code' });
    await user.click(submitButton);
    
    // Wait for OTP fields to appear
    await waitFor(() => {
      expect(screen.getByText('Enter the 6-digit code we sent to john@example.com')).toBeInTheDocument();
    });
    
    // Fill in OTP
    const otpInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(otpInputs[i], '1');
    }
    
    // Fast-forward the timer
    jest.advanceTimersByTime(500);
    
    // Check that login was called
    await waitFor(() => {
      expect(authService.loginWithOTP).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });

  it('redirects to dashboard after successful login', async () => {
    const { authService } = require('@/services/api');
    authService.requestOTP.mockResolvedValue({ success: true });
    authService.loginWithOTP.mockResolvedValue({ success: true });
    
    jest.useFakeTimers();
    
    render(<LoginOTPPage />);
    
    // Fill in the email
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Send Verification Code' });
    await user.click(submitButton);
    
    // Wait for OTP fields to appear
    await waitFor(() => {
      expect(screen.getByText('Enter the 6-digit code we sent to john@example.com')).toBeInTheDocument();
    });
    
    // Fill in OTP
    const otpInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(otpInputs[i], '1');
    }
    
    // Fast-forward the timer
    jest.advanceTimersByTime(500);
    
    // Check that login was called
    await waitFor(() => {
      expect(authService.loginWithOTP).toHaveBeenCalled();
    });
    
    // Fast-forward the redirect timer
    jest.advanceTimersByTime(2000);
    
    // Check that router.push was called
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    
    jest.useRealTimers();
  });
});