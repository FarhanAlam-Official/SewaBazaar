# Support Ticket System Implementation Plan

## Overview

This document outlines a detailed, chronological implementation plan for building a comprehensive support ticket system for SewaBazaar. The system will allow customers to create and manage support tickets, while staff can respond and resolve issues efficiently.

## Quick Analysis

### Current State

- Frontend: Support page UI with ticket listing, creation dialog, and conversation view exist but use mock data only

- Backend: No support app, no models, no serializers, no API endpoints
- Key missing capabilities: Ticket storage, message history, attachments, permissions/ownership, staff/admin flows, notification triggers, real-time updates, validations, file handling

### Priority

Backend API with secure permissions must be implemented first so the frontend can be wired to real data. After that, attachments, notifications, and real-time updates are incremental features.

---

## High-Level MVP Scope

1. New backend "support" app that stores tickets, messages, and attachments
2. Basic REST API: list/create tickets, retrieve ticket detail, add message, upload attachment, update ticket status/priority
3. Permissions: customers can only access their tickets; staff can access all
4. Frontend wiring: replace mock data with API calls, optimistic updates for message send, file upload UI
5. Tests + basic monitoring and deployment

Everything else (real-time, SLA, agent dashboard, search, knowledge base) is Phase 2.

---

## Phase 0: Prep & Planning (0.5 day)

### Tasks

1. Create a single document with API contract (endpoints + request/response shapes)
2. Decide storage for attachments (local, S3, or other cloud storage)
3. Decide authentication mechanism for API (existing token/JWT setup)
4. Add this feature to your issue tracker with tickets for each step below

### Deliverables

- API contract document

- Issue backlog in project management system

---

## Phase 1: Backend Core (2-3 days)

### 1. Create Support App & Database Models

#### Models to Implement

**Ticket Model**

- Fields:
  - id (UUID)
  - title (CharField)
  - customer (ForeignKey to User)
  - category (CharField with choices: billing, technical, account, service, general)
  - status (CharField with choices: open, in_progress, resolved, closed)
  - priority (CharField with choices: low, medium, high, urgent)
  - assigned_agent (ForeignKey to User, nullable)
  - created_at (DateTimeField)
  - updated_at (DateTimeField)
  - closed_at (DateTimeField, nullable)
  - source (CharField with choices: web, mobile, email, phone)
  - tags (JSONField for tagging)

**Message Model**

- Fields:
  - id (UUID)
  - ticket (ForeignKey to Ticket)
  - sender (ForeignKey to User)
  - message_text (TextField)
  - created_at (DateTimeField)
  - is_from_customer (BooleanField)
  - is_internal (BooleanField, for staff-only notes)
  - read_by_customer (BooleanField)
  - read_by_staff (BooleanField)

**Attachment Model**

- Fields:
  - id (UUID)
  - ticket (ForeignKey to Ticket)
  - message (ForeignKey to Message, nullable)
  - uploaded_by (ForeignKey to User)
  - file (FileField)
  - filename (CharField)
  - file_size (PositiveIntegerField)
  - content_type (CharField)
  - created_at (DateTimeField)

### 2. Migrations

- Create and run migrations
- Test locally to ensure models work correctly

### 3. Serializers / DTOs

#### Serializers to Implement

**Ticket Serializers**

- TicketListSerializer: For list endpoint, returns ticket summary
  - Fields: id, title, status, priority, last_message_snippet, unread_count, updated_at, category
- TicketDetailSerializer: For detail endpoint, includes full messages array
  - Fields: All ticket fields + messages array with attachments metadata

**Message Serializers**

- MessageCreateSerializer: For message creation
  - Fields: message_text, is_internal (staff-only)
- MessageDetailSerializer: For displaying messages
  - Fields: id, sender details, message_text, created_at, attachments metadata

**Attachment Serializers**

- AttachmentCreateSerializer: For attachment uploads
  - Fields: file
- AttachmentDetailSerializer: For displaying attachment metadata
  - Fields: id, filename, file_size, content_type, created_at, download_url

### 4. Views / Controllers (REST)

#### Endpoints to Implement

**Customer Endpoints**

- `GET /api/support/tickets/` - List customer's tickets (with pagination & filters)
- `POST /api/support/tickets/` - Create ticket (title, category, initial message)
- `GET /api/support/tickets/{ticket_id}/` - Ticket detail with messages
- `POST /api/support/tickets/{ticket_id}/messages/` - Append message to a ticket
- `POST /api/support/tickets/{ticket_id}/attachments/` - Upload file(s)

**Staff Endpoints**

