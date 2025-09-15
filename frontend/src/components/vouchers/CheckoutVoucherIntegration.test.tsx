import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CheckoutVoucherIntegration } from './CheckoutVoucherIntegration'
import { VoucherData } from './VoucherCard'

// Mock the VoucherService
jest.mock('@/services/VoucherService', () => ({
  VoucherService: {
    validateVoucherCode: jest.fn(),
    baseUrl: 'http://localhost:8000/api'
  }
}))

// Mock Cookies
jest.mock('js-cookie', () => ({
  get: jest.fn()
}))

// Mock the toast
jest.mock('@/components/ui/enhanced-toast', () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock the MobileVoucherRedemption component
jest.mock('./MobileVoucherRedemption', () => ({
  MobileVoucherRedemption: () => <div>Mobile Voucher Redemption</div>
}))

describe('CheckoutVoucherIntegration', () => {
  const mockServices = [
    {
      id: '1',
      name: 'Plumbing Service',
      category: 'Home Services',
      basePrice: 500,
      duration: 2,
      provider: {
        name: 'John Doe',
        rating: 4.5
      }
    }
  ]

  const mockVouchers: VoucherData[] = [
    {
      id: '1',
      voucher_code: 'VOUCHER1',
      value: 100,
      status: 'active',
      created_at: '2023-01-01',
      expires_at: '2024-01-01',
      points_redeemed: 100,
      usage_policy: 'fixed'
    },
    {
      id: '2',
      voucher_code: 'VOUCHER2',
      value: 200,
      status: 'active',
      created_at: '2023-01-01',
      expires_at: '2024-01-01',
      points_redeemed: 200,
      usage_policy: 'fixed'
    }
  ]

  const mockOnPaymentComplete = jest.fn()
  const mockOnVoucherApply = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with services and vouchers', () => {
    render(
      <CheckoutVoucherIntegration
        services={mockServices}
        vouchers={mockVouchers}
        onPaymentComplete={mockOnPaymentComplete}
        onVoucherApply={mockOnVoucherApply}
      />
    )

    // Check if order summary is rendered
    expect(screen.getByText('Order Summary')).toBeInTheDocument()
    expect(screen.getByText('Plumbing Service')).toBeInTheDocument()
    
    // Check if voucher section is rendered
    expect(screen.getByText('Vouchers & Points')).toBeInTheDocument()
  })

  it('allows manual voucher code entry', async () => {
    const { VoucherService } = require('@/services/VoucherService')
    const Cookies = require('js-cookie')
    
    // Mock the validation response
    ;(VoucherService.validateVoucherCode as jest.Mock).mockResolvedValue({
      id: '3',
      voucher_code: 'TESTVOUCHER',
      value: 150,
      status: 'active',
      created_at: '2023-01-01',
      expires_at: '2024-01-01',
      points_redeemed: 150,
      usage_policy: 'fixed'
    })
    
    ;(Cookies.get as jest.Mock).mockReturnValue('test-token')

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_use: true })
      })
    ) as jest.Mock

    render(
      <CheckoutVoucherIntegration
        services={mockServices}
        vouchers={mockVouchers}
        onPaymentComplete={mockOnPaymentComplete}
        onVoucherApply={mockOnVoucherApply}
      />
    )

    // Expand the voucher section
    const voucherSection = screen.getByText('Vouchers & Points')
    fireEvent.click(voucherSection)

    // Enter voucher code
    const voucherInput = screen.getByPlaceholderText('Enter voucher code')
    fireEvent.change(voucherInput, { target: { value: 'TESTVOUCHER' } })

    // Click apply button
    const applyButton = screen.getByText('Apply')
    fireEvent.click(applyButton)

    // Wait for validation
    await waitFor(() => {
      expect(VoucherService.validateVoucherCode).toHaveBeenCalledWith('TESTVOUCHER')
    })
  })

  it('allows applying vouchers from the list', () => {
    render(
      <CheckoutVoucherIntegration
        services={mockServices}
        vouchers={mockVouchers}
        onPaymentComplete={mockOnPaymentComplete}
        onVoucherApply={mockOnVoucherApply}
      />
    )

    // Expand the voucher section
    const voucherSection = screen.getByText('Vouchers & Points')
    fireEvent.click(voucherSection)

    // Apply the first voucher
    const applyButton = screen.getAllByText('Apply')[1] // Second "Apply" button (first is for manual entry)
    fireEvent.click(applyButton)

    // Check if the button text changed to "Remove"
    expect(screen.getByText('Remove')).toBeInTheDocument()
  })
})