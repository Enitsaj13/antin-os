## ADDED Requirements

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
