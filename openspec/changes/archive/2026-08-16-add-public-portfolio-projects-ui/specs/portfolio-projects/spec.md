## ADDED Requirements

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
