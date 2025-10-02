import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

// Mock cookies
jest.mock('js-cookie', () => ({
  default: {
    get: jest.fn(),
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
const mockReplace = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('Login Page', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (require('@/contexts/AuthContext').useAuth as jest.Mock).mockReturnValue({
      login: jest.fn(),
    });
    (require('js-cookie').default.get as jest.Mock).mockReturnValue('customer');
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Remember me')).toBeInTheDocument();
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
  });

  it('shows password visibility toggle', async () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button');
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits the form with valid credentials', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    const loginMock = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({ login: loginMock });
    
    render(<LoginPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email address'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
    await user.click(screen.getByText('Remember me'));
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);
    
    // Check that login was called
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('john@example.com', 'StrongPassword123!', true);
    });
  });

  it('shows error messages for invalid credentials', async () => {
    const { useAuth, showToast } = require('@/contexts/AuthContext');
    const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    useAuth.mockReturnValue({ login: loginMock });
    
    render(<LoginPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email address'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);
    
    // Check that error toast is shown
    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalled();
    });
    
    // Check that error styling is applied
    expect(screen.getByLabelText('Email address')).toHaveClass('border-red-500');
    expect(screen.getByLabelText('Password')).toHaveClass('border-red-500');
  });

  it('redirects to user dashboard after successful login', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    const loginMock = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({ login: loginMock });
    (require('js-cookie').default.get as jest.Mock).mockReturnValue('customer');
    
    jest.useFakeTimers();
    
    render(<LoginPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email address'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);
    
    // Fast-forward the timer
    jest.advanceTimersByTime(1500);
    
    // Check that router.replace was called with correct path
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/customer');
    });
    
    jest.useRealTimers();
  });

  it('redirects to admin dashboard for admin users', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    const loginMock = jest.fn().mockResolvedValue({ success: true });
    useAuth.mockReturnValue({ login: loginMock });
    (require('js-cookie').default.get as jest.Mock).mockReturnValue('admin');
    
    jest.useFakeTimers();
    
    render(<LoginPage />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('Email address'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'AdminPassword123!');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(submitButton);
    
    // Fast-forward the timer
    jest.advanceTimersByTime(1500);
    
    // Check that router.replace was called with correct path
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/admin');
    });
    
    jest.useRealTimers();
  });
});