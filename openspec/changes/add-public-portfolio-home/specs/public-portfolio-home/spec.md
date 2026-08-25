## Purpose

Public portfolio home gives visitors a complete first impression of the owner by combining the existing public profile and published project data into an accessible landing page.

## ADDED Requirements

### Requirement: Serve a public portfolio homepage
The system SHALL provide `/` as a public portfolio homepage that does not require admin authentication.

#### Scenario: Open homepage
- **WHEN** a visitor opens `/`
- **THEN** the system displays the public portfolio homepage instead of an admin management interface

#### Scenario: Keep admin routes under admin namespace
- **WHEN** an owner needs profile or project management
- **THEN** the system keeps management interfaces reachable under `/admin/*`

#### Scenario: Avoid admin authentication on homepage
- **WHEN** a visitor opens `/` without an admin session
- **THEN** the system displays public homepage behavior without redirecting to `/admin/login`

### Requirement: Load homepage data from public APIs
The system SHALL build homepage content from existing public profile and public projects APIs without calling management APIs.

#### Scenario: Request public profile
- **WHEN** the homepage loads
- **THEN** the system requests owner profile data from `GET /public/profile`

#### Scenario: Request public projects
- **WHEN** the homepage loads
- **THEN** the system requests project data from `GET /public/projects`

#### Scenario: Avoid management API calls
- **WHEN** the homepage loads for a visitor
- **THEN** the system does not call `GET /profile`, `GET /projects`, or any other management API route

### Requirement: Present owner profile content
The system SHALL display public owner information when profile data is available.

#### Scenario: Display profile identity
- **WHEN** the public profile loads successfully
- **THEN** the homepage displays the owner's profile picture when present, full name, headline, biography, and location

#### Scenario: Display contact and social links
- **WHEN** the public profile includes email, GitHub URL, or LinkedIn URL
- **THEN** the homepage displays accessible contact and social links for the provided values

#### Scenario: Handle missing optional profile values
- **WHEN** optional profile values such as picture, location, GitHub URL, or LinkedIn URL are absent
- **THEN** the homepage omits those optional elements without displaying broken images, empty links, or placeholder URLs

### Requirement: Present skills and selected published projects
The system SHALL summarize skills and selected published projects using public project data only.

#### Scenario: Display derived skills
- **WHEN** public projects include tech stack entries
- **THEN** the homepage displays a deduplicated skills summary derived from those published project tech stacks

#### Scenario: Display selected published projects
- **WHEN** public projects load successfully
- **THEN** the homepage displays selected published projects with title, summary, image when present, tech stack, and links to public project detail pages

#### Scenario: Exclude unpublished projects
- **WHEN** unpublished projects exist in management data
- **THEN** the homepage does not expose them unless they are returned by `GET /public/projects`

#### Scenario: Link to all projects
- **WHEN** at least one public project is available
- **THEN** the homepage provides a link to the public projects listing at `/projects`

### Requirement: Handle homepage loading, empty, and error states
The system SHALL present clear states while public profile and project data load, fail, or return no content.

#### Scenario: Show loading state
- **WHEN** homepage profile or project data is still loading
- **THEN** the homepage displays a loading state without showing stale empty or error messaging

#### Scenario: Show missing profile state
- **WHEN** `GET /public/profile` returns not found
- **THEN** the homepage displays a public empty state indicating profile information is not available yet

#### Scenario: Show empty projects state
- **WHEN** `GET /public/projects` returns an empty list
- **THEN** the homepage displays an empty project state without implying unpublished projects exist

#### Scenario: Show API error state
- **WHEN** loading public profile or public projects fails with an API error
- **THEN** the homepage displays an accessible error state with a retry action

### Requirement: Support responsive and accessible homepage behavior
The system SHALL make homepage content usable across desktop, mobile, and assistive technology.

#### Scenario: Desktop homepage layout
- **WHEN** the homepage is viewed on desktop-sized screens
- **THEN** the system presents profile, contact, skills, and selected projects in a scannable desktop layout

#### Scenario: Mobile homepage layout
- **WHEN** the homepage is viewed on mobile-sized screens
- **THEN** the system presents the same content in a single-column layout without horizontal scrolling

#### Scenario: Keyboard and screen-reader access
- **WHEN** a visitor uses keyboard navigation or assistive technology
- **THEN** links, retry actions, loading states, empty states, errors, images, and project cards expose appropriate labels, roles, and alternative text

### Requirement: Provide homepage SEO metadata
The system SHALL expose metadata suitable for a public portfolio homepage.

#### Scenario: Set document metadata
- **WHEN** the homepage renders
- **THEN** the document title and description identify the owner and portfolio purpose using available public profile information when possible

#### Scenario: Preserve public route metadata
- **WHEN** a visitor navigates between `/`, `/projects`, and `/projects/:slug`
- **THEN** each public route exposes metadata appropriate to that route rather than reusing admin metadata
