import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    logout: jest.fn(),
  }),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Menu: () => <div>Menu</div>,
  LogOut: () => <div>LogOut</div>,
  Bell: () => <div>Bell</div>,
}))

// Mock theme toggle
jest.mock('@/components/theme/theme-toggle', () => ({
  ThemeToggle: () => <div>ThemeToggle</div>,
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock api
jest.mock('@/services/api', () => ({
  default: {
    get: jest.fn(),
  },
}))

describe('Navbar Navigation', () => {
  const mockPush = jest.fn()
  const mockUsePathname = jest.fn()

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      prefetch: jest.fn(),
    })
    mockUsePathname.mockReturnValue('/')
    require('next/navigation').usePathname = mockUsePathname
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders all navigation links', () => {
    render(<Navbar />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    expect(screen.getByText('About Us')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders links with correct href attributes', () => {
    render(<Navbar />)
    
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Services').closest('a')).toHaveAttribute('href', '/services')
    expect(screen.getByText('How It Works').closest('a')).toHaveAttribute('href', '/how-it-works')
    expect(screen.getByText('About Us').closest('a')).toHaveAttribute('href', '/about')
    expect(screen.getByText('Contact').closest('a')).toHaveAttribute('href', '/contact')
  })
})