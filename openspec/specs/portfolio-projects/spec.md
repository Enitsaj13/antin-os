# portfolio-projects Specification

## Purpose

Portfolio project management lets Antin OS maintain curated project records and expose published entries for a public portfolio experience.

## Requirements

### Requirement: Manage portfolio projects
The system SHALL provide management behavior to create, list, read, update, and delete portfolio project records.

#### Scenario: Create a portfolio project
- **WHEN** `POST /projects` receives a valid project creation request with title, lowercase kebab-case slug, summary, tech stack, optional description, optional repository URL, optional live URL, optional image URL, and optional publication state
- **THEN** the system creates a project record and returns the stored project with id, timestamps, and all provided fields

#### Scenario: Default new project to unpublished
- **WHEN** `POST /projects` receives a valid project creation request without `isPublic`
- **THEN** the system creates the project with `isPublic` set to false

#### Scenario: List managed portfolio projects
- **WHEN** `GET /projects` is requested
- **THEN** the system returns all portfolio projects regardless of publication state

#### Scenario: Read a managed portfolio project
- **WHEN** `GET /projects/:idOrSlug` is requested with an id or slug assigned to a project
- **THEN** the system returns that project regardless of publication state

#### Scenario: Update a portfolio project
- **WHEN** `PATCH /projects/:id` receives a valid update request that changes one or more editable project fields
- **THEN** the system persists the changes and returns the updated project

#### Scenario: Clear optional fields
- **WHEN** `PATCH /projects/:id` receives `null` for description, repository URL, live URL, or image URL
- **THEN** the system clears the provided optional field and returns the updated project

#### Scenario: Delete a portfolio project
- **WHEN** `DELETE /projects/:id` is requested for an existing project
- **THEN** the system removes the project so it no longer appears in managed or public project retrieval

### Requirement: Validate project data
The system SHALL reject invalid project data before creating or updating portfolio projects.

#### Scenario: Reject missing required fields
- **WHEN** a create request omits title, slug, summary, or tech stack
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject whitespace-only required text
- **WHEN** a create or update request provides a title, slug, or summary value that is empty after trimming whitespace
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject non-kebab-case slug
- **WHEN** a create or update request provides a slug that is not lowercase kebab-case
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject duplicate slug
- **WHEN** a create or update request would use a slug already assigned to a different project
- **THEN** the system rejects the request with a conflict error

#### Scenario: Reject invalid URLs
- **WHEN** repository URL, live URL, or image URL is provided in an invalid URL format
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject invalid tech stack
- **WHEN** a create or update request provides an empty tech stack, non-text tech stack entries, or tech stack entries that are empty after trimming whitespace
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject empty update
- **WHEN** `PATCH /projects/:id` receives an update request without any editable fields
- **THEN** the system rejects the request with a validation error

### Requirement: Expose public portfolio projects
The system SHALL provide public retrieval behavior for published portfolio projects only.

#### Scenario: List public projects
- **WHEN** `GET /public/projects` is requested
- **THEN** the system returns only projects marked as public

#### Scenario: Read public project by slug
- **WHEN** `GET /public/projects/:slug` is requested with a lowercase kebab-case slug assigned to a public project
- **THEN** the system returns that project

#### Scenario: Hide unpublished project from public detail
- **WHEN** `GET /public/projects/:slug` is requested with a slug assigned to an unpublished project
- **THEN** the system responds as if no public project exists for that slug

#### Scenario: Hide unpublished project from public list
- **WHEN** `GET /public/projects` is requested and unpublished projects exist
- **THEN** the unpublished projects are omitted from the public response

### Requirement: Report missing projects consistently
The system SHALL report missing project records consistently for managed and public retrieval.

#### Scenario: Managed project not found
- **WHEN** `GET /projects/:idOrSlug`, `PATCH /projects/:id`, or `DELETE /projects/:id` references a project that does not exist
- **THEN** the system returns a not found error

#### Scenario: Public project not found
- **WHEN** `GET /public/projects/:slug` is requested with a slug that does not match a public project
- **THEN** the system returns a not found error