- `GET /api/support/tickets/` - List all tickets (with advanced filters)
- `PUT /api/support/tickets/{ticket_id}/` - Update ticket status/priority/assigned_agent
- `POST /api/support/tickets/{ticket_id}/assign/` - Assign ticket to agent
- `POST /api/support/tickets/{ticket_id}/escalate/` - Escalate ticket

### 5. Permissions

- Customers: Can list and view only their tickets; can post messages to their tickets
- Staff (is_staff): Can view all tickets, post messages, change status/assignment
- Admin: All staff permissions plus user management
- Defensive checks to prevent users from accessing others' tickets

### 6. Validations

- Message length limits (e.g., 5000 characters)
- Allowed file types (images, documents, PDFs)
- Attachment size limits (e.g., 10MB per file)
- Rate limiting for ticket creation and message posting
- Reject attachments that exceed limits and return informative error messages

### Deliverables

- Working REST API for core flow, accessible in local environment

---

## Phase 2: Frontend Integration (1-2 days)

### 1. Replace Mock Data

- Replace the mock data fetching with real API calls to the endpoints above
- Implement loading/skeleton states and error UI
- Use a central API service module to call endpoints and handle auth headers

### 2. Ticket Creation Flow

- When user creates a ticket:
  - Create ticket via API (title + meta)
  - Optionally post the initial message tied to the ticket
  - Navigate to ticket detail on success

### 3. Ticket Detail / Conversation UI

- Fetch ticket detail including messages and attachments
- Render messages in chronological order with sender labels (you vs support)
- Compose area: textarea, file picker, send button
- On send:
  - Optimistically append the message locally while POSTing to server
  - If attach files, upload (FormData) then reference attachment ids in message POST
- Show upload progress and errors
- Implement scroll-to-bottom behavior on new messages

### 4. Message UI Polish

- Internal/staff-only messages: Gray badge and hidden for customers if internal flagged
- Timestamp formatting and relative time
- Unread message indicators
- Message grouping by sender/date

### Deliverables

- Frontend connected to backend; user can create tickets, read conversation, and send messages with attachments

---

## Phase 3: Attachments & Storage (0.5-1 day)

### Tasks

1. Implement backend file handling:
   - If using S3: presigned uploads or server-side upload
   - Validate file types and size server-side
2. Frontend: File picker supporting multiple files; progress bar; client validation (size/type) before upload
3. Link each uploaded file to a message or ticket
4. Implement file preview for images and documents
5. Add download functionality for attachments

### Deliverables

- Attachments upload + view in messages

---

## Phase 4: Notifications & Background Tasks (1-2 days)

### Tasks

1. On ticket creation or staff reply, send email to customer
2. On customer message, optionally notify assigned agent(s)
3. Use async task runner (Celery) for email sending
4. Add notification entries to the existing notification system so users get UI notifications for new replies
5. Implement unread message tracking

### Deliverables

- Email notifications + in-app notifications for ticket updates

---

## Phase 5: Real-Time Updates (Optional, 1-3 days)

### Options

- WebSocket (Django Channels) - push messages to users/agents
- Server-Sent Events (SSE) - simpler alternative to WebSockets
- Polling fallback (every 10-20s) if real-time not available

### Implementation Steps

1. Choose tech (Channels, SSE, or polling)
2. On new message created, broadcast event `ticket:{id}:message` with payload
3. Frontend subscribes and appends new message in real time or triggers a refresh

### Deliverables

- Live conversation updates for better UX

---

## Phase 6: Staff/Admin Interface (1-3 days)

### Tasks

1. Admin views:
   - Ticket queue with filters by status/priority/category
   - Ability to assign agent
   - Escalation functionality
   - Ticket statistics dashboard
2. Staff conversation UI:
   - Same as customer plus internal notes toggle
   - Ability to set status, priority, and assignment
   - Canned responses for common issues
3. Metrics:
   - Average response time
   - Open tickets by priority
   - Resolution rates
   - Agent performance metrics

### Deliverables

- Staff can handle tickets end-to-end

---

## Phase 7: Testing, QA & Hardening (1-2 days)

### Backend Unit Tests

- Ticket CRUD permission tests
- Message posting tests
- Attachment validation tests
- Rate limiting tests
- Security tests (access control)

### API Integration Tests

- Workflow from create ticket → post message → staff reply
- Attachment upload and download tests
- Notification delivery tests

### Frontend Tests

- Snapshot tests for components
- Integration tests for ticket creation and messaging
- Error handling tests
- Accessibility tests

### Security Checks

- Ensure users cannot access others' tickets
- Rate limit ticket creation/message posting to avoid abuse
- Virus/scan attachments if needed
- Sanitize message content to prevent XSS

### Deliverables

- Test suite and passing CI

