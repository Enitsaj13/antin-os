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

### Requirement: Navigate admin profile and projects management
The system SHALL provide an admin navigation surface that separates profile management from project management.

#### Scenario: Open profile admin route
- **WHEN** the owner opens `/admin/profile`
- **THEN** the system displays the existing profile management interface

#### Scenario: Open projects admin route
- **WHEN** the owner opens `/admin/projects`
- **THEN** the system displays the portfolio projects management interface

#### Scenario: Navigate between admin sections
- **WHEN** the owner uses admin navigation
- **THEN** the system provides Profile and Projects destinations that navigate to `/admin/profile` and `/admin/projects`

### Requirement: List and filter managed projects
The system SHALL provide a projects management list that supports scanning, filtering, and recovery from load failures.

#### Scenario: Display project rows
- **WHEN** managed projects load successfully
- **THEN** the system displays each project's title, slug, tech stack, publication state, and updated date

#### Scenario: Provide row actions
- **WHEN** a project appears in the management list
- **THEN** the system provides Edit and Delete actions for that project

#### Scenario: Show loading state
- **WHEN** the projects list is loading
- **THEN** the system displays a loading state without showing stale error or empty-state messaging

#### Scenario: Show empty state
- **WHEN** the projects list loads successfully and contains no projects for the selected filter
- **THEN** the system displays an empty state explaining that no matching projects are available

#### Scenario: Show error and retry state
- **WHEN** loading the projects list fails
- **THEN** the system displays the load error and provides a retry action

#### Scenario: Filter projects by publication state
- **WHEN** the owner switches between all, public, and unpublished filters
- **THEN** the system displays only projects matching the selected publication-state filter

### Requirement: Create and edit projects in admin
The system SHALL provide admin project forms for creating new projects and editing existing projects.

#### Scenario: Open new project route
- **WHEN** the owner opens `/admin/projects/new`
- **THEN** the system displays an empty project form for creating a portfolio project

#### Scenario: Open edit project route
- **WHEN** the owner opens `/admin/projects/:id/edit` for an existing project
- **THEN** the system displays a project form populated with that project's current values

#### Scenario: Capture editable project fields
- **WHEN** the project form is displayed
- **THEN** the system allows editing title, slug, summary, description, tech stack, repository URL, live URL, image URL, and publication state

#### Scenario: Suggest slug from title
- **WHEN** the owner enters a project title before manually changing the slug
- **THEN** the system suggests a lowercase kebab-case slug generated from the title

#### Scenario: Preserve manually changed slug
- **WHEN** the owner manually changes the slug
- **THEN** the system does not overwrite that manual slug with later title changes

#### Scenario: Default new project to private
- **WHEN** the owner creates a new project
- **THEN** the system defaults the project publication state to private

### Requirement: Validate project form input
The system SHALL provide client-side project form validation while preserving API validation as authoritative.

#### Scenario: Validate required fields
- **WHEN** the owner submits a project form without title, slug, summary, or at least one tech stack entry
- **THEN** the system prevents duplicate submission and displays field-level validation errors

#### Scenario: Validate slug format
- **WHEN** the owner submits a project form with a slug that is not lowercase kebab-case
- **THEN** the system displays a slug validation error before relying on the API response

#### Scenario: Validate URL fields
- **WHEN** the owner submits repository URL, live URL, or image URL in an invalid URL format
- **THEN** the system displays URL validation errors before relying on the API response

#### Scenario: Validate tech stack entries
- **WHEN** the owner submits tech stack entries that are empty after trimming whitespace
- **THEN** the system displays a tech stack validation error

#### Scenario: Display API validation errors
- **WHEN** the API rejects a project create or update request with validation errors
- **THEN** the system displays the API error and keeps the owner on the project form

#### Scenario: Display duplicate slug conflict
- **WHEN** the API rejects a project create or update request because the slug is already used by another project
- **THEN** the system clearly identifies the duplicate-slug conflict

### Requirement: Manage project publication in admin
The system SHALL make project publication state explicit and warn before publishing incomplete project information.

