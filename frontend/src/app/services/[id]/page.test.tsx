import { render, screen } from '@testing-library/react'
import ServiceDetailPage from './page'

// Mock the Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
  }),
}))

// Mock the API services
jest.mock('@/services/api', () => ({
  servicesApi: {
    getServiceById: jest.fn(),
  },
  reviewsApi: {
    getProviderReviews: jest.fn(),
  },
}))

describe('ServiceDetailPage', () => {
  it('renders loading state', async () => {
    const mockParams = Promise.resolve({ id: '1' })
    
    render(<ServiceDetailPage params={mockParams} />)
    
    expect(screen.getByText('Loading service details...')).toBeInTheDocument()
  })

  it('handles service not found', async () => {
    const mockParams = Promise.resolve({ id: 'nonexistent' })
    
    render(<ServiceDetailPage params={mockParams} />)
    
    // Wait for error state
    await screen.findByText('Service Not Found')
  })
})