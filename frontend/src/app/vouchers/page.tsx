/**
 * Vouchers Page
 * 
 * Main voucher management page for users
 * Route: /vouchers
 */

import { VoucherManagementPage } from '@/components/vouchers'

export default function VouchersPage() {
  return <VoucherManagementPage />
}

export const metadata = {
  title: 'My Vouchers | SewaBazaar',
  description: 'Manage your discount vouchers and redeem points for new vouchers',
}
