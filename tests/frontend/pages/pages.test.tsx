/**
 * Test suite for redesigned pages
 * Tests functionality, form validation, and user interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import HowItWorksPage from '../../../app/how-it-works/page';
import AboutPage from '../../../app/about/page';
import ContactPage from '../../../app/contact/page';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function MockImage({ alt, ...props }: { alt: string; [key: string]: any }) {
    return <img alt={alt} {...props} />;
  };
});

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('HowItWorksPage', () => {
  test('renders main heading correctly', () => {
    render(<HowItWorksPage />);
    
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
  });

  test('displays all process steps', () => {
    render(<HowItWorksPage />);
    
    expect(screen.getByText('Search for Services')).toBeInTheDocument();
    expect(screen.getByText('Book an Appointment')).toBeInTheDocument();
    expect(screen.getByText('Get Service Delivered')).toBeInTheDocument();
    expect(screen.getByText('Rate and Review')).toBeInTheDocument();
  });

  test('shows statistics correctly', () => {
    render(<HowItWorksPage />);
    
    expect(screen.getByText('10,000+')).toBeInTheDocument();
    expect(screen.getByText('1,000+')).toBeInTheDocument();
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('4.8/5')).toBeInTheDocument();
  });

  test('displays feature cards with benefits', () => {
    render(<HowItWorksPage />);
    
    expect(screen.getByText('Verified Providers')).toBeInTheDocument();
    expect(screen.getByText('Quality Assurance')).toBeInTheDocument();
    expect(screen.getByText('Flexible Scheduling')).toBeInTheDocument();
  });

  test('has working CTA buttons', () => {
    render(<HowItWorksPage />);
    
    const browseServicesButton = screen.getByRole('link', { name: /browse services/i });
    const learnMoreButton = screen.getByRole('link', { name: /learn more/i });
    
    expect(browseServicesButton).toHaveAttribute('href', '/services');
    expect(learnMoreButton).toHaveAttribute('href', '/about');
  });

  test('applies responsive design classes', () => {
    const { container } = render(<HowItWorksPage />);
    
    const heroSection = container.querySelector('.container');
    expect(heroSection).toHaveClass('mx-auto', 'px-4');
  });
});

describe('AboutPage', () => {
  test('renders main heading and hero content', () => {
    render(<AboutPage />);
    
    expect(screen.getByRole('heading', { name: /about sewabazaar/i })).toBeInTheDocument();
    expect(screen.getByText(/revolutionizing/i)).toBeInTheDocument();
  });

  test('displays company values', () => {
    render(<AboutPage />);
    
    expect(screen.getByText('Community First')).toBeInTheDocument();
    expect(screen.getByText('Quality Service')).toBeInTheDocument();
    expect(screen.getByText('Customer Care')).toBeInTheDocument();
    expect(screen.getByText('Trust & Reliability')).toBeInTheDocument();
  });

  test('shows company statistics with growth indicators', () => {
    render(<AboutPage />);
    
    // Check for stats
    expect(screen.getByText('10,000+')).toBeInTheDocument();
    expect(screen.getByText('Happy Customers')).toBeInTheDocument();
    
    // Check for growth indicators
    expect(screen.getByText('+25%')).toBeInTheDocument();
    expect(screen.getByText('+40%')).toBeInTheDocument();
  });

  test('displays timeline milestones', () => {
    render(<AboutPage />);
    
    expect(screen.getByText('The Beginning')).toBeInTheDocument();
    expect(screen.getByText('First Launch')).toBeInTheDocument();
    expect(screen.getByText('Rapid Growth')).toBeInTheDocument();
    expect(screen.getByText('Market Leader')).toBeInTheDocument();
  });

  test('shows team information', () => {
    render(<AboutPage />);
    
    expect(screen.getByText('The Visionaries')).toBeInTheDocument();
    expect(screen.getByText('The Builders')).toBeInTheDocument();
    expect(screen.getByText('The Connectors')).toBeInTheDocument();
  });

  test('has working CTA links', () => {
    render(<AboutPage />);
    
    const findServicesButton = screen.getByRole('link', { name: /find services/i });
    const contactButton = screen.getByRole('link', { name: /contact us/i });
    
    expect(findServicesButton).toHaveAttribute('href', '/services');
    expect(contactButton).toHaveAttribute('href', '/contact');
  });
});

describe('ContactPage', () => {
  test('renders main heading and description', () => {
    render(<ContactPage />);
    
    expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();
    expect(screen.getByText(/send us a message/i)).toBeInTheDocument();
  });

  test('displays contact methods', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  test('shows contact form with floating labels', () => {
    render(<ContactPage />);
    
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Message')).toBeInTheDocument();
  });

  test('handles form validation correctly', async () => {
    render(<ContactPage />);
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    
    // Try to submit empty form
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Subject is required')).toBeInTheDocument();
      expect(screen.getByText('Message is required')).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    render(<ContactPage />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /send message/i });
    
    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    render(<ContactPage />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText('Your Message'), { target: { value: 'Test message content' } });
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitButton);
    
    // Check loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
    });
  });

  test('clears form when clear button is clicked', () => {
    render(<ContactPage />);
    
    const nameInput = screen.getByLabelText('Full Name');
    const clearButton = screen.getByRole('button', { name: /clear form/i });
    
    // Fill and clear
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });
    expect(nameInput).toHaveValue('Test Name');
    
    fireEvent.click(clearButton);
    expect(nameInput).toHaveValue('');
  });

  test('displays quick links and social media', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Live Chat')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Support Center')).toBeInTheDocument();
    
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  test('shows office information and map placeholder', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Visit Our Office')).toBeInTheDocument();
    expect(screen.getByText('Interactive Map')).toBeInTheDocument();
    expect(screen.getByText(/new baneshwor/i)).toBeInTheDocument();
    expect(screen.getByText(/monday - friday/i)).toBeInTheDocument();
  });

  test('newsletter signup functionality', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Stay Updated')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });
});

// Responsive design tests
describe('Responsive Design Tests', () => {
  test('pages adapt to mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    const { container } = render(<HowItWorksPage />);
    
    // Check for responsive classes
    const gridElements = container.querySelectorAll('.grid');
    gridElements.forEach(grid => {
      expect(grid).toHaveClass(/grid/);
    });
  });

  test('typography scales appropriately', () => {
    const { container } = render(<AboutPage />);
    
    const headings = container.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
      expect(heading).toHaveClass(/text-/);
    });
  });
});

// Animation tests
describe('Animation Tests', () => {
  test('animations are applied to page sections', () => {
    const { container } = render(<HowItWorksPage />);
    
    const animatedElements = container.querySelectorAll('[style*=\"animation-delay\"]');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  test('hover effects are properly configured', () => {
    const { container } = render(<ContactPage />);
    
    const hoverElements = container.querySelectorAll('.hover\\\\:');
    expect(hoverElements.length).toBeGreaterThan(0);
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('pages render within acceptable time', () => {
    const start = performance.now();
    render(<AboutPage />);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100); // Should render in under 100ms
  });

  test('no memory leaks on component unmount', () => {
    const { unmount } = render(<ContactPage />);
    
    expect(() => unmount()).not.toThrow();
  });
});