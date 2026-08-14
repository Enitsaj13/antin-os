## ADDED Requirements

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
