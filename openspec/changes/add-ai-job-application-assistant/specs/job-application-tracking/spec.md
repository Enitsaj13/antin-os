## MODIFIED Requirements

### Requirement: Job application records

The system SHALL store each job application with a unique identifier, company, position, optional job URL, optional source, optional salary range, optional job description, optional notes, status, optional application date, optional interview date, optional next-action date, optional follow-up notes, and created and updated timestamps. Supported statuses SHALL be `saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, and `withdrawn`. A newly created job application SHALL default to `saved` when no status is supplied. The owner SHALL be able to clear optional values explicitly. Changing a status SHALL NOT infer, set, or clear any date automatically.

#### Scenario: Create a minimal saved application

- **WHEN** the authenticated owner creates an application with only a company and position
- **THEN** the system stores the application with status `saved`
- **AND** all optional fields, including the job description, remain empty

#### Scenario: Create a complete application

- **WHEN** the authenticated owner provides all supported job-application fields with valid values, including a job description
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

The job-application API SHALL remain authoritative for validation. It SHALL reject a blank or whitespace-only company or position, an unsupported status, a job URL that is not an absolute HTTP or HTTPS URL, an invalid date value, a job description or other text field that exceeds its supported maximum length, and an update containing no fields. Text values SHALL be trimmed before storage, while optional blank text values, including the job description, SHALL be treated as explicitly cleared values.

#### Scenario: Reject missing required text

- **WHEN** a create or update request supplies a blank or whitespace-only company or position
- **THEN** the API rejects the request with a validation error

#### Scenario: Reject an unsupported status

- **WHEN** a request supplies a status outside the supported status set
- **THEN** the API rejects the request with a validation error

#### Scenario: Reject an invalid job URL

- **WHEN** a request supplies a job URL that is not an absolute HTTP or HTTPS URL
- **THEN** the API rejects the request with a validation error

#### Scenario: Reject an oversized job description

- **WHEN** a request supplies a job description beyond the supported maximum length
- **THEN** the API rejects the request with a validation error
- **AND** does not truncate or store a partial description

#### Scenario: Reject an empty update

- **WHEN** the authenticated owner submits an update with no fields
- **THEN** the API rejects the request with a validation error

### Requirement: Private table view

The admin interface SHALL provide a protected table view for job applications. On desktop it SHALL use a compact table, and on smaller screens it SHALL use a readable stacked presentation without page-level horizontal overflow. The view SHALL show company, position, status, source, salary range, relevant dates, and updated date without rendering complete job descriptions in the table. It SHALL support status filtering and text search across the existing searchable fields and job descriptions and SHALL provide loading, empty, error, and retry states.

#### Scenario: Review applications on desktop

- **WHEN** the authenticated owner opens the table view on a desktop viewport
- **THEN** applications are presented in a compact table with the required fields and management actions
- **AND** complete job descriptions are not expanded into table rows

#### Scenario: Review applications on mobile

- **WHEN** the authenticated owner opens the table view on a mobile viewport
- **THEN** applications are presented as readable stacked entries
- **AND** no application content causes page-level horizontal scrolling

#### Scenario: Filter and search applications

- **WHEN** the authenticated owner selects a status filter or enters search text matching an existing searchable field or job description
- **THEN** the view displays only applications matching the active criteria

#### Scenario: Recover from a table loading error

- **WHEN** loading applications fails
- **THEN** the view displays an application-safe error and retry action
- **AND** retrying requests the data again

### Requirement: Public portfolio isolation

No public endpoint, route, page, metadata payload, or public portfolio response SHALL expose job applications, job-application counts, job descriptions, follow-up notes, interview dates, next actions, salary information, or any other job-hunt data. Existing public profile, project, experience, credential, resume, and case-study behavior SHALL remain unchanged.

#### Scenario: Request existing public APIs

- **WHEN** any visitor requests an existing public portfolio API
- **THEN** the response contains no job-application data, job description, or job-application metadata

#### Scenario: Visit public portfolio pages

- **WHEN** any visitor opens a public portfolio page
- **THEN** no job-application view, count, status, description, note, or navigation item is rendered

#### Scenario: Probe for a public job-application route

- **WHEN** an unauthenticated visitor attempts to access job-application data through a public route
- **THEN** the system does not expose whether any job applications or job descriptions exist
