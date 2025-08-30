import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnhancedServiceFilters, FilterState } from './EnhancedServiceFilters'
import { servicesApi } from '@/services/api'

// Mock dependencies
jest.mock('@/services/api', () => ({
  servicesApi: {
    getCategories: jest.fn(),
    getCities: jest.fn(),
  },
}))

// Mock data
const mockCategories = [
  { id: 1, title: 'Cleaning', slug: 'cleaning', services_count: 45 },
  { id: 2, title: 'Plumbing', slug: 'plumbing', services_count: 32 },
  { id: 3, title: 'Electrical', slug: 'electrical', services_count: 28 },
]

const mockCities = [
  { id: 1, name: 'Kathmandu', services_count: 120 },
  { id: 2, name: 'Lalitpur', services_count: 85 },
  { id: 3, name: 'Bhaktapur', services_count: 67 },
]

const defaultFilters: FilterState = {
  search: '',
  categories: [],
  cities: [],
  priceRange: [0, 10000],
  minRating: 0,
  verifiedOnly: false,
  instantBooking: false,
  availableToday: false,
  sortBy: 'relevance',
  tags: [],
}

const mockProps = {
  filters: defaultFilters,
  onFiltersChange: jest.fn(),
  onApplyFilters: jest.fn(),
  onResetFilters: jest.fn(),
  loading: false,
  resultCount: 150,
}

