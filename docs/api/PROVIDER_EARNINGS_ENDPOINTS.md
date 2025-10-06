## Provider Earnings Endpoints – Calculation Reference

This document summarizes how backend endpoints compute provider earnings and related analytics, with key differences, caveats, and recommendations for consistency.

### Base Models and Fields (assumed)
- Bookings are counted from `apps.bookings.models.Booking`.
- Key fields used:
  - `status`: booking lifecycle (`pending`, `confirmed`, `service_delivered`, `awaiting_confirmation`, `completed`, `cancelled`).
  - `total_amount`: gross booking amount.
  - `created_at`, `updated_at`, `booking_date`.
  - `payment__status`: nested Payment status (e.g., `completed`).
- Platform fee: 10% hard-coded in multiple endpoints.

---

### Endpoint: provider_dashboard/earnings (updated)
Path: `/api/bookings/provider_dashboard/earnings/`

Filters for totals:
- Completed bookings, with paid-only enforced via `EARNINGS_REQUIRE_PAID` (default true):
  - When true: `status='completed'` AND `payment__status='completed'`.
  - When false: `status='completed'` only.

Pending earnings:
- Unified to reflect available-for-payout: `net(completed) - total_paid_out` using `ProviderEarnings`.

Period/date logic:
- “This month” uses calendar month based on `created_at`.
- Trends: last 6 calendar months (accurate month boundaries), `created_at` window.
- Fee uses `PLATFORM_FEE_RATE` (default 10%).

Outputs (selected):
- `summary.totalEarnings`: SUM of `total_amount` (completed + paid).
- `summary.thisMonth`: SUM of `total_amount` for current month (completed + paid).
- `summary.pending`: SUM of `total_amount` where status indicates delivery/awaiting.
- `monthlyTrends[]`: per-month {grossEarnings, platformFee, netEarnings, bookingsCount}.

Notes:
- Paid-only consistency controlled via `EARNINGS_REQUIRE_PAID` aligns with other endpoints now.

---

### Endpoint: provider_dashboard/earnings_analytics (updated)
Path: `/api/bookings/provider_dashboard/earnings_analytics/`

Filters:
- `status='completed'` with paid-only enforced by `EARNINGS_REQUIRE_PAID`.

Period/date logic:
- `period=week|month|year`.
- Buckets use `updated_at__date` with calendar-accurate ranges:
  - week: last 8 true weeks
  - month: last 12 true calendar months
  - year: last 5 true calendar years

Outputs (selected):
- `earnings_data[]`: per bucket {period start date, earnings (gross), bookings_count}.
- `total_earnings`: sum of gross across buckets.
- `average_per_booking` = `total_earnings / sum(bookings_count)`.

Notes:
- Uses `updated_at` (completion time); paid-only inclusion controlled by setting.

---

### Endpoint: provider_earnings/earnings_overview (updated)
Path: `/api/bookings/provider_earnings/earnings_overview/`

Filters:
- `status='completed'` with paid-only enforced by `EARNINGS_REQUIRE_PAID`.

Period/date logic:
- `period=week|month|quarter|year`.
- Current vs previous period boundaries computed via calendar start dates.
- Uses `updated_at__date` for aggregation.

Platform fee:
- `PLATFORM_FEE_RATE` (default 10%) to compute `platform_fee` and `net_earnings`.

Outputs (selected):
- `current_period`: gross, fee, net, booking_count, average_per_booking.
- `previous_period`: gross, net, booking_count.
- `growth`: percentage and amount comparing current gross vs previous gross.
- `all_time`: gross, fee, net, booking_count across all completed bookings.
- `top_earning_services[]`: gross and net (after 10%) per service.

Notes:
- Aligns with `earnings_analytics` (completed-only), differs from paid-only endpoint.

---

### Endpoint: provider_earnings/payout_summary (updated)
Path: `/api/bookings/provider_earnings/payout_summary/`

Filters for totals:
- Completed bookings with paid-only enforced by `EARNINGS_REQUIRE_PAID` to compute `total_earnings` gross/net.

Payout records:
- Reads from `ProviderEarnings` to compute:
  - `total_paid_out`: SUM of `net_amount` where `payout_status='completed'`.
  - `pending_payout`: SUM where `payout_status='pending'`.
- `available_for_payout = total_net - total_paid_out`.
- `recent_payouts[]` from `ProviderEarnings`.

Notes:
- If `ProviderEarnings` entries are not created during payout flows, `pending_payout` may be 0 and `available_for_payout` ≈ all-time net.

---

## Inconsistencies and Their Effects (after updates)

- Payment status filtering:
  - Unified via `EARNINGS_REQUIRE_PAID`. Set to true for paid-only across endpoints.

- Date field and period boundaries:
  - Now calendar-accurate buckets for week/month/year. Still: `created_at` used for monthly trends; `updated_at` used for analytics/overview comparisons by design.

- “Pending” meaning:
  - Unified to reflect payout lifecycle: `available_for_payout` and `pending_payout` from `ProviderEarnings`.

- Platform fee:
  - Hard-coded 10% across endpoints; real fee schedules may differ.

---

## Recommendations for Consistency

1) Define “earned” consistently:
   - If you require payment settlement, add `payment__status='completed'` to `earnings_overview`, `earnings_analytics`, and `payout_summary`.
   - Or remove the payment filter from `provider_dashboard/earnings` to match completed-only logic.

2) Use consistent date fields and true calendar periods:
   - Prefer a single event date (e.g., `paid_at` or `completed_at`/`updated_at`) for all period aggregations.
   - Use exact boundaries (month start to next month start), not 30/365-day approximations.

3) Unify “pending” definition:
   - Base “pending” on booking statuses everywhere, OR derive exclusively from `ProviderEarnings` lifecycle.

4) Make platform fee configurable:
   - Move fee rate to settings or per-booking/provider configuration.

5) Document in UI:
   - Add tooltips/labels clarifying whether amounts are gross vs net, paid vs completed, and how periods are defined.

---

## Quick Mapping (UI Tabs → Endpoints)
- Stats overview cards: `provider_earnings/earnings_overview` (net/gross, growth, all_time).
- Charts/trends: `provider_dashboard/earnings_analytics` (completed-only by `updated_at`).
- Payout section: `provider_earnings/payout_summary` (net totals and payout records).
- Legacy summary: `provider_dashboard/earnings` (paid-only totals + status-based pending).


