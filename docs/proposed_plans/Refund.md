## Refunds, Surcharges, and Adjustments — Analysis and Implementation Plan

### 1) Context and Goals

- Ensure correct money flow when a booking is rescheduled or cancelled.
- Handle price differences on reschedule (higher → surcharge, lower → refund).
- Apply cancellation refund policy (full/partial/no refund) consistently.
- Provide clear API contracts to drive frontend UX (payment redirects, refund status toasts, etc.).

### 2) Current Behavior (as of now)

Backend

- Cancellation:
  - `backend/apps/bookings/views.py` → `cancel_booking` sets status and saves `cancellation_reason`, but does not process any refunds.
  - Slot counts updated if needed. No monetary actions.

- Reschedule:
  - `backend/apps/bookings/views.py` → `reschedule_booking` recalculates slot, `price`, `express_fee`, and `total_amount`, updates booking and logs `reschedule_history`.
  - No surcharge capture if price increases; no refund if price decreases.

- Payments/Refunds foundation exists:
  - `Payment` model with statuses and refund fields (`refunded`, `partially_refunded`, `refund_amount`, `refunded_at`).
  - `KhaltiPaymentService` supports initiate/lookup/complete for initial payment. No public adjustment/refund APIs wired into reschedule/cancel flows yet.

Frontend

- Reschedule UI updates booking date/time, but does not route to payment for surcharges or show refund messaging for cheaper slots.
- Cancellation dialog updates booking and shows success, but no refund context is surfaced.

### 3) Problems Identified

- No surcharge collection on reschedule when the new total > old total.
- No refunds on reschedule when the new total < old total.
- No refunds on cancellation, regardless of policy.
- Frontend lacks orchestration for adjustment payment or refund messaging.
- Risk of inconsistent state (e.g., booking updated to a higher total but no payment collected).

### 4) Requirements and Policy

- Reschedule delta handling:
  - If new_total − old_total > 0 → surcharge must be collected before finalizing.
  - If new_total − old_total < 0 → refund the difference (automated if gateway supports; otherwise mark pending/manual).
  - If delta == 0 → normal success.

- Cancellation refunds (example policy; configurable):
  - If cancelled ≥ X hours before start: full refund (minus gateway fees if applicable).
  - If cancelled < X hours or after start: partial/no refund per policy.
  - Admin override should be possible.

- Auditability:
  - Track adjustments as separate `Payment` rows or as fields on the existing payment with a clear `purpose` and relationships.

### 5) Proposed Backend Changes

5.1 Data Model (minimal-change option)

- Reuse `Payment` model. Add optional fields:
  - `purpose` (enum): `initial` | `surcharge` | `refund`.
  - `parent_payment` (FK to `Payment`, nullable) to link adjustments to the initial payment.
- Alternatively, keep current schema and only use `status`, `refund_amount`, `refund_reason`, `refunded_at`, with `transaction_id` uniqueness preserved, and encode purpose in `gateway_response`/`khalti_response`. The enum approach is cleaner.

5.2 Delta Computation Utility

- Add a helper in `views.py` or `services.py`:
  - `compute_booking_delta(booking, new_slot) -> { old_total, new_total, delta, delta_type }` with `delta_type` in `surcharge|refund|none`.

5.3 Reschedule Flow (PATCH /bookings/{id}/reschedule_booking/)

- After computing the new slot/pricing:
  - If `delta > 0` (surcharge):
    - Create a `Payment` record with `purpose='surcharge'`, `amount=delta`, `status='pending'`, link to booking (and `parent_payment` if present).
    - Do NOT mark booking as fully finalized beyond slot/time updates; keep status as previous (e.g., confirmed/pending) but annotate that surcharge is required.
    - Return payload instructing the client to initiate payment:

      ```json
      { "action": "payment_required", "booking_id": 123, "amount": 500.00, "payment_id": "SB_XXXX" }
      ```

  - If `delta < 0` (refund):
    - Attempt automatic refund via gateway (if supported) through `KhaltiPaymentService`.
      - On success: set `payment.status='partially_refunded'` (or `refunded`), set `refund_amount`, `refunded_at`.
      - On unsupported/failed: mark `refund_requested` in `gateway_response` and return `refund_pending`.
    - Response:

      ```json
      { "action": "refund_processed", "booking_id": 123, "amount": 350.00 }
      ```

      or

      ```json
      { "action": "refund_pending", "booking_id": 123, "amount": 350.00 }
      ```

  - If `delta == 0`: return `{ "action": "none" }`.

