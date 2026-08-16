## ADDED Requirements

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
