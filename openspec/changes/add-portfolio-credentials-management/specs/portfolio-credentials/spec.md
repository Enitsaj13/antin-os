## Purpose

Portfolio credentials management lets AntinOS maintain education and certification records while controlling whether each credential section is visible on the public portfolio.

## ADDED Requirements

### Requirement: Store education records
The system SHALL store education records with institution, credential or degree, field of study, location, optional start date, optional end date, summary, display order, publication state, and timestamps.

#### Scenario: Persist education record
- **WHEN** an authenticated owner creates a valid education record
- **THEN** the system stores the education data with an id and timestamps

#### Scenario: Default education to unpublished
- **WHEN** an authenticated owner creates an education record without an explicit publication state
- **THEN** the system stores the record as unpublished

#### Scenario: Preserve education publication state
- **WHEN** public education section visibility is disabled and later re-enabled
- **THEN** the system preserves existing education records and their individual publication states

### Requirement: Store certification records
The system SHALL store certification records with name, issuer, optional issue date, optional expiration date, optional credential id, optional credential URL, summary, display order, publication state, and timestamps.

#### Scenario: Persist certification record
- **WHEN** an authenticated owner creates a valid certification record
- **THEN** the system stores the certification data with an id and timestamps

#### Scenario: Default certification to unpublished
- **WHEN** an authenticated owner creates a certification record without an explicit publication state
- **THEN** the system stores the record as unpublished

#### Scenario: Preserve certification publication state
- **WHEN** public certification section visibility is disabled and later re-enabled
- **THEN** the system preserves existing certification records and their individual publication states

### Requirement: Store portfolio credential visibility settings
The system SHALL persist singleton portfolio settings with separate `showEducation` and `showCertifications` public-section visibility fields that both default to `false`.

#### Scenario: Create default settings
- **WHEN** portfolio settings are first requested and no settings record exists
- **THEN** the system creates or returns singleton settings with education and certification visibility disabled

#### Scenario: Persist visibility changes
- **WHEN** an authenticated owner changes education or certification public-section visibility
- **THEN** the system persists the updated visibility setting in PostgreSQL

#### Scenario: Preserve entries when toggling sections
- **WHEN** an authenticated owner disables or re-enables a public credentials section
- **THEN** the system does not create, delete, publish, or unpublish any education or certification records

### Requirement: Validate credential data
The system SHALL reject invalid education, certification, and visibility-setting requests before changing stored state.

#### Scenario: Reject missing education fields
- **WHEN** an education create or update request omits required institution, credential or degree, display order, or publication state
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject missing certification fields
- **WHEN** a certification create or update request omits required name, issuer, display order, or publication state
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject invalid credential URLs
- **WHEN** a certification request includes a credential URL that is not a valid URL
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject invalid display order
- **WHEN** an education, certification, or reorder request provides a non-integer or negative display order
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject invalid date range
- **WHEN** an education or certification request provides an end or expiration date before its start or issue date
- **THEN** the system rejects the request with a validation error

### Requirement: Manage credentials through protected APIs
The system SHALL provide owner-authenticated APIs to create, list, read, update, delete, publish, unpublish, and reorder education and certification records.

#### Scenario: List managed credentials
- **WHEN** an authenticated owner requests managed education or certification records
- **THEN** the system returns all records of that type regardless of public-section visibility or publication state

#### Scenario: Read managed credential
- **WHEN** an authenticated owner requests a specific existing education or certification record
- **THEN** the system returns the record regardless of public-section visibility or publication state

#### Scenario: Create managed credential
- **WHEN** an authenticated owner submits valid education or certification data
- **THEN** the system creates the requested credential record and returns it

#### Scenario: Update managed credential
- **WHEN** an authenticated owner submits a valid update for an existing education or certification record
- **THEN** the system persists the changes and returns the updated record

#### Scenario: Delete managed credential
- **WHEN** an authenticated owner confirms deletion of an existing education or certification record
- **THEN** the system removes the record so it no longer appears in managed or public retrieval

#### Scenario: Reorder managed credentials
- **WHEN** an authenticated owner submits a valid ordered list of education or certification ids
- **THEN** the system updates display order so subsequent managed and public retrieval reflect the requested order

#### Scenario: Reject unauthenticated credential management
- **WHEN** a request without valid owner authentication calls a credentials management API
- **THEN** the system returns HTTP 401 without performing the management operation

### Requirement: Manage credential visibility in admin
The system SHALL provide a credentials admin interface that includes separate public-section toggles for education and certifications before the credential lists and forms.

#### Scenario: Open credentials admin route
- **WHEN** the authenticated owner opens `/admin/credentials`
- **THEN** the system displays education and certification visibility controls plus credential management interfaces

