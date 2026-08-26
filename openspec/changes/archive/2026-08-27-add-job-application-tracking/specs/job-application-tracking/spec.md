## Purpose

Provide the authenticated portfolio owner with a private workspace to record, organize, and follow job applications without exposing sensitive job-search data through public portfolio surfaces.

## ADDED Requirements

### Requirement: Job application records

The system SHALL store each job application with a unique identifier, company, position, optional job URL, optional source, optional salary range, optional notes, status, optional application date, optional interview date, optional next-action date, optional follow-up notes, and created and updated timestamps. Supported statuses SHALL be `saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, and `withdrawn`. A newly created job application SHALL default to `saved` when no status is supplied. The owner SHALL be able to clear optional values explicitly. Changing a status SHALL NOT infer, set, or clear any date automatically.

#### Scenario: Create a minimal saved application

- **WHEN** the authenticated owner creates an application with only a company and position
- **THEN** the system stores the application with status `saved`
- **AND** all optional fields remain empty

#### Scenario: Create a complete application

- **WHEN** the authenticated owner provides all supported job-application fields with valid values
- **THEN** the system stores and returns those values without changing their meaning

#### Scenario: Clear an optional value

- **WHEN** the authenticated owner explicitly clears an optional field on an existing application
- **THEN** the system stores that field as empty
- **AND** preserves all unrelated fields

#### Scenario: Change status without changing dates

- **WHEN** the authenticated owner changes an application's status
- **THEN** the system updates the status
- **AND** leaves the application, interview, and next-action dates unchanged

### Requirement: Job application validation

The job-application API SHALL remain authoritative for validation. It SHALL reject a blank or whitespace-only company or position, an unsupported status, a job URL that is not an absolute HTTP or HTTPS URL, an invalid date value, and an update containing no fields. Text values SHALL be trimmed before storage, while optional blank text values SHALL be treated as explicitly cleared values.

#### Scenario: Reject missing required text

- **WHEN** a create or update request supplies a blank or whitespace-only company or position
- **THEN** the API rejects the request with a validation error

#### Scenario: Reject an unsupported status

- **WHEN** a request supplies a status outside the supported status set
- **THEN** the API rejects the request with a validation error

#### Scenario: Reject an invalid job URL

- **WHEN** a request supplies a job URL that is not an absolute HTTP or HTTPS URL
- **THEN** the API rejects the request with a validation error

#### Scenario: Reject an empty update

- **WHEN** the authenticated owner submits an update with no fields
- **THEN** the API rejects the request with a validation error

### Requirement: Authenticated private job application API

Every endpoint that lists, reads, creates, updates, deletes, or summarizes job applications MUST require a valid authenticated owner session. A missing or invalid session SHALL receive HTTP 401. A request for a job application that does not exist SHALL receive HTTP 404. Job-application data SHALL NOT be available from any public API route.

#### Scenario: Reject an unauthenticated management request

- **WHEN** a request without a valid owner session calls any job-application management or dashboard endpoint
- **THEN** the API returns HTTP 401
- **AND** does not disclose job-application data

#### Scenario: Manage applications as the authenticated owner

- **WHEN** the authenticated owner creates, reads, updates, or deletes a job application
- **THEN** the API performs the requested operation and returns the resulting private data

#### Scenario: Request a missing application

- **WHEN** the authenticated owner requests or mutates a job application identifier that does not exist
- **THEN** the API returns HTTP 404

### Requirement: Private table view

The admin interface SHALL provide a protected table view for job applications. On desktop it SHALL use a compact table, and on smaller screens it SHALL use a readable stacked presentation without page-level horizontal overflow. The view SHALL show company, position, status, source, salary range, relevant dates, and updated date. It SHALL support status filtering and text search and SHALL provide loading, empty, error, and retry states.

#### Scenario: Review applications on desktop

- **WHEN** the authenticated owner opens the table view on a desktop viewport
- **THEN** applications are presented in a compact table with the required fields and management actions

#### Scenario: Review applications on mobile

- **WHEN** the authenticated owner opens the table view on a mobile viewport
- **THEN** applications are presented as readable stacked entries
- **AND** no application content causes page-level horizontal scrolling

#### Scenario: Filter and search applications

- **WHEN** the authenticated owner selects a status filter or enters search text
- **THEN** the view displays only applications matching the active criteria

#### Scenario: Recover from a table loading error

- **WHEN** loading applications fails
- **THEN** the view displays an application-safe error and retry action
- **AND** retrying requests the data again

### Requirement: Private Kanban view

The admin interface SHALL provide a protected Kanban view that groups applications into the supported status columns. The owner SHALL be able to change an application's status from the Kanban view using keyboard-accessible controls. A failed status update SHALL keep the application in its last confirmed status and display the API error without losing the application.

#### Scenario: Group applications by status

- **WHEN** the authenticated owner opens the Kanban view
- **THEN** each application appears in the column matching its current status

#### Scenario: Change status from the Kanban view

- **WHEN** the authenticated owner selects a different status for an application
- **THEN** the system persists the new status
- **AND** moves the application to the matching column after success

#### Scenario: Preserve status after a failed update

- **WHEN** a Kanban status update fails
- **THEN** the application remains in its last confirmed status column
- **AND** the interface displays the API error and permits retry

### Requirement: Dashboard counts and application progress

The system SHALL provide an authenticated dashboard summary containing the total number of job applications and a count for every supported status. Application progress SHALL be represented by the status distribution and pipeline counts rather than an inferred performance score. The summary SHALL reflect successful creates, updates, status changes, and deletions.

#### Scenario: Display populated dashboard counts

- **WHEN** the authenticated owner opens the dashboard with existing applications
- **THEN** the dashboard displays the total and accurate per-status counts
- **AND** presents application progress from those counts

#### Scenario: Display an empty dashboard

- **WHEN** no job applications exist
- **THEN** the dashboard displays zero for the total and every status
- **AND** provides an empty state without fabricating progress

#### Scenario: Refresh counts after a mutation

- **WHEN** a job application is successfully created, updated, moved to another status, or deleted
- **THEN** the dashboard summary refreshes to reflect the confirmed server state

### Requirement: Server-state consistency

After a successful job-application mutation, the table, Kanban, detail, edit, and dashboard views SHALL reflect the confirmed server state. The interface SHALL prevent duplicate submissions while a mutation is pending. When a create or update request fails, entered form values SHALL remain available for correction and retry.

#### Scenario: Prevent a duplicate submission

- **WHEN** a create, update, status-change, or delete request is pending
- **THEN** the initiating action is disabled until that request completes

#### Scenario: Preserve form input after failure

- **WHEN** a create or update request fails
- **THEN** the interface displays the API error
- **AND** retains the owner's entered values

#### Scenario: Synchronize views after success

- **WHEN** a mutation succeeds
- **THEN** all affected job-application and dashboard views refresh from confirmed server data

### Requirement: Accessible CRUD workflows

The protected admin interface SHALL provide create and edit workflows for all supported fields and a permanent deletion workflow. Deletion SHALL require confirmation that identifies the company and position. Forms, status controls, errors, confirmations, table actions, Kanban actions, and retry controls SHALL be keyboard accessible and expose meaningful labels to assistive technology.

#### Scenario: Create and edit with a keyboard

- **WHEN** the authenticated owner uses only a keyboard to create or edit an application
- **THEN** every field and action is reachable and operable
- **AND** validation errors are associated with the relevant fields

#### Scenario: Confirm permanent deletion

- **WHEN** the authenticated owner chooses to delete an application
- **THEN** the interface asks for confirmation and identifies its company and position
- **AND** deletion occurs only after confirmation

#### Scenario: Keep an application when deletion fails

- **WHEN** a confirmed deletion request fails
- **THEN** the application remains available in management views
- **AND** the interface displays the API error and permits retry

### Requirement: Public portfolio isolation

No public endpoint, route, page, metadata payload, or public portfolio response SHALL expose job applications, job-application counts, follow-up notes, interview dates, next actions, salary information, or any other job-hunt data. Existing public profile, project, experience, credential, resume, and case-study behavior SHALL remain unchanged.

#### Scenario: Request existing public APIs

- **WHEN** any visitor requests an existing public portfolio API
- **THEN** the response contains no job-application data or job-application metadata

#### Scenario: Visit public portfolio pages

- **WHEN** any visitor opens a public portfolio page
- **THEN** no job-application view, count, status, note, or navigation item is rendered

#### Scenario: Probe for a public job-application route

- **WHEN** an unauthenticated visitor attempts to access job-application data through a public route
- **THEN** the system does not expose whether any job applications exist
