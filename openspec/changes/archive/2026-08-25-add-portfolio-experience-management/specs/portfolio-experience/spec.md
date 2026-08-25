## Purpose

Portfolio experience management lets AntinOS maintain structured professional work history, manage publication and ordering, and expose published roles safely to public visitors.

## ADDED Requirements

### Requirement: Store portfolio experience entries
The system SHALL store work-experience entries with company, role, location, employment type, start date, optional end date, current-role state, summary, achievement entries, technologies, display order, and publication state.

#### Scenario: Persist complete experience entry
- **WHEN** a valid experience entry is created
- **THEN** the system stores all required and optional experience fields with id and timestamps

#### Scenario: Store achievement entries
- **WHEN** an experience entry includes achievement entries
- **THEN** the system preserves each achievement as a separate ordered text entry

#### Scenario: Store technologies
- **WHEN** an experience entry includes technologies
- **THEN** the system preserves each technology as a separate text entry

#### Scenario: Track display order
- **WHEN** an experience entry is stored
- **THEN** the system stores a display order value that can be used for admin and public ordering

### Requirement: Validate experience data
The system SHALL reject invalid experience data before creating or updating entries.

#### Scenario: Reject missing required fields
- **WHEN** an experience create request omits company, role, employment type, start date, summary, display order, or publication state
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject whitespace-only text
- **WHEN** company, role, location, employment type, summary, supplied achievement entries, or supplied technology entries are empty after trimming whitespace
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject current role with end date
- **WHEN** an experience create or update request marks an entry as current and provides an end date
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject end date before start date
- **WHEN** an experience create or update request provides an end date before the start date
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject invalid display order
- **WHEN** an experience create, update, or reorder request provides a non-integer or negative display order
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject empty update
- **WHEN** an experience update request contains no editable fields
- **THEN** the system rejects the request with a validation error

### Requirement: Manage experience entries through protected APIs
The system SHALL provide owner-authenticated APIs to create, list, read, update, delete, publish, unpublish, and reorder experience entries.

#### Scenario: Create experience entry
- **WHEN** an authenticated owner sends a valid experience create request
- **THEN** the system creates the entry and returns the stored experience

#### Scenario: Default new experience to unpublished
- **WHEN** an authenticated owner creates an experience entry without an explicit publication state
- **THEN** the system creates the entry as unpublished

#### Scenario: List managed experience entries
- **WHEN** an authenticated owner requests managed experience entries
- **THEN** the system returns all experience entries regardless of publication state

#### Scenario: Read managed experience entry
- **WHEN** an authenticated owner requests a specific existing experience entry
- **THEN** the system returns that entry regardless of publication state

#### Scenario: Update experience entry
- **WHEN** an authenticated owner sends a valid update for an existing experience entry
- **THEN** the system persists the changes and returns the updated experience

#### Scenario: Delete experience entry with confirmation upstream
- **WHEN** an authenticated owner confirms deletion of an existing experience entry
- **THEN** the system removes the entry so it no longer appears in managed or public retrieval

#### Scenario: Reorder experience entries
- **WHEN** an authenticated owner submits a valid ordered list of experience ids
- **THEN** the system updates display order so subsequent managed and public retrieval reflect the requested order

#### Scenario: Reject unauthenticated management request
- **WHEN** a request without valid owner authentication calls a management experience API
- **THEN** the system returns HTTP 401 without performing the management operation

### Requirement: Expose public experience entries
The system SHALL provide unauthenticated public retrieval for published experience entries only.

#### Scenario: List public experience entries
- **WHEN** a visitor requests public experience entries
- **THEN** the system returns only entries marked as published

#### Scenario: Hide unpublished experience entries
- **WHEN** unpublished experience entries exist
- **THEN** public experience retrieval omits them

#### Scenario: Order public experience entries
- **WHEN** public experience entries are returned
- **THEN** the system orders them by display order and then reverse chronological start date for ties

#### Scenario: Public experience empty state
- **WHEN** no published experience entries exist
- **THEN** the public retrieval returns an empty list without exposing unpublished data

