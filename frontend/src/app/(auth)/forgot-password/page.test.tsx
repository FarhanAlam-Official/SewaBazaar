import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from './page';

// Mock the auth service
jest.mock('@/services/api', () => ({
  authService: {
    requestPasswordReset: jest.fn(),
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

describe('Forgot Password Page', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the forgot password form', () => {
    render(<ForgotPasswordPage />);
    
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<ForgotPasswordPage />);
    
    // Try to submit with invalid email
    await user.type(screen.getByLabelText('Email Address'), 'invalid-email');
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(submitButton);
    
    // Check that error message is displayed
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('submits the form with valid email', async () => {
    const { authService } = require('@/services/api');
    authService.requestPasswordReset.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    // Fill in the form with valid email
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(submitButton);
    
    // Check that the service was called
    await waitFor(() => {
      expect(authService.requestPasswordReset).toHaveBeenCalledWith('john@example.com');
    });
  });

  it('shows success state after submission', async () => {
    const { authService, showToast } = require('@/services/api');
    authService.requestPasswordReset.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(submitButton);
    
    // Check that success state is displayed
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
    
    // Check that success toast is shown
    expect(showToast.success).toHaveBeenCalled();
  });

  it('shows important information in success state', async () => {
    const { authService } = require('@/services/api');
    authService.requestPasswordReset.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(submitButton);
    
    // Check that important information is displayed
    await waitFor(() => {
      expect(screen.getByText('Important Information')).toBeInTheDocument();
      expect(screen.getByText('• Check your spam/junk folder if you don\'t see the email')).toBeInTheDocument();
      expect(screen.getByText('• The reset link expires in 24 hours')).toBeInTheDocument();
      expect(screen.getByText('• You can only use the link once')).toBeInTheDocument();
      expect(screen.getByText('• Contact support if you need help')).toBeInTheDocument();
    });
  });

  it('allows retrying after successful submission', async () => {
    const { authService } = require('@/services/api');
    authService.requestPasswordReset.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(submitButton);
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });
    
    // Click retry button
    const retryButton = screen.getByRole('button', { name: 'Send Another Email' });
    await user.click(retryButton);
    
    // Check that form is displayed again
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('shows cooldown timer for resend button', async () => {
    const { authService } = require('@/services/api');
    authService.requestPasswordReset.mockResolvedValue({ success: true });
    
    jest.useFakeTimers();
    
    render(<ForgotPasswordPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(submitButton);
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });
    
    // Check that cooldown timer is displayed
    const resendButton = screen.getByRole('button', { name: 'Send Another Email' });
    expect(resendButton).toBeDisabled();
    expect(resendButton).toHaveTextContent('Resend in 60s');
    
    // Fast-forward timer
    jest.advanceTimersByTime(30000); // 30 seconds
    
    // Check that timer updates
    expect(resendButton).toHaveTextContent('Resend in 30s');
    
    // Fast-forward remaining time
    jest.advanceTimersByTime(30000); // 30 more seconds
    
    // Check that button is enabled
    expect(resendButton).not.toBeDisabled();
    expect(resendButton).toHaveTextContent('Send Another Email');
    
    jest.useRealTimers();
  });

  it('allows navigation back to login', async () => {
    render(<ForgotPasswordPage />);
    
    // Click back to login button
    const backButton = screen.getByRole('button', { name: 'Back to Login' });
    await user.click(backButton);
    
    // Check that router.push was called
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('shows alternative options', async () => {
    const { authService } = require('@/services/api');
    authService.requestPasswordReset.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await user.click(submitButton);
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });
    
    // Check that alternative options are displayed
    expect(screen.getByText('Try OTP Login')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });
});