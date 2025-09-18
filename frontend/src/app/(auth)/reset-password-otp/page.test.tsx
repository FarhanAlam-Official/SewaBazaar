import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import ResetPasswordOTPPage from './page';

// Mock the auth service
jest.mock('@/services/api', () => ({
  authService: {
    requestOTP: jest.fn(),
    resetPasswordWithOTP: jest.fn(),
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

describe('Reset Password OTP Page', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the reset password OTP form', () => {
    render(<ResetPasswordOTPPage />);
    
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Verification Code' })).toBeInTheDocument();
  });

  it('shows password strength indicator', async () => {
    render(<ResetPasswordOTPPage />);
    
    const passwordInput = screen.getByLabelText('New Password');
    await user.type(passwordInput, 'weak');
    
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
    
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!');
    
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });

  it('validates password confirmation', async () => {
    render(<ResetPasswordOTPPage />);
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('generates a strong password', async () => {
    render(<ResetPasswordOTPPage />);
    
    const generateButton = screen.getByRole('button', { name: 'Generate' });
    await user.click(generateButton);
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    expect(passwordInput).toHaveValue((confirmPasswordInput as HTMLInputElement).value);
    expect((passwordInput as HTMLInputElement).value).toHaveLength(16);
  });

  it('requests OTP when form is submitted with valid data', async () => {
    const { authService } = require('@/services/api');
    authService.requestOTP.mockResolvedValue({ success: true });
    
    render(<ResetPasswordOTPPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('New Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
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
    
    render(<ResetPasswordOTPPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('New Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Send Verification Code' });
    await user.click(submitButton);
    
    // Wait for OTP fields to appear
    await waitFor(() => {
      expect(screen.getByText('Enter the 6-digit code we sent to john@example.com')).toBeInTheDocument();
    });
    
    // Check that email, password fields are hidden and OTP inputs are visible
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();
    
    const otpInputs = screen.getAllByRole('textbox');
    expect(otpInputs).toHaveLength(6);
  });

  it('submits OTP automatically when all digits are entered', async () => {
    const { authService } = require('@/services/api');
    authService.requestOTP.mockResolvedValue({ success: true });
    authService.resetPasswordWithOTP.mockResolvedValue({ success: true });
    
    jest.useFakeTimers();
    
    render(<ResetPasswordOTPPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('New Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
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
    
    // Check that reset password was called
    await waitFor(() => {
      expect(authService.resetPasswordWithOTP).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });

  it('redirects to login page after successful password reset', async () => {
    const { authService } = require('@/services/api');
    authService.requestOTP.mockResolvedValue({ success: true });
    authService.resetPasswordWithOTP.mockResolvedValue({ success: true });
    
    jest.useFakeTimers();
    
    render(<ResetPasswordOTPPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('New Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
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
    
    // Check that reset password was called
    await waitFor(() => {
      expect(authService.resetPasswordWithOTP).toHaveBeenCalled();
    });
    
    // Fast-forward the redirect timer
    jest.advanceTimersByTime(2000);
    
    // Check that router.push was called
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    
    jest.useRealTimers();
  });
});