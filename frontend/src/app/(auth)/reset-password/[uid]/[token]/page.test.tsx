import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import ResetPasswordLinkPage from './page';

// Mock the auth service
jest.mock('@/services/api', () => ({
  authService: {
    confirmPasswordReset: jest.fn(),
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
  useParams: () => ({
    uid: 'test-uid',
    token: 'test-token',
  }),
}));

describe('Reset Password Link Page', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the reset password form', () => {
    render(<ResetPasswordLinkPage />);
    
    expect(screen.getByText('Set a new password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
  });

  it('shows password strength indicator', async () => {
    render(<ResetPasswordLinkPage />);
    
    const passwordInput = screen.getByLabelText('New Password');
    await user.type(passwordInput, 'weak');
    
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
    
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!');
    
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });

  it('validates password confirmation', async () => {
    render(<ResetPasswordLinkPage />);
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('generates a strong password', async () => {
    render(<ResetPasswordLinkPage />);
    
    const generateButton = screen.getByRole('button', { name: 'Generate' });
    await user.click(generateButton);
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    expect(passwordInput).toHaveValue((confirmPasswordInput as HTMLInputElement).value);
    expect((passwordInput as HTMLInputElement).value).toHaveLength(16);
  });

  it('submits the form with valid data', async () => {
    const { authService } = require('@/services/api');
    authService.confirmPasswordReset.mockResolvedValue({ success: true });
    
    render(<ResetPasswordLinkPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('New Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Update Password' });
    await user.click(submitButton);
    
    // Check that reset password was called
    await waitFor(() => {
      expect(authService.confirmPasswordReset).toHaveBeenCalledWith(
        'test-uid',
        'test-token',
        'StrongPassword123!'
      );
    });
  });

  it('shows error message when reset fails', async () => {
    const { authService } = require('@/services/api');
    authService.confirmPasswordReset.mockRejectedValue(new Error('Invalid token'));
    
    render(<ResetPasswordLinkPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('New Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Update Password' });
    await user.click(submitButton);
    
    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });

  it('redirects to login page after successful password reset', async () => {
    const { authService } = require('@/services/api');
    authService.confirmPasswordReset.mockResolvedValue({ success: true });
    
    jest.useFakeTimers();
    
    render(<ResetPasswordLinkPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('New Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Update Password' });
    await user.click(submitButton);
    
    // Check that reset password was called
    await waitFor(() => {
      expect(authService.confirmPasswordReset).toHaveBeenCalled();
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