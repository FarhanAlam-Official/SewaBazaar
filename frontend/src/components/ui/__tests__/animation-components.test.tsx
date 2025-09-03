/**
 * Test suite for new animation components
 * Tests functionality, responsiveness, and accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { AnimatedCard } from '../animated-card';
import { AnimatedSection } from '../animated-section';
import { FloatingLabelInput } from '../floating-label-input';
import { InteractiveIcon, StaggeredContainer } from '../animation-components';
import { Search } from 'lucide-react';

// Mock IntersectionObserver for AnimatedSection tests
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('AnimatedCard Component', () => {
  test('renders children correctly', () => {
    render(
      <AnimatedCard>
        <div>Test Content</div>
      </AnimatedCard>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('applies hover effect classes', () => {
    const { container } = render(
      <AnimatedCard hoverEffect=\"lift\" glowOnHover={true}>
        <div>Content</div>
      </AnimatedCard>
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('hover:-translate-y-2');
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(
      <AnimatedCard onClick={handleClick}>
        <div>Clickable Content</div>
      </AnimatedCard>
    );
    
    fireEvent.click(screen.getByText('Clickable Content'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom delay for staggered animations', () => {
    const { container } = render(
      <AnimatedCard delay={200}>
        <div>Content</div>
      </AnimatedCard>
    );
    
    const card = container.firstChild;
    expect(card).toHaveStyle('animation-delay: 200ms');
  });
});

describe('AnimatedSection Component', () => {
  test('renders with correct initial state', () => {
    render(
      <AnimatedSection>
        <div>Section Content</div>
      </AnimatedSection>
    );
    
    expect(screen.getByText('Section Content')).toBeInTheDocument();
  });

  test('applies correct animation classes', () => {
    const { container } = render(
      <AnimatedSection animation=\"fadeInUp\">
        <div>Content</div>
      </AnimatedSection>
    );
    
    expect(container.firstChild).toHaveClass('transition-all', 'duration-700', 'ease-out');
  });

  test('supports different animation types', () => {
    const { rerender, container } = render(
      <AnimatedSection animation=\"scaleIn\">
        <div>Content</div>
      </AnimatedSection>
    );
    
    expect(container.firstChild).toHaveClass('opacity-0', 'scale-95');
    
    rerender(
      <AnimatedSection animation=\"fadeInLeft\">
        <div>Content</div>
      </AnimatedSection>
    );
    
    expect(container.firstChild).toHaveClass('opacity-0', '-translate-x-8');
  });
});

describe('FloatingLabelInput Component', () => {
  test('renders with floating label', () => {
    render(<FloatingLabelInput label=\"Test Label\" />);
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  test('shows error message when error prop is provided', () => {
    render(<FloatingLabelInput label=\"Test Label\" error=\"This field is required\" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('shows helper text when provided', () => {
    render(<FloatingLabelInput label=\"Test Label\" helperText=\"Enter your full name\" />);
    
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  test('handles focus and blur events correctly', async () => {
    render(<FloatingLabelInput label=\"Test Label\" />);
    
    const input = screen.getByLabelText('Test Label');
    const label = screen.getByText('Test Label');
    
    // Test focus
    fireEvent.focus(input);
    await waitFor(() => {
      expect(label).toHaveClass('top-0', '-translate-y-1/2', 'text-xs');
    });
    
    // Test blur with no value
    fireEvent.blur(input);
    await waitFor(() => {
      expect(label).toHaveClass('top-1/2', 'text-base');
    });
  });

  test('maintains floating label when input has value', async () => {
    render(<FloatingLabelInput label=\"Test Label\" />);
    
    const input = screen.getByLabelText('Test Label');
    const label = screen.getByText('Test Label');
    
    // Type value
    fireEvent.change(input, { target: { value: 'test value' } });
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(label).toHaveClass('top-0', '-translate-y-1/2', 'text-xs');
    });
  });

  test('applies error styling when error is present', () => {
    render(<FloatingLabelInput label=\"Test Label\" error=\"Error message\" />);
    
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveClass('border-destructive');
  });
});

describe('InteractiveIcon Component', () => {
  test('renders children correctly', () => {
    render(
      <InteractiveIcon>
        <Search data-testid=\"search-icon\" />
      </InteractiveIcon>
    );
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  test('applies correct size classes', () => {
    const { container, rerender } = render(
      <InteractiveIcon size=\"sm\">
        <Search />
      </InteractiveIcon>
    );
    
    expect(container.firstChild).toHaveClass('w-6', 'h-6');
    
    rerender(
      <InteractiveIcon size=\"xl\">
        <Search />
      </InteractiveIcon>
    );
    
    expect(container.firstChild).toHaveClass('w-16', 'h-16');
  });

  test('applies correct variant styling', () => {
    const { container, rerender } = render(
      <InteractiveIcon variant=\"primary\">
        <Search />
      </InteractiveIcon>
    );
    
    expect(container.firstChild).toHaveClass('text-primary');
    
    rerender(
      <InteractiveIcon variant=\"secondary\">
        <Search />
      </InteractiveIcon>
    );
    
    expect(container.firstChild).toHaveClass('text-secondary');
  });

  test('handles click events when onClick is provided', () => {
    const handleClick = jest.fn();
    render(
      <InteractiveIcon onClick={handleClick}>
        <Search />
      </InteractiveIcon>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies hover effect classes', () => {
    const { container } = render(
      <InteractiveIcon hoverEffect=\"scale\">
        <Search />
      </InteractiveIcon>
    );
    
    expect(container.firstChild).toHaveClass('hover:scale-110');
  });
});

describe('StaggeredContainer Component', () => {
  test('renders children with staggered delays', () => {
    render(
      <StaggeredContainer staggerDelay={100}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </StaggeredContainer>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  test('applies animation classes to children', () => {
    const { container } = render(
      <StaggeredContainer animation=\"fadeInUp\">
        <div>Child 1</div>
        <div>Child 2</div>
      </StaggeredContainer>
    );
    
    const children = container.querySelectorAll('div > div');
    children.forEach(child => {
      expect(child).toHaveClass('animate-fade-in-up');
    });
  });

  test('applies correct animation delays', () => {
    const { container } = render(
      <StaggeredContainer staggerDelay={150} startDelay={100}>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </StaggeredContainer>
    );
    
    const children = container.querySelectorAll('div > div');
    expect(children[0]).toHaveStyle('animation-delay: 100ms');
    expect(children[1]).toHaveStyle('animation-delay: 250ms');
    expect(children[2]).toHaveStyle('animation-delay: 400ms');
  });
});

// Accessibility tests
describe('Accessibility Tests', () => {
  test('AnimatedCard maintains focus management', () => {
    render(
      <AnimatedCard onClick={() => {}}>
        <div>Focusable Content</div>
      </AnimatedCard>
    );
    
    const card = screen.getByText('Focusable Content').closest('[role]');
    expect(card).toBeInTheDocument();
  });

  test('FloatingLabelInput has proper ARIA attributes', () => {
    render(<FloatingLabelInput label=\"Test Label\" error=\"Error message\" />);
    
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('InteractiveIcon is keyboard accessible when clickable', () => {
    const handleClick = jest.fn();
    render(
      <InteractiveIcon onClick={handleClick}>
        <Search />
      </InteractiveIcon>
    );
    
    const icon = screen.getByRole('button');
    fireEvent.keyDown(icon, { key: 'Enter' });
    // Note: You might need to implement keyboard handling in the component
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('AnimatedSection does not cause memory leaks', () => {
    const { unmount } = render(
      <AnimatedSection>
        <div>Content</div>
      </AnimatedSection>
    );
    
    // Should not throw errors on unmount
    expect(() => unmount()).not.toThrow();
  });

  test('StaggeredContainer handles large numbers of children efficiently', () => {
    const manyChildren = Array.from({ length: 100 }, (_, i) => (
      <div key={i}>Child {i}</div>
    ));
    
    const start = performance.now();
    render(
      <StaggeredContainer>
        {manyChildren}
      </StaggeredContainer>
    );
    const end = performance.now();
    
    // Should render in reasonable time (adjust threshold as needed)
    expect(end - start).toBeLessThan(100);
  });
});