#### Scenario: Toggle publication state
- **WHEN** the project form is displayed
- **THEN** the system provides a clear public/private toggle for publication state

#### Scenario: Warn before publishing incomplete project
- **WHEN** the owner attempts to save a project as public while optional project information is incomplete
- **THEN** the system warns before submitting the public project save

#### Scenario: Save private project without publication warning
- **WHEN** the owner saves a project as private
- **THEN** the system does not require a publication warning confirmation

### Requirement: Delete projects safely in admin
The system SHALL require confirmation before permanent project deletion and preserve projects when deletion fails.

#### Scenario: Confirm project deletion
- **WHEN** the owner selects Delete for a project
- **THEN** the system displays a confirmation dialog naming the project that will be permanently deleted

#### Scenario: Cancel project deletion
- **WHEN** the owner cancels the deletion confirmation
- **THEN** the system keeps the project unchanged and does not call the delete behavior

#### Scenario: Delete project after confirmation
- **WHEN** the owner confirms deletion and the API succeeds
- **THEN** the system removes the project from the management list

#### Scenario: Preserve project when deletion fails
- **WHEN** the owner confirms deletion and the API returns an error
- **THEN** the system keeps the project visible and displays the API error

### Requirement: Maintain project server state after admin mutations
The system SHALL keep project management views consistent with server state after create, update, and delete operations.

#### Scenario: Prevent duplicate submissions
- **WHEN** a project create, update, or delete mutation is pending
- **THEN** the system prevents duplicate submissions for that pending mutation

#### Scenario: Refresh project queries after create
- **WHEN** a project is created successfully
- **THEN** the system refreshes project list state so the new project appears in management views

#### Scenario: Refresh project queries after update
- **WHEN** a project is updated successfully
- **THEN** the system refreshes project list and detail state so updated project values appear in management views

#### Scenario: Refresh project queries after delete
- **WHEN** a project is deleted successfully
- **THEN** the system refreshes project list and detail state so the deleted project no longer appears as editable content

### Requirement: Support responsive and accessible project admin behavior
The system SHALL make project admin list, form, dialog, toggle, and error experiences usable across desktop, mobile, and keyboard interaction.

#### Scenario: Desktop project list layout
- **WHEN** the projects management list is viewed on desktop-sized screens
- **THEN** the system presents projects in a compact table layout

#### Scenario: Mobile project list layout
- **WHEN** the projects management list is viewed on mobile-sized screens
- **THEN** the system presents projects in a readable stacked layout

#### Scenario: Keyboard accessible controls
- **WHEN** the owner uses keyboard navigation
- **THEN** project forms, dialogs, toggles, filters, retry actions, edit actions, delete actions, and validation errors are reachable and operable

#### Scenario: Accessible error feedback
- **WHEN** validation or API errors are displayed
- **THEN** the system exposes the errors in a way that can be associated with the relevant form or action

### Requirement: Browse public portfolio projects
The system SHALL provide a public portfolio projects listing page that displays only projects returned by the public projects API.

#### Scenario: Open public projects route
- **WHEN** a visitor opens `/projects`
- **THEN** the system displays the public portfolio projects listing experience

#### Scenario: Load public projects from public endpoint
- **WHEN** the public projects listing loads
- **THEN** the system requests project data from `GET /public/projects`

#### Scenario: Display public project summaries
- **WHEN** public projects load successfully
- **THEN** the system displays each project's title, summary, image when present, tech stack, and a link to that project's public detail page

#### Scenario: Hide unpublished projects from public listing
- **WHEN** unpublished projects exist in the management API
- **THEN** the public projects listing does not display them unless they are returned by `GET /public/projects`

#### Scenario: Show empty public projects state
- **WHEN** `GET /public/projects` returns an empty project list
- **THEN** the system displays an empty state indicating that no public projects are available

#### Scenario: Show public projects loading state
- **WHEN** the public projects listing is waiting for API data
- **THEN** the system displays a loading state without showing empty or error messaging

