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
- **AND** the projects are ordered by configured display order

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
- **THEN** the system displays each project's title, slug, tech stack, publication state, display order, and updated date

#### Scenario: Provide row actions
- **WHEN** a project appears in the management list
- **THEN** the system provides Edit, reorder, and Delete actions for that project

#### Scenario: Reorder managed projects
- **WHEN** the owner moves a project up or down in the management list
- **THEN** the system persists the requested display order and refreshes project list data

#### Scenario: Prevent duplicate reorder submissions
- **WHEN** a project reorder request is pending
- **THEN** the system disables reorder controls until the request completes

#### Scenario: Recover from reorder failure
- **WHEN** a project reorder request fails
- **THEN** the system keeps the projects visible and displays the API error

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

### Requirement: Store project case studies
The system SHALL support at most one optional case study for each portfolio project while preserving existing project records and behavior.

#### Scenario: Create case study as unpublished by default
- **WHEN** an authenticated owner creates a case study for an existing project without providing a publication state
- **THEN** the system stores the case study with `isPublic` set to false

#### Scenario: Store narrative and ordered entries
- **WHEN** a case study is created or updated with context, problem, role, approach, responsibilities, technical challenges, outcomes, and lessons learned
- **THEN** the system preserves the provided narrative fields and the order of responsibility, challenge, and outcome entries

#### Scenario: Clear optional case-study fields
- **WHEN** an authenticated owner updates a case study with explicit null or empty optional narrative values
- **THEN** the system clears those optional fields without deleting the case study

#### Scenario: Preserve project behavior without a case study
- **WHEN** a project has no associated case study
- **THEN** existing managed and public project create, read, update, delete, list, and publication behavior remains available

#### Scenario: Delete associated case study with project
- **WHEN** an authenticated owner deletes a project that has an associated case study
- **THEN** the system safely deletes the associated case study and the project no longer exposes that case study through managed or public retrieval

### Requirement: Manage project case studies through authenticated API behavior
The system SHALL provide authenticated behavior to create, read, update, publish, unpublish, and remove a case study for a portfolio project.

#### Scenario: Read missing case study
- **WHEN** an authenticated owner requests the case study for a project that exists but has no case study
- **THEN** the system returns an empty or not-found case-study state without creating one

#### Scenario: Create case study for existing project
- **WHEN** an authenticated owner creates a valid case study for an existing project that does not already have one
- **THEN** the system stores and returns the case study associated with that project

#### Scenario: Reject case study for missing project
- **WHEN** an authenticated owner attempts to create or read a case study for a project that does not exist
- **THEN** the system returns a not found error

#### Scenario: Reject duplicate case study
- **WHEN** an authenticated owner attempts to create a second case study for a project that already has one
- **THEN** the system rejects the request with a conflict error and preserves the existing case study

#### Scenario: Update existing case study
- **WHEN** an authenticated owner submits a valid update for an existing case study
- **THEN** the system persists the changed fields and returns the updated case study

#### Scenario: Publish case study
- **WHEN** an authenticated owner publishes an existing case study
- **THEN** the system sets the case study publication state to public without changing the project publication state

#### Scenario: Unpublish case study
- **WHEN** an authenticated owner unpublishes an existing case study
- **THEN** the system sets the case study publication state to private without changing the project publication state

#### Scenario: Remove case study
- **WHEN** an authenticated owner removes an existing case study
- **THEN** the system permanently deletes the case study while preserving the project record

#### Scenario: Reject unauthenticated case-study management
- **WHEN** project case-study management behavior is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not create, update, publish, unpublish, or delete case-study content

### Requirement: Validate project case-study data
The system SHALL reject invalid project case-study input consistently for create and update behavior.

#### Scenario: Reject missing required narrative fields
- **WHEN** a case-study create request omits required context, problem, role, or approach text
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject whitespace-only required text
- **WHEN** a case-study create or update request provides required narrative text that is empty after trimming whitespace
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject empty required ordered entries
- **WHEN** a case-study create or update request provides responsibility, challenge, or outcome entries that are empty after trimming whitespace
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject empty update
- **WHEN** a case-study update request contains no editable fields
- **THEN** the system rejects the request with a validation error

