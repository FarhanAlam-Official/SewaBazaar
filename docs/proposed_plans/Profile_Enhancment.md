## SewaBazaar Customer Profile: Integration Plan (Backend + Frontend)

This document outlines how to turn the new Profile page (personal insights, achievements, social, goals, branded QR) from mock data into a fully integrated, production-ready feature.

### Goals
- Provide unique, profile-specific value (not duplicate dashboard/settings).
- Persist data models for achievements, milestones/goals, social connections, and insights.
- Add REST endpoints with secure access control.
- Integrate frontend components with APIs via `customerApi`.

---

## 1) Data Model Changes (Django)

Assumptions: Django + DRF backend, existing `User` model and `Profile` with `OneToOne`.

### 1.1 Achievements
- Model: `Achievement` (catalog) and `UserAchievement` (user-earned)
- Fields:
  - Achievement: `id`, `slug`, `title`, `description`, `icon`, `rarity` [common|rare|epic|legendary], `category` [booking|spending|social|loyalty|special], `points` (int), `is_active` (bool)
  - UserAchievement: `id`, `user`, `achievement`, `unlocked_at` (datetime), `progress_current` (int), `progress_total` (int, nullable)

### 1.2 Milestones / Goals
- Model: `UserGoal`
- Fields: `id`, `user`, `title`, `description`, `category` [bookings|spending|reviews|social], `target` (int/decimal), `current` (int/decimal), `deadline` (date, null), `reward` (text, null), `status` [active|completed|archived]

### 1.3 Social
- Model: `UserConnection`
- Fields: `id`, `user` (owner), `peer` (FK->User), `connection_type` [friend|family|colleague], `mutual_services` (int, default=0), `connected_at` (datetime)
- Model: `ProfileStats`
- Fields: `user`, `profile_views` (int), `helpful_votes` (int), `reviews_received` (int), `connections_count` (int, denormalized)
- Model: `ProfilePrivacy`
- Fields: `user`, `visibility` [public|private|friends]

### 1.4 Insights (Read-optimized)
- Model: `UserInsights`
- Fields: `user`, `primary_category` (str), `preferred_time_slots` (Array/Text JSON), `avg_booking_value` (decimal), `booking_frequency` [low|medium|high], `service_preferences` (Array/Text JSON), `monthly_average` (decimal), `highest_spending_month` (str), `favorite_service_type` (str), `budget_consciousness` [low|medium|high], `most_active_day` (str), `preferred_booking_method` [mobile|desktop|app], `response_time_hours` (float), `cancellation_rate_pct` (float)
- Populated by scheduled job or on-demand aggregation from bookings/payments/reviews.

---

## 2) API Endpoints (DRF)

Base prefix: `/api/customer/profile/`

### 2.1 Profile Overview
- GET `/overview/`
  - Returns: `insights`, `social_stats`, `privacy`, `sharing` (profile URL), basic user info.
  - Permissions: Authenticated user (self only).

### 2.2 Achievements
- GET `/achievements/`: list earned + optional catalog metadata
- POST `/achievements/progress/` body: `{slug, delta}` → increments progress and unlocks when reaching threshold
- Permissions: Authenticated (self only)

### 2.3 Goals
- GET `/goals/`
- POST `/goals/` create new goal
- PATCH `/goals/{id}/` update progress/status
- Permissions: Authenticated (self only)

### 2.4 Social
- GET `/social/connections/`
- POST `/social/connections/` body: `{peer_id, connection_type}`
- DELETE `/social/connections/{id}/`
- GET `/social/stats/`
- PATCH `/social/privacy/` body: `{visibility}`

### 2.5 Sharing & QR
- GET `/sharing/qr/` query: `profile_id` → returns signed URL for QR payload (optional server-side)
- Or generate QR client-side (current approach) with profile URL.

---

## 3) Views/Serializers (Sketch)

Serializers:
- `UserInsightsSerializer`, `ProfileStatsSerializer`, `ProfilePrivacySerializer`
- `AchievementSerializer`, `UserAchievementSerializer`
- `UserGoalSerializer`
- `UserConnectionSerializer`

Views (DRF ViewSets / APIViews):
- `ProfileOverviewView` (GET overview)
- `UserAchievementsViewSet` (list, create-progress)
- `UserGoalsViewSet` (CRUD)
- `UserConnectionsViewSet` (list/create/delete)
- `ProfileStatsView` (GET), `ProfilePrivacyView` (PATCH)

Permissions:
- Use `IsAuthenticated` and ensure user matches request.user on objects.

---

## 4) URL Routing

```
/api/customer/profile/overview/
/api/customer/profile/achievements/
/api/customer/profile/achievements/progress/
/api/customer/profile/goals/
/api/customer/profile/goals/{id}/
/api/customer/profile/social/connections/
/api/customer/profile/social/connections/{id}/
/api/customer/profile/social/stats/
/api/customer/profile/social/privacy/
/api/customer/profile/sharing/qr/
```

---

## 5) Frontend Integration (Next.js)

### 5.1 API Module (`services/customer.api.ts`)
Add methods:
- `getProfileOverview()`
- `getAchievements()` / `postAchievementProgress(slug, delta)`
- `getGoals()` / `createGoal(payload)` / `updateGoal(id, payload)`
- `getConnections()` / `createConnection(payload)` / `deleteConnection(id)`
- `getSocialStats()` / `updatePrivacy(payload)`
- `getSharingQR(profileId)` (optional if server-generated)

### 5.2 Components (already created on profile page)
- Personal Insights, Achievements grid, Connections list, Goals list
- Branded QR Modal (done): uses canvas to render brand header, QR center, profile footer

### 5.3 State & Data Flow
- On profile load: call `getProfileOverview()` and hydrate Insights + Social Stats + Sharing
- Tabs:
  - Achievements tab: `getAchievements()`; progress updates via `postAchievementProgress`
  - Social tab: `getConnections()`; add/remove connections
  - Goals tab: `getGoals()`; create/update goals

---

## 6) Security & Privacy
- Respect `ProfilePrivacy.visibility` in all endpoints; deny GET for others when `private`, allow for `friends` if connection exists.
- Rate-limit achievement progress endpoint.
- Validate `peer_id` to avoid self-connections and duplicates.

---

## 7) Migration & Seed
- Create migrations for models above.
- Seed `Achievement` catalog with common badges (first_booking, loyal_customer, review_master, social_butterfly, big_spender, profile_perfectionist ...).

---

## 8) Analytics & Jobs
- Nightly job to recompute `UserInsights` from bookings, reviews, payments.
- Hook: on booking completion → increment achievements, update goals.

---

## 9) Acceptance Criteria
- Profile loads with real data for insights, achievements, social, and goals.
- Creating/updating goals reflects immediately in UI.
- Adding/removing connections works and updates counts.
- Earning progress unlocks achievements and awards points.
- Branded QR modal renders and downloads correctly on desktop/mobile.

---

## 10) Phased Rollout
1) Backend models + read-only endpoints (overview, achievements list, goals list, connections list)
2) Frontend read integration for all tabs
3) Mutations: goals create/update, connections add/remove, achievement progress
4) Privacy controls + external profile page rendering
5) Insights job and live stats wiring