#### Scenario: Show public projects API error state
- **WHEN** `GET /public/projects` fails
- **THEN** the system displays an API-error state with a retry action

### Requirement: View public portfolio project detail
The system SHALL provide a public project detail page that displays a published project's complete public information.

#### Scenario: Open public project detail route
- **WHEN** a visitor opens `/projects/:slug`
- **THEN** the system displays the public project detail experience for the requested slug

#### Scenario: Load public project detail from public endpoint
- **WHEN** the public project detail page loads for a slug
- **THEN** the system requests project data from `GET /public/projects/:slug`

#### Scenario: Display public project detail fields
- **WHEN** a public project detail request succeeds
- **THEN** the system displays the project's title, summary, image when present, tech stack, description when present, repository link when present, and live-demo link when present

#### Scenario: Hide unpublished projects from public detail
- **WHEN** a visitor requests a slug for an unpublished project
- **THEN** the public detail page displays a not-found state based on the public API response instead of exposing unpublished project data

#### Scenario: Show public project detail loading state
- **WHEN** the public project detail page is waiting for API data
- **THEN** the system displays a loading state without showing stale project, not-found, or error messaging

#### Scenario: Show public project not-found state
- **WHEN** `GET /public/projects/:slug` returns a not-found response
- **THEN** the system displays a not-found state and a link back to `/projects`

#### Scenario: Show public project detail API error state
- **WHEN** `GET /public/projects/:slug` fails for a reason other than not found
- **THEN** the system displays an API-error state with a retry action

### Requirement: Support responsive and accessible public project pages
The system SHALL make public project listing and detail pages usable across desktop, mobile, and keyboard interaction.

#### Scenario: Responsive public project listing
- **WHEN** the public projects listing is viewed on desktop or mobile viewports
- **THEN** the system presents project summaries in a layout that remains readable without horizontal scrolling

#### Scenario: Responsive public project detail
- **WHEN** a public project detail page is viewed on desktop or mobile viewports
- **THEN** the system presents project details and links in a layout that remains readable without horizontal scrolling

#### Scenario: Accessible public project links
- **WHEN** a visitor navigates public project pages by keyboard or assistive technology
- **THEN** project detail links, repository links, live-demo links, retry actions, and back-navigation links have clear accessible names and are keyboard operable

#### Scenario: Accessible public project status feedback
- **WHEN** loading, empty, not-found, or API-error states are displayed
- **THEN** the system exposes the state through appropriate status or alert semantics

### Requirement: Require owner authentication for project management
The system SHALL require owner authentication for all portfolio project management behavior while keeping public project retrieval unauthenticated.

#### Scenario: Reject unauthenticated project creation
- **WHEN** `POST /projects` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not create a portfolio project

#### Scenario: Reject unauthenticated managed project listing
- **WHEN** `GET /projects` is requested without valid owner authentication
- **THEN** the system returns HTTP 401

#### Scenario: Reject unauthenticated managed project detail
- **WHEN** `GET /projects/:idOrSlug` is requested without valid owner authentication
- **THEN** the system returns HTTP 401

#### Scenario: Reject unauthenticated project update
- **WHEN** `PATCH /projects/:id` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not update the portfolio project

#### Scenario: Reject unauthenticated project deletion
- **WHEN** `DELETE /projects/:id` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not delete the portfolio project

#### Scenario: Reject unauthenticated project image upload setup
- **WHEN** `POST /projects/image-upload` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not create a project image upload URL

#### Scenario: Allow authenticated project management
- **WHEN** `POST /projects`, `GET /projects`, `GET /projects/:idOrSlug`, `PATCH /projects/:id`, `DELETE /projects/:id`, or `POST /projects/image-upload` is requested with valid owner authentication
- **THEN** the system allows the request to proceed to the existing project management behavior

#### Scenario: Keep public project APIs unauthenticated
- **WHEN** `GET /public/projects` or `GET /public/projects/:slug` is requested without owner authentication
- **THEN** the system allows the request to proceed to the existing public project behavior