---

## Phase 8: Deployment & Rollout (0.5-1 day)

### Tasks

1. Deploy backend changes with migration
2. Deploy frontend changes
3. Use feature flag (toggle) to switch UI from mock to live endpoints if you want safer rollout
4. Monitor logs and error tracking (Sentry)
5. Communicate to team and update docs

### Deliverables

- Live ticket system in production

---

## API Contracts & UX Behavior

### Endpoints

- **List tickets**: Returns array of tickets with id, title, status, priority, last_message_snippet, unread_count, updated_at
- **Create ticket**: Accept title, category, optional priority, and initial message text. Return created ticket id and detail link
- **Ticket detail**: Returns ticket meta and full messages list; each message contains id, sender id/type, text, created_at, attachments metadata (id + url + filename)
- **Post message**: Accept text, optional list of attachment ids (or accept multipart with files). Return created message object
- **Upload attachment**: Accept file multipart, return attachment id and public or signed URL for display
- **Update ticket**: Accept status and priority or assigned_agent (staff-only). Return updated ticket

### UX Rules

- Show "unread" indicator if staff posted messages since user last opened ticket
- Allow file preview and download; display icons and filenames
- Disallow messages when ticket closed (unless reopened)
- Confirmation modals for destructive actions (close ticket)
- Accessibility: keyboard navigation, proper ARIA labels for conversation and file inputs

---

## Acceptance Criteria (What Counts as "Done" for MVP)

- Customer can create a ticket that persists to DB
- Customer can view a ticket and its full message history
- Customer can post messages and upload attachments
- Customer cannot see or modify other users' tickets
- Staff can view, reply, change status and assign tickets
- Emails or in-app notifications are sent on replies (at least one mechanism)
- Basic test coverage for core backend flows
- Frontend shows proper loading/error states and optimistic messaging UX

---

## Non-Functional Considerations

### Security

- Enforce auth & authorization checks

- Sanitize message content
- Validate files
- Implement rate limiting

### Performance

- Paginate ticket lists

- Index by updated_at
- Use lazy-loading of messages if very large threads
- Optimize database queries

### Scalability

- If attachments grow, store in cloud and serve via CDN

- Implement caching for frequently accessed data
- Consider message archiving for old tickets

### Monitoring

- Capture errors

- Email delivery failures
- Queue backlogs
- Performance metrics

### Compliance

- Retention policy for support data/attachments

- GDPR/user data export if required
- Audit logging for sensitive actions

---

## Suggested Milestone Breakdown (Sprints)

- **Sprint 1 (2-3 days)**: Backend models + API core endpoints + migrations
- **Sprint 2 (1-2 days)**: Frontend wiring + create/read/basic messaging
- **Sprint 3 (1 day)**: Attachments + file handling UI
- **Sprint 4 (1-2 days)**: Notifications + email; basic tests
- **Sprint 5 (optional, 1-3 days)**: Real-time updates + staff admin UI + polish

---

## QA Checklist

- [ ] Endpoint auth verified (customers only see own tickets)
- [ ] File upload: accepted types & size limits enforced
- [ ] Messages order and timestamps correct
- [ ] Error messages are user-friendly on failure
- [ ] Attachments accessible and preview works
- [ ] Staff actions correctly restrict to staff users
- [ ] Tests pass in CI
- [ ] Logs/metrics for ticket creation and reply events exist
- [ ] Accessibility standards met
- [ ] Mobile responsiveness verified

---

## Integration with Existing SewaBazaar Systems

### Notification System

- Integrate with existing Notification Model for ticket updates

- Reuse notification delivery channels (email, in-app)

### User Management

- Work with existing User Model and RBAC system

- Leverage existing authentication and session management

### File Storage

- Use existing storage configuration (local/S3)

- Follow established patterns for file handling

### Error Handling

- Align with existing error response formats

- Use common exception handling patterns

---

## Future Enhancements (Phase 2)

1. **Knowledge Base Integration**
   - Auto-suggest articles based on ticket content
   - Link relevant help documents

2. **Advanced Analytics**
   - Ticket volume trends
   - Resolution time analytics
   - Customer satisfaction tracking

3. **Automation**
   - Auto-assignment based on category/expertise
   - SLA tracking and alerts
   - Canned response suggestions

4. **Multi-language Support**
   - Ticket translation
   - Language detection

5. **Customer Portal Enhancements**
   - Knowledge base/self-service
   - Ticket submission forms by category
   - Satisfaction surveys

This implementation plan provides a comprehensive roadmap for building a robust support ticket system that integrates seamlessly with the existing SewaBazaar architecture while following industry best practices for security, scalability, and user experience.
