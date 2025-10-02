import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import RegisterPage from './page';

// Mock the auth service
jest.mock('@/services/api', () => ({
  authService: {
    register: jest.fn(),
    requestOTP: jest.fn(),
    verifyOTP: jest.fn(),
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

describe('Register Page', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the registration form', () => {
    render(<RegisterPage />);
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('shows password strength indicator', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'weak');
    
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
    
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!');
    
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });

  it('validates password confirmation', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('generates a strong password', async () => {
    render(<RegisterPage />);
    
    const generateButton = screen.getByRole('button', { name: 'Generate' });
    await user.click(generateButton);
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    expect(passwordInput).toHaveValue((confirmPasswordInput as HTMLInputElement).value);
    expect((passwordInput as HTMLInputElement).value).toHaveLength(16);
  });

  it('requests OTP when form is submitted with valid data', async () => {
    const { authService } = require('@/services/api');
    authService.register.mockResolvedValue({ success: true });
    authService.requestOTP.mockResolvedValue({ success: true });
    
    render(<RegisterPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    await user.click(submitButton);
    
    // Check that OTP request was made
    await waitFor(() => {
      expect(authService.requestOTP).toHaveBeenCalledWith('john@example.com');
    });
  });

  it('shows OTP input fields after code is sent', async () => {
    const { authService } = require('@/services/api');
    authService.register.mockResolvedValue({ success: true });
    authService.requestOTP.mockResolvedValue({ success: true });
    
    render(<RegisterPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
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
    authService.register.mockResolvedValue({ success: true });
    authService.requestOTP.mockResolvedValue({ success: true });
    authService.verifyOTP.mockResolvedValue({ success: true });
    
    jest.useFakeTimers();
    
    render(<RegisterPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
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
    
    // Check that verify was called
    await waitFor(() => {
      expect(authService.verifyOTP).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });
});