5.4 Cancellation Flow (PATCH /bookings/{id}/cancel_booking/)

- Apply refund policy using service start time vs current time and booking status.
- Determine refundable amount.
- Process refund similarly to reschedule-refund path (auto or pending/manual).
- Response payload mirrors reschedule responses with `refund_*` action.

5.5 Payment Initiation for Surcharges

- Extend `PaymentViewSet` with an endpoint to initiate a Khalti payment for a specific `Payment` row (surcharge):
  - `POST /api/payments/initiate_adjustment/ { payment_id }` → returns Khalti URL or pidx.
  - Reuse existing initiate logic but amount equals the surcharge delta.
- Ensure callback validation compares charged amount against surcharge amount, not booking total.

5.6 Safety Checks

- Prevent duplicate adjustments: if an open surcharge Payment exists, return it instead of creating a new one.
- Prevent multiple refunds for the same delta: idempotency key or state checks.

### 6) Proposed Frontend Changes

6.1 Reschedule Flow (Customer Dashboard)

- After calling reschedule API, branch on `action`:
  - `payment_required`: redirect to `/bookings/[id]/payment` with context ("Additional payment required: Rs {amount}"). Use `payment_id` to initiate.
  - `refund_processed`/`refund_pending`: show toast/badge; optionally add an entry in a Payments/Refunds page.
  - `none`: normal success.

6.2 Cancellation Flow

- After cancellation, read refund response and show appropriate messaging:
  - "Refund Rs X processed" or "Refund Rs X requested; you will be notified."

6.3 Payment Page

- Accept an optional `adjustment` context (surcharge) and override amount accordingly.
- Display clear copy for surcharges vs initial payment.

6.4 Client API

- Update `customer.api.ts` signatures to return structured `{ action, amount, ... }` for reschedule/cancel.
- Add `initiateAdjustmentPayment(paymentId)` wrapper.

### 7) API Contracts (Examples)

Reschedule (200)

```json
// surcharge
{ "action": "payment_required", "booking_id": 123, "amount": 500.00, "payment_id": "SB_8FA12C34" }

// refund immediate
{ "action": "refund_processed", "booking_id": 123, "amount": 350.00 }

// refund pending
{ "action": "refund_pending", "booking_id": 123, "amount": 350.00 }

// no change
{ "action": "none" }
```

Cancel (200)

```json
{ "action": "refund_processed", "booking_id": 123, "amount": 800.00 }
// or
{ "action": "refund_pending", "booking_id": 123, "amount": 800.00 }
// or
{ "action": "no_refund" }
```

Initiate Adjustment Payment (200)

```json
{ "payment_url": "https://dev.khalti.com/checkout/...", "pidx": "...", "payment_id": "SB_8FA12C34" }
```

### 8) Edge Cases

- Multiple reschedules in sequence: chain surcharges/refunds and compute against the latest confirmed total. Use `parent_payment` linkage.
- Payment mismatch in callback: verify against surcharge amount; reject and keep payment pending.
- Cancellation after partial refund earlier: cap refund to net paid amount.
- Time-zone and cutoff logic for refund policy: centralize policy utilities.

### 9) Testing Strategy

Backend

- Reschedule → surcharge path: returns `payment_required` and creates pending Payment with correct amount.
- Reschedule → refund path: sets Payment to partially_refunded or marks refund_pending.
- Cancellation with full/partial/no-refund across policy thresholds.
- Idempotency and duplicate protection.

Frontend

- Reschedule → surcharge redirects to payment page with correct amount.
- Reschedule → refund shows correct toast/badge.
- Cancel → refund messaging reflects payload.

Integration

- End-to-end Khalti initiate → callback for surcharge amounts.

### 10) Rollout Plan

- Phase 1 (Backend): Add delta computation, extend reschedule/cancel endpoints to return `{ action, amount }`. Create surcharge Payment records. Mark refunds as pending if automation is not ready.
- Phase 2 (Backend): Implement/enable automated refunds via `KhaltiPaymentService` (if supported). Update statuses to `refunded/partially_refunded` with timestamps.
- Phase 3 (Frontend): Wire branching logic, payment redirects, and improved messaging. Add a simple Payments/Refunds history view.
- Phase 4: Policy configuration UI (admin), audit logs, and customer notifications.

### 11) Summary

This plan closes the gaps between booking state changes and financial transactions. By introducing explicit surcharge and refund handling tied to reschedule and cancellation, and by standardizing the API responses, we enable a consistent user experience and reliable accounting without breaking existing payment integrations.