#### Scenario: Preserve ordered entry updates
- **WHEN** a case-study update reorders responsibilities, challenges, or outcomes
- **THEN** the system returns those entries in the submitted order

### Requirement: Manage case studies in the project edit workflow
The system SHALL add case-study management to the existing project edit workflow without redesigning unrelated admin interfaces.

#### Scenario: Show case-study status
- **WHEN** the owner opens the edit workflow for a project
- **THEN** the system indicates whether the project has no case study, a draft case study, or a published case study

#### Scenario: Show case-study loading state
- **WHEN** case-study data is loading in the project edit workflow
- **THEN** the system displays a loading state without replacing the project form with stale case-study content

#### Scenario: Show empty case-study state
- **WHEN** the project has no case study
- **THEN** the system presents an empty state with a path to create a draft case study

#### Scenario: Edit case-study fields
- **WHEN** a case-study form is displayed
- **THEN** the system allows editing context, problem, role, approach, responsibilities, technical challenges, outcomes, lessons learned, and publication state

#### Scenario: Manage repeatable entries
- **WHEN** the owner edits responsibilities, challenges, or outcomes
- **THEN** the system allows entries to be added, removed, and reordered while preserving keyboard operability

#### Scenario: Save case study as draft
- **WHEN** the owner saves valid case-study input without publishing
- **THEN** the system stores the case study as unpublished and shows success feedback

#### Scenario: Warn before publishing incomplete case study
- **WHEN** the owner attempts to publish a case study that lacks optional recruiter-facing detail
- **THEN** the system warns before submitting the publish action

#### Scenario: Publish from admin workflow
- **WHEN** the owner confirms publishing an existing case study
- **THEN** the system publishes the case study and refreshes project case-study state

#### Scenario: Unpublish from admin workflow
- **WHEN** the owner unpublishes an existing case study
- **THEN** the system unpublishes the case study and refreshes project case-study state

#### Scenario: Confirm case-study removal
- **WHEN** the owner chooses to remove a case study
- **THEN** the system displays a confirmation dialog before permanent removal

#### Scenario: Preserve input after API failure
- **WHEN** a case-study save, publish, unpublish, or removal operation fails
- **THEN** the system displays the API error, prevents duplicate pending submissions, and preserves current form input where the form still exists

#### Scenario: Retry case-study loading
- **WHEN** case-study loading fails in the project edit workflow
- **THEN** the system displays an accessible error state with a retry action

### Requirement: Expose project case studies publicly only when published
The system SHALL include case-study content in public project detail behavior only when both the project and associated case study are public.

#### Scenario: Include published case study on public project detail
- **WHEN** `GET /public/projects/:slug` is requested for a public project with a published case study
- **THEN** the response includes the case-study fields and ordered responsibility, challenge, and outcome entries

#### Scenario: Hide draft case study on public project detail
- **WHEN** `GET /public/projects/:slug` is requested for a public project with an unpublished case study
- **THEN** the response omits case-study content and does not reveal that a draft case study exists

#### Scenario: Hide case study for unpublished project
- **WHEN** a project is unpublished and has a published case study
- **THEN** public project retrieval responds as if no public project exists for that slug

#### Scenario: Preserve public project detail without case study
- **WHEN** `GET /public/projects/:slug` is requested for a public project without a published case study
- **THEN** the response continues to include the existing public project detail fields without case-study content

#### Scenario: Do not include case studies in public project list
- **WHEN** `GET /public/projects` is requested
- **THEN** the system does not expose draft case-study content or require case-study content for project listing behavior

### Requirement: Display public project case studies
The system SHALL display published case-study content on `/projects/:slug` in scannable, responsive, and accessible sections.

#### Scenario: Render published case-study sections
- **WHEN** a public project detail page receives published case-study content
- **THEN** the page displays scannable sections for context, problem, role, approach, responsibilities, challenges, outcomes, and lessons learned

#### Scenario: Keep basic detail page without case study
- **WHEN** a public project detail page receives no case-study content
- **THEN** the page displays the existing basic project detail experience without indicating that a draft case study may exist

#### Scenario: Preserve ordered public lists
- **WHEN** responsibilities, challenges, or outcomes are displayed publicly
- **THEN** the page presents each list in the order returned by the public project detail response