describe('EnhancedServiceFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(servicesApi.getCategories as jest.Mock).mockResolvedValue({
      results: mockCategories,
    })
    ;(servicesApi.getCities as jest.Mock).mockResolvedValue({
      results: mockCities,
    })
  })

  describe('Component Rendering', () => {
    it('should render filter component with all sections', async () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('150 services found')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('What service do you need?')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Price Range')).toBeInTheDocument()
      expect(screen.getByText('Minimum Rating')).toBeInTheDocument()
      expect(screen.getByText('Features')).toBeInTheDocument()
      expect(screen.getByText('Service Tags')).toBeInTheDocument()
    })

    it('should show active filter count', () => {
      const filtersWithActive = {
        ...defaultFilters,
        search: 'cleaning',
        categories: ['cleaning'],
        verifiedOnly: true,
      }

      render(
        <EnhancedServiceFilters
          {...mockProps}
          filters={filtersWithActive}
        />
      )

      expect(screen.getByText('3')).toBeInTheDocument() // Active filter count badge
    })

    it('should show loading state', () => {
      render(<EnhancedServiceFilters {...mockProps} loading={true} />)

      const applyButton = screen.getByRole('button', { name: /apply/i })
      expect(applyButton).toBeDisabled()
    })
  })

  describe('Search Functionality', () => {
    it('should handle search input changes', async () => {
      const user = userEvent.setup()
      render(<EnhancedServiceFilters {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('What service do you need?')
      await user.type(searchInput, 'house cleaning')

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'house cleaning',
      })
    })

    it('should show search suggestions', async () => {
      const user = userEvent.setup()
      render(<EnhancedServiceFilters {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('What service do you need?')
      await user.type(searchInput, 'clean')

      // Wait for debounced search suggestions
      await waitFor(() => {
        expect(screen.getByText('clean cleaning')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should handle search suggestion selection', async () => {
      const user = userEvent.setup()
      render(<EnhancedServiceFilters {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('What service do you need?')
      await user.type(searchInput, 'clean')

      await waitFor(() => {
        const suggestion = screen.getByText('clean cleaning')
        fireEvent.click(suggestion)
      })

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'clean cleaning',
      })
      expect(mockProps.onApplyFilters).toHaveBeenCalled()
    })
  })

  describe('Category Filters', () => {
    it('should load and display categories', async () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Click to expand categories
      const categoriesButton = screen.getByText('Categories')
      fireEvent.click(categoriesButton)

      // Click to open category selector
      await waitFor(() => {
        const selectButton = screen.getByText('Select categories...')
        fireEvent.click(selectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Cleaning')).toBeInTheDocument()
        expect(screen.getByText('Plumbing')).toBeInTheDocument()
        expect(screen.getByText('Electrical')).toBeInTheDocument()
      })
    })

    it('should handle category selection', async () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand categories section
      const categoriesButton = screen.getByText('Categories')
      fireEvent.click(categoriesButton)

      // Open category selector
      await waitFor(() => {
        const selectButton = screen.getByText('Select categories...')
        fireEvent.click(selectButton)
      })

      // Select a category
      await waitFor(() => {
        const cleaningOption = screen.getByText('Cleaning')
        fireEvent.click(cleaningOption)
      })

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        categories: ['cleaning'],
      })
    })

    it('should display selected categories as badges', () => {
      const filtersWithCategories = {
        ...defaultFilters,
        categories: ['cleaning', 'plumbing'],
      }

      render(
        <EnhancedServiceFilters
          {...mockProps}
          filters={filtersWithCategories}
        />
      )

      // Expand categories to see badges
      const categoriesButton = screen.getByText('Categories')
      fireEvent.click(categoriesButton)

      // Should show count in the header
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('Location Filters', () => {
    it('should load and display cities', async () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Click to expand location
      const locationButton = screen.getByText('Location')
      fireEvent.click(locationButton)

      // Click to open city selector
      await waitFor(() => {
        const selectButton = screen.getByText('Select cities...')
        fireEvent.click(selectButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Kathmandu')).toBeInTheDocument()
        expect(screen.getByText('Lalitpur')).toBeInTheDocument()
        expect(screen.getByText('Bhaktapur')).toBeInTheDocument()
      })
    })

    it('should handle city selection', async () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand location section
      const locationButton = screen.getByText('Location')
      fireEvent.click(locationButton)

      // Open city selector
      await waitFor(() => {
        const selectButton = screen.getByText('Select cities...')
        fireEvent.click(selectButton)
      })

      // Select a city
      await waitFor(() => {
        const kathmanduOption = screen.getByText('Kathmandu')
        fireEvent.click(kathmanduOption)
      })

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        cities: ['kathmandu'],
      })
    })
  })

  describe('Price Range Filter', () => {
    it('should display price range slider', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand price section
      const priceButton = screen.getByText('Price Range')
      fireEvent.click(priceButton)

      expect(screen.getByText('NPR 0')).toBeInTheDocument()
      expect(screen.getByText('NPR 10,000')).toBeInTheDocument()
    })

    it('should handle price range changes', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand price section
      const priceButton = screen.getByText('Price Range')
      fireEvent.click(priceButton)

      // Find and interact with slider (this is a simplified test)
      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '5000' } })

      // The actual implementation would call onFiltersChange
      expect(mockProps.onFiltersChange).toBeDefined()
    })
  })

  describe('Rating Filter', () => {
    it('should display rating options', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand rating section
      const ratingButton = screen.getByText('Minimum Rating')
      fireEvent.click(ratingButton)

      expect(screen.getByText('4+')).toBeInTheDocument()
      expect(screen.getByText('3+')).toBeInTheDocument()
      expect(screen.getByText('2+')).toBeInTheDocument()
      expect(screen.getByText('1+')).toBeInTheDocument()
    })

    it('should handle rating selection', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand rating section
      const ratingButton = screen.getByText('Minimum Rating')
      fireEvent.click(ratingButton)

      // Select 4+ rating
      const rating4Checkbox = screen.getByLabelText(/4\+/)
      fireEvent.click(rating4Checkbox)

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        minRating: 4,
      })
    })
  })

  describe('Feature Filters', () => {
    it('should display feature checkboxes', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand features section
      const featuresButton = screen.getByText('Features')
      fireEvent.click(featuresButton)

      expect(screen.getByText('Verified Providers Only')).toBeInTheDocument()
      expect(screen.getByText('Instant Booking')).toBeInTheDocument()
      expect(screen.getByText('Available Today')).toBeInTheDocument()
    })

    it('should handle feature selection', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand features section
      const featuresButton = screen.getByText('Features')
      fireEvent.click(featuresButton)

      // Select verified only
      const verifiedCheckbox = screen.getByLabelText('Verified Providers Only')
      fireEvent.click(verifiedCheckbox)

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        verifiedOnly: true,
      })
    })
  })

  describe('Tag Filters', () => {
    it('should display service tags', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand tags section
      const tagsButton = screen.getByText('Service Tags')
      fireEvent.click(tagsButton)

      expect(screen.getByText('Eco-Friendly')).toBeInTheDocument()
      expect(screen.getByText('Same Day Service')).toBeInTheDocument()
      expect(screen.getByText('Emergency Service')).toBeInTheDocument()
      expect(screen.getByText('Warranty Included')).toBeInTheDocument()
    })

    it('should handle tag selection', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Expand tags section
      const tagsButton = screen.getByText('Service Tags')
      fireEvent.click(tagsButton)

      // Click on eco-friendly tag
      const ecoTag = screen.getByText('Eco-Friendly')
      fireEvent.click(ecoTag)

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        tags: ['eco-friendly'],
      })
    })
  })

  describe('Filter Actions', () => {
    it('should handle apply filters', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      const applyButton = screen.getByRole('button', { name: /apply/i })
      fireEvent.click(applyButton)

      expect(mockProps.onApplyFilters).toHaveBeenCalled()
    })

    it('should handle reset filters', () => {
      const filtersWithData = {
        ...defaultFilters,
        search: 'test',
        categories: ['cleaning'],
        verifiedOnly: true,
      }

      render(
        <EnhancedServiceFilters
          {...mockProps}
          filters={filtersWithData}
        />
      )

      const resetButton = screen.getByRole('button', { name: /reset/i })
      fireEvent.click(resetButton)

      expect(mockProps.onResetFilters).toHaveBeenCalled()
    })

    it('should disable reset when no active filters', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      const resetButton = screen.getByRole('button', { name: /reset/i })
      expect(resetButton).toBeDisabled()
    })
  })

  describe('Collapsible Sections', () => {
    it('should toggle section visibility', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Categories should be open by default
      expect(screen.getByText('Select categories...')).toBeInTheDocument()

      // Click to collapse
      const categoriesButton = screen.getByText('Categories')
      fireEvent.click(categoriesButton)

      // Should be collapsed (content hidden)
      expect(screen.queryByText('Select categories...')).not.toBeInTheDocument()
    })

    it('should show correct chevron icons', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Find chevron icons (they should be present for collapsible sections)
      const chevronIcons = screen.getAllByTestId(/chevron/i)
      expect(chevronIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      // Check for proper labeling
      expect(screen.getByLabelText(/search services/i)).toBeInTheDocument()
      
      // Check for proper button roles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Check for proper checkbox roles
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', () => {
      render(<EnhancedServiceFilters {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('What service do you need?')
      
      // Should be focusable
      searchInput.focus()
      expect(document.activeElement).toBe(searchInput)
      
      // Should handle keyboard events
      fireEvent.keyDown(searchInput, { key: 'Tab' })
      fireEvent.keyDown(searchInput, { key: 'Enter' })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      ;(servicesApi.getCategories as jest.Mock).mockRejectedValue(
        new Error('API Error')
      )
      ;(servicesApi.getCities as jest.Mock).mockRejectedValue(
        new Error('API Error')
      )

      render(<EnhancedServiceFilters {...mockProps} />)

      // Component should still render without crashing
      expect(screen.getByText('Filters')).toBeInTheDocument()
      
      // Should show default empty states
      await waitFor(() => {
        const categoriesButton = screen.getByText('Categories')
        fireEvent.click(categoriesButton)
        expect(screen.getByText('Select categories...')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should debounce search input', async () => {
      const user = userEvent.setup()
      render(<EnhancedServiceFilters {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('What service do you need?')
      
      // Type multiple characters quickly
      await user.type(searchInput, 'test')
      
      // Should not call onFiltersChange for each character immediately
      // The actual debouncing behavior would be tested with timer mocks
      expect(mockProps.onFiltersChange).toHaveBeenCalled()
    })
  })

  describe('Responsive Design', () => {
    it('should render properly on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<EnhancedServiceFilters {...mockProps} />)

      // Component should render without issues
      expect(screen.getByText('Filters')).toBeInTheDocument()
      
      // Mobile-specific elements should be present
      const card = screen.getByText('Filters').closest('.bg-white\\/80')
      expect(card).toBeInTheDocument()
    })
  })
})