#### Scenario: Explain visibility behavior
- **WHEN** the credentials admin page displays public-section toggles
- **THEN** the page explains that disabling a section hides it publicly without deleting entries

#### Scenario: Update education visibility
- **WHEN** the authenticated owner changes the Show Education on public portfolio toggle
- **THEN** the system updates only education section visibility and shows success or error feedback

#### Scenario: Update certification visibility
- **WHEN** the authenticated owner changes the Show Certifications on public portfolio toggle
- **THEN** the system updates only certification section visibility and shows success or error feedback

#### Scenario: Prevent duplicate visibility updates
- **WHEN** a visibility-setting update is pending
- **THEN** the system prevents duplicate toggle requests for the pending update

#### Scenario: Keep management accessible when hidden publicly
- **WHEN** education or certifications are disabled for public display
- **THEN** the authenticated owner can still create, edit, delete, publish, unpublish, and reorder records for the disabled section

### Requirement: Expose public education records conditionally
The system SHALL expose education records through public retrieval only when the education section is enabled and records are individually published.

#### Scenario: Hide education when section disabled
- **WHEN** `showEducation` is false
- **THEN** public education retrieval returns no education records

#### Scenario: Hide unpublished education when section enabled
- **WHEN** `showEducation` is true and education records exist but none are published
- **THEN** public education retrieval returns an empty list

#### Scenario: Return published education when section enabled
- **WHEN** `showEducation` is true and published education records exist
- **THEN** public education retrieval returns only the published education records

#### Scenario: Preserve unpublished education privacy
- **WHEN** public education retrieval returns records
- **THEN** unpublished education records are omitted from the response

#### Scenario: Order public education
- **WHEN** public education records are returned
- **THEN** the system orders them by display order and then reverse chronological date for ties

### Requirement: Expose public certification records conditionally
The system SHALL expose certification records through public retrieval only when the certification section is enabled and records are individually published.

#### Scenario: Hide certifications when section disabled
- **WHEN** `showCertifications` is false
- **THEN** public certification retrieval returns no certification records

#### Scenario: Hide unpublished certifications when section enabled
- **WHEN** `showCertifications` is true and certification records exist but none are published
- **THEN** public certification retrieval returns an empty list

#### Scenario: Return published certifications when section enabled
- **WHEN** `showCertifications` is true and published certification records exist
- **THEN** public certification retrieval returns only the published certification records

#### Scenario: Preserve unpublished certification privacy
- **WHEN** public certification retrieval returns records
- **THEN** unpublished certification records are omitted from the response

#### Scenario: Order public certifications
- **WHEN** public certification records are returned
- **THEN** the system orders them by display order and then reverse chronological issue date for ties

### Requirement: Report credential states consistently
The system SHALL provide loading, empty, error, validation, confirmation, retry, and success states for credentials management, visibility settings, and public credential retrieval.

#### Scenario: Show loading state
- **WHEN** credential data or settings are loading
- **THEN** the system displays a loading state without showing stale empty or error messaging

#### Scenario: Show empty state
- **WHEN** credential retrieval succeeds and no relevant records exist
- **THEN** the system displays an appropriate empty state

#### Scenario: Show error and retry state
- **WHEN** credential or settings retrieval fails
- **THEN** the system displays the error and provides a retry action

#### Scenario: Show validation state
- **WHEN** credential submission fails client-side or API validation
- **THEN** the system displays actionable validation feedback and keeps submitted form data available for correction

#### Scenario: Confirm destructive actions
- **WHEN** the authenticated owner chooses to delete an education or certification record
- **THEN** the system requires confirmation that identifies the record that will be permanently deleted

### Requirement: Support responsive and accessible credential management
The system SHALL make credentials admin lists, forms, dialogs, toggles, validation messages, loading states, empty states, errors, and retry actions usable across desktop, mobile, and keyboard interaction.

#### Scenario: Desktop credentials admin layout
- **WHEN** the credentials management page is viewed on desktop-sized screens
- **THEN** the system presents settings, education, and certification controls in a compact scannable layout

#### Scenario: Mobile credentials admin layout
- **WHEN** the credentials management page is viewed on mobile-sized screens
- **THEN** the system presents the same controls in a readable stacked layout without horizontal scrolling

#### Scenario: Keyboard accessible credentials management
- **WHEN** the owner uses keyboard navigation
- **THEN** toggles, forms, dialogs, retry actions, edit actions, delete actions, publish actions, and reorder actions are reachable and operable

#### Scenario: Accessible feedback
- **WHEN** success, validation, or API error feedback is displayed
- **THEN** the system exposes the feedback in a way that can be associated with the relevant setting, form, or action