#### Scenario: Update project-detail metadata
- **WHEN** published case-study content is available for a public project detail page
- **THEN** route metadata uses available case-study content to strengthen the project-detail title or description without exposing unpublished content

#### Scenario: Support responsive case-study layout
- **WHEN** the public case-study detail is viewed on desktop or mobile screens
- **THEN** the page remains readable without text overflow or horizontal scrolling

#### Scenario: Support accessible case-study content
- **WHEN** a visitor uses keyboard navigation or assistive technology on a project detail page with case-study content
- **THEN** case-study sections, lists, links, loading states, not-found states, retry actions, and errors expose appropriate semantics and accessible names

### Requirement: Generate project case-study drafts with AI
The system SHALL provide authenticated project-scoped behavior that generates an editable case-study draft from an existing portfolio project and optional owner notes.

#### Scenario: Generate draft for existing project
- **WHEN** an authenticated owner requests an AI case-study draft for an existing project with optional notes
- **THEN** the system loads the managed project before generation and returns structured draft fields for context, problem, role, approach, responsibilities, technical challenges, outcomes, lessons learned, and needs-confirmation guidance

#### Scenario: Limit source data for generation
- **WHEN** the system prepares a project case-study draft request
- **THEN** it sends only required project fields and optional owner notes as source material and excludes profile contact details, authentication data, resume files, credentials, unrelated projects, secrets, and unrelated portfolio data

#### Scenario: Include confirmation guidance
- **WHEN** generated content contains claims, gaps, assumptions, metrics, responsibilities, or outcomes that are not directly supported by the project record or owner notes
- **THEN** the system identifies those items as needing owner confirmation instead of presenting them as verified facts

#### Scenario: Avoid unsupported claims
- **WHEN** project information and owner notes do not support a responsibility, metric, outcome, or business result
- **THEN** the generated draft omits the unsupported claim or marks the missing information for confirmation

#### Scenario: Enforce owner notes length
- **WHEN** the owner notes exceed the configured maximum notes length
- **THEN** the system rejects the draft-generation request with a validation error and does not call the AI provider

#### Scenario: Return normalized structured output
- **WHEN** the AI provider returns a draft response
- **THEN** the system validates and normalizes the response before returning only the supported case-study draft fields and needs-confirmation guidance

#### Scenario: Reject missing project
- **WHEN** an authenticated owner requests an AI case-study draft for a project that does not exist
- **THEN** the system returns a not found error and does not call the AI provider

#### Scenario: Reject unauthenticated drafting
- **WHEN** project case-study draft generation is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not call the AI provider

### Requirement: Keep AI draft generation non-persistent until manual acceptance
The system SHALL NOT automatically save, overwrite, publish, or expose generated case-study draft content.

#### Scenario: Return draft without saving
- **WHEN** the AI draft generation request succeeds
- **THEN** the system returns the generated draft without creating or updating a stored project case study

#### Scenario: Preserve existing case study during generation
- **WHEN** the selected project already has a case study and the owner generates an AI draft
- **THEN** the existing stored case study remains unchanged unless the owner later saves reviewed content through the normal case-study save behavior

#### Scenario: Save accepted draft as unpublished
- **WHEN** the owner manually accepts reviewed generated content and saves it as a case study
- **THEN** the system stores the case study with `isPublic` set to false unless the owner separately uses the existing publish behavior

#### Scenario: Publish separately
- **WHEN** the owner saves an accepted AI draft as an unpublished case study
- **THEN** the saved case study does not appear publicly until the owner performs a separate publish action

#### Scenario: Do not expose generated drafts publicly
- **WHEN** public project list or detail APIs are requested after draft generation but before an explicit save and publish
- **THEN** the public responses do not include generated draft content and do not reveal that AI drafting occurred

### Requirement: Protect AI provider credentials and drafting limits
The system SHALL keep AI provider access server-side and enforce safeguards for rate limits, usage limits, timeouts, and provider failures.

#### Scenario: Keep provider secrets server-side
- **WHEN** the admin web app requests or renders AI case-study drafting behavior
- **THEN** AI provider API keys, credentials, model identifiers, timeout values, usage-limit settings, and other private provider configuration are never sent to the browser

