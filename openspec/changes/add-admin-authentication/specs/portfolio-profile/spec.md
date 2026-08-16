## ADDED Requirements

### Requirement: Require owner authentication for profile management
The system SHALL require owner authentication for all profile management behavior while keeping public profile retrieval unauthenticated.

#### Scenario: Reject unauthenticated managed profile retrieval
- **WHEN** `GET /profile` is requested without valid owner authentication
- **THEN** the system returns HTTP 401

#### Scenario: Reject unauthenticated profile upsert
- **WHEN** `PUT /profile` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not create or update the owner profile

#### Scenario: Reject unauthenticated profile picture upload
- **WHEN** `POST /profile/picture` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not store a profile picture

#### Scenario: Reject unauthenticated profile picture removal
- **WHEN** `DELETE /profile/picture` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not remove the current profile picture

#### Scenario: Allow authenticated profile management
- **WHEN** `GET /profile`, `PUT /profile`, `POST /profile/picture`, or `DELETE /profile/picture` is requested with valid owner authentication
- **THEN** the system allows the request to proceed to the existing profile management behavior

#### Scenario: Keep public profile unauthenticated
- **WHEN** `GET /public/profile` is requested without owner authentication
- **THEN** the system allows the request to proceed to the existing public profile behavior