### Requirement: Manage experience entries in admin
The system SHALL provide an admin interface for listing, filtering, creating, editing, deleting, publishing, unpublishing, and reordering experience entries.

#### Scenario: Open experience admin route
- **WHEN** the owner opens `/admin/experience`
- **THEN** the system displays the experience management interface

#### Scenario: Navigate to experience management
- **WHEN** the owner uses admin navigation
- **THEN** the system provides an Experience destination alongside existing admin sections

#### Scenario: Display managed experience list
- **WHEN** managed experience entries load successfully
- **THEN** the system displays company, role, employment type, date range, current-role state, publication state, and display order for each entry

#### Scenario: Provide row actions
- **WHEN** an experience entry appears in the management list
- **THEN** the system provides Edit, Delete, Publish or Unpublish, and reorder actions for that entry

#### Scenario: Create and edit experience form
- **WHEN** the owner opens a new or edit experience form
- **THEN** the system allows editing company, role, location, employment type, start date, optional end date, current-role state, summary, display order, and publication state

#### Scenario: Disable end date for current role
- **WHEN** the owner marks an experience entry as current in the form
- **THEN** the form clears and disables end date entry before submission

#### Scenario: Confirm experience deletion
- **WHEN** the owner selects Delete for an experience entry
- **THEN** the system displays a confirmation dialog naming the company and role that will be permanently deleted

#### Scenario: Preserve entry when deletion fails
- **WHEN** deletion fails
- **THEN** the system keeps the entry visible and displays the API error

### Requirement: Maintain experience server state after mutations
The system SHALL keep experience admin and public views consistent with server state after create, update, delete, publish, unpublish, and reorder operations.

#### Scenario: Prevent duplicate submissions
- **WHEN** an experience mutation is pending
- **THEN** the system prevents duplicate submissions for that pending mutation

#### Scenario: Refresh after create or update
- **WHEN** an experience entry is created or updated successfully
- **THEN** the system refreshes experience list and detail state so updated values appear in relevant views

#### Scenario: Refresh after delete
- **WHEN** an experience entry is deleted successfully
- **THEN** the system refreshes experience list state so the deleted entry no longer appears

#### Scenario: Refresh after reorder
- **WHEN** experience entries are reordered successfully
- **THEN** the system refreshes managed and public experience list state so the new order appears

### Requirement: Support responsive and accessible experience management
The system SHALL make experience admin list, forms, dialogs, reorder controls, validation messages, loading states, empty states, errors, and retry actions usable across desktop, mobile, and keyboard interaction.

#### Scenario: Desktop experience admin layout
- **WHEN** the experience management list is viewed on desktop-sized screens
- **THEN** the system presents entries in a compact layout suitable for scanning and reordering

#### Scenario: Mobile experience admin layout
- **WHEN** the experience management list is viewed on mobile-sized screens
- **THEN** the system presents entries in a readable stacked layout without horizontal scrolling

#### Scenario: Keyboard accessible management
- **WHEN** the owner uses keyboard navigation
- **THEN** forms, dialogs, toggles, retry actions, edit actions, delete actions, publish actions, and reorder actions are reachable and operable

#### Scenario: Accessible validation and errors
- **WHEN** validation or API errors are displayed
- **THEN** the system exposes them in a way that can be associated with the relevant form or action

### Requirement: Report experience states consistently
The system SHALL provide loading, empty, error, validation, confirmation, and retry states for experience management and public experience retrieval.

#### Scenario: Show loading state
- **WHEN** experience data is loading
- **THEN** the system displays a loading state without stale empty or error messaging

#### Scenario: Show empty state
- **WHEN** experience retrieval succeeds and no relevant entries exist
- **THEN** the system displays an appropriate empty state

#### Scenario: Show error and retry state
- **WHEN** experience retrieval fails
- **THEN** the system displays the error and provides a retry action

#### Scenario: Show validation state
- **WHEN** experience submission fails client-side or API validation
- **THEN** the system displays actionable validation feedback and keeps the submitted form data available for correction