#### Scenario: Disable generation when drafting is off
- **WHEN** AI drafting is disabled by configuration
- **THEN** the system rejects draft-generation requests with an actionable disabled state and does not call the AI provider

#### Scenario: Reject missing provider configuration
- **WHEN** required server-side AI provider configuration is missing or inconsistent
- **THEN** the system rejects draft-generation requests with an actionable configuration state and does not call the AI provider

#### Scenario: Allow zero-cost mock mode
- **WHEN** the deployment is configured for mock AI drafting
- **THEN** authenticated draft-generation requests return deterministic structured draft content without calling an external AI provider

#### Scenario: Require structured provider responses
- **WHEN** the configured AI provider cannot return a strict structured response matching the case-study draft contract
- **THEN** the system rejects the generation attempt with a malformed-response or configuration error and does not fall back to unstructured text

#### Scenario: Rate-limit draft generation
- **WHEN** authenticated draft-generation requests exceed the configured rate limit
- **THEN** the system rejects additional requests with a rate-limit error and does not call the AI provider

#### Scenario: Enforce usage limits
- **WHEN** draft generation would exceed the configured usage limit for the owner or deployment
- **THEN** the system rejects the request with a usage-limit error and does not call the AI provider

#### Scenario: Handle provider timeout
- **WHEN** the AI provider does not return a draft before the configured timeout
- **THEN** the system returns a timeout error state and does not save any generated content

#### Scenario: Handle malformed provider response
- **WHEN** the AI provider returns malformed, incomplete, or unsupported structured data
- **THEN** the system returns a malformed-response state and does not save any generated content

#### Scenario: Handle provider failure
- **WHEN** the AI provider returns an error
- **THEN** the system returns a provider-error state without exposing provider secrets or raw provider internals and does not save any generated content

#### Scenario: Avoid sensitive logging
- **WHEN** the system handles AI draft generation, success, or failure
- **THEN** it does not log API keys, authorization headers, complete prompts, owner notes, raw AI provider responses, or provider secrets

#### Scenario: Keep public chatbot out of scope
- **WHEN** a public visitor opens public portfolio routes
- **THEN** the system does not expose an AI chatbot, public AI drafting entry point, or public AI provider interaction

### Requirement: Review and accept AI case-study drafts in admin
The system SHALL provide an authenticated admin review flow that lets the owner inspect and edit every generated field before saving it.

#### Scenario: Start draft flow from project management
- **WHEN** the authenticated owner opens project management
- **THEN** the system provides an AI case-study draft flow that starts by selecting an existing project

#### Scenario: Add optional owner notes
- **WHEN** the owner starts the AI draft flow for a selected project
- **THEN** the system allows optional notes to be provided as source material for generation

#### Scenario: Generate and review draft
- **WHEN** the owner submits the selected project and optional notes for generation
- **THEN** the system displays the generated draft in editable fields before any case-study save occurs

#### Scenario: Edit generated fields
- **WHEN** the generated draft is displayed
- **THEN** the owner can edit context, problem, role, approach, responsibilities, technical challenges, outcomes, lessons learned, and confirmation-needed information before accepting the draft

#### Scenario: Manually accept generated content
- **WHEN** the owner chooses to accept the reviewed draft
- **THEN** the system copies the reviewed draft into the case-study save workflow without publishing it automatically

#### Scenario: Warn before replacing unsaved form values
- **WHEN** accepting generated content would replace unsaved case-study form values
- **THEN** the admin UI warns the owner and requires confirmation before replacing the unsaved form values

#### Scenario: Cancel generated draft
- **WHEN** the owner cancels or leaves the AI draft review before saving
- **THEN** the system discards unsaved generated content without changing the stored case study

#### Scenario: Prevent duplicate generation requests
- **WHEN** an AI draft-generation request is pending
- **THEN** the admin UI prevents duplicate generation submissions for the same flow

#### Scenario: Display generation states
- **WHEN** the AI draft flow is pending, disabled, missing configuration, rate-limited, usage-limited, timed out, receives a malformed response, fails because of a provider error, or can be retried
- **THEN** the admin UI displays an accessible state with recovery guidance where applicable
