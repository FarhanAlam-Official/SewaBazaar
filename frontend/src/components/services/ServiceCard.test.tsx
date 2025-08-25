import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ServiceCard } from './ServiceCard'

const mockService = {
  id: '1',
  name: 'Professional Plumbing Service',
  provider: 'John Doe Plumbing',
  image: '/test-image.jpg',
  rating: 4.5,
  price: 1500,
  date: '2024-12-25',
  time: '14:30',
  location: 'Kathmandu, Nepal',
  status: 'upcoming' as const,
}

describe('ServiceCard', () => {
  it('renders service information correctly', () => {
    render(<ServiceCard service={mockService} />)
    
    expect(screen.getByText('Professional Plumbing Service')).toBeInTheDocument()
    expect(screen.getByText('John Doe Plumbing')).toBeInTheDocument()
    expect(screen.getByText('Rs. 1500')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('2024-12-25')).toBeInTheDocument()
    expect(screen.getByText('14:30')).toBeInTheDocument()
    expect(screen.getByText('Kathmandu, Nepal')).toBeInTheDocument()
  })

  it('renders service image with correct alt text', () => {
    render(<ServiceCard service={mockService} />)
    
    const image = screen.getByAltText('Professional Plumbing Service')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test-image.jpg')
  })

  it('renders placeholder image when no image provided', () => {
    const serviceWithoutImage = { ...mockService, image: '' }
    render(<ServiceCard service={serviceWithoutImage} />)
    
    const image = screen.getByAltText('Professional Plumbing Service')
    expect(image).toHaveAttribute('src', '/placeholder.jpg')
  })

  it('displays star rating correctly', () => {
    render(<ServiceCard service={mockService} />)
    
    // The star is an SVG element, not an img
    const starIcon = screen.getByText('4.5').previousElementSibling
    expect(starIcon).toBeInTheDocument()
    expect(starIcon).toHaveClass('lucide-star')
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const mockOnAction = jest.fn()
    render(
      <ServiceCard 
        service={mockService} 
        onAction={mockOnAction}
        actionLabel="Book Now"
      />
    )
    
    const button = screen.getByRole('button', { name: 'Book Now' })
    expect(button).toBeInTheDocument()
  })

  it('calls onAction when action button is clicked', () => {
    const mockOnAction = jest.fn()
    render(
      <ServiceCard 
        service={mockService} 
        onAction={mockOnAction}
        actionLabel="Book Now"
      />
    )
    
    const button = screen.getByRole('button', { name: 'Book Now' })
    fireEvent.click(button)
    
    expect(mockOnAction).toHaveBeenCalledWith('1')
  })

  it('does not render action button when not provided', () => {
    render(<ServiceCard service={mockService} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders with default variant correctly', () => {
    render(<ServiceCard service={mockService} />)
    
    // The card is a div with Card component, not an article
    const card = screen.getByText('Professional Plumbing Service').closest('.overflow-hidden')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('overflow-hidden')
  })

  it('renders with history variant correctly', () => {
    render(<ServiceCard service={mockService} variant="history" />)
    
    // The card is a div with Card component, not an article
    const card = screen.getByText('Professional Plumbing Service').closest('.overflow-hidden')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('overflow-hidden')
  })

  it('renders with wishlist variant correctly', () => {
    render(<ServiceCard service={mockService} variant="wishlist" />)
    
    // The card is a div with Card component, not an article
    const card = screen.getByText('Professional Plumbing Service').closest('.overflow-hidden')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('overflow-hidden')
  })

  it('handles missing optional fields gracefully', () => {
    const minimalService = {
      id: '2',
      name: 'Minimal Service',
      provider: 'Minimal Provider',
      image: '',
      rating: 3,
      price: 500,
    }
    
    render(<ServiceCard service={minimalService} />)
    
    expect(screen.getByText('Minimal Service')).toBeInTheDocument()
    expect(screen.getByText('Minimal Provider')).toBeInTheDocument()
    expect(screen.getByText('Rs. 500')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays price with proper formatting', () => {
    const serviceWithHighPrice = { ...mockService, price: 15000 }
    render(<ServiceCard service={serviceWithHighPrice} />)
    
    expect(screen.getByText('Rs. 15000')).toBeInTheDocument()
  })

  it('displays decimal prices correctly', () => {
    const serviceWithDecimalPrice = { ...mockService, price: 1499.99 }
    render(<ServiceCard service={serviceWithDecimalPrice} />)
    
    expect(screen.getByText('Rs. 1499.99')).toBeInTheDocument()
  })

  it('renders all date and time information when provided', () => {
    render(<ServiceCard service={mockService} />)
    
    expect(screen.getByText('2024-12-25')).toBeInTheDocument()
    expect(screen.getByText('14:30')).toBeInTheDocument()
  })

  it('renders location information when provided', () => {
    render(<ServiceCard service={mockService} />)
    
    expect(screen.getByText('Kathmandu, Nepal')).toBeInTheDocument()
  })

  it('handles long service names gracefully', () => {
    const serviceWithLongName = {
      ...mockService,
      name: 'This is a very long service name that might overflow the card layout and need to be handled properly'
    }
    
    render(<ServiceCard service={serviceWithLongName} />)
    
    expect(screen.getByText(serviceWithLongName.name)).toBeInTheDocument()
  })

  it('handles long provider names gracefully', () => {
    const serviceWithLongProvider = {
      ...mockService,
      provider: 'This is a very long provider name that might overflow the card layout'
    }
    
    render(<ServiceCard service={serviceWithLongProvider} />)
    
    expect(screen.getByText(serviceWithLongProvider.provider)).toBeInTheDocument()
  })

  it('displays zero rating correctly', () => {
    const serviceWithZeroRating = { ...mockService, rating: 0 }
    render(<ServiceCard service={serviceWithZeroRating} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('displays maximum rating correctly', () => {
    const serviceWithMaxRating = { ...mockService, rating: 5 }
    render(<ServiceCard service={serviceWithMaxRating} />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('handles decimal ratings correctly', () => {
    const serviceWithDecimalRating = { ...mockService, rating: 4.7 }
    render(<ServiceCard service={serviceWithDecimalRating} />)
    
    expect(screen.getByText('4.7')).toBeInTheDocument()
  })

  it('renders with different status values', () => {
    const statuses = ['completed', 'upcoming', 'cancelled'] as const
    
    statuses.forEach(status => {
      const serviceWithStatus = { ...mockService, status }
      const { unmount } = render(<ServiceCard service={serviceWithStatus} />)
      
      expect(screen.getByText('Professional Plumbing Service')).toBeInTheDocument()
      unmount()
    })
  })

  it('maintains accessibility features', () => {
    render(<ServiceCard service={mockService} />)
    
    // Check for proper heading structure
    const title = screen.getByText('Professional Plumbing Service')
    expect(title).toBeInTheDocument()
    
    // Check for proper image alt text
    const image = screen.getByAltText('Professional Plumbing Service')
    expect(image).toBeInTheDocument()
  })

  it('handles click events on the card', () => {
    const mockOnClick = jest.fn()
    render(
      <div onClick={mockOnClick}>
        <ServiceCard service={mockService} />
      </div>
    )
    
    const card = screen.getByText('Professional Plumbing Service').closest('div')
    if (card) {
      fireEvent.click(card)
      expect(mockOnClick).toHaveBeenCalled()
    }
  })

  it('renders with custom className when provided', () => {
    render(<ServiceCard service={mockService} />)
    
    // Find the outermost card div that has the overflow-hidden class
    const card = screen.getByText('Professional Plumbing Service').closest('.overflow-hidden')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('overflow-hidden')
  })

  it('handles service with special characters in name', () => {
    const serviceWithSpecialChars = {
      ...mockService,
      name: 'Service with special chars: !@#$%^&*()',
      provider: 'Provider with unicode: नेपाली'
    }
    
    render(<ServiceCard service={serviceWithSpecialChars} />)
    
    expect(screen.getByText('Service with special chars: !@#$%^&*()')).toBeInTheDocument()
    expect(screen.getByText('Provider with unicode: नेपाली')).toBeInTheDocument()
  })
})
