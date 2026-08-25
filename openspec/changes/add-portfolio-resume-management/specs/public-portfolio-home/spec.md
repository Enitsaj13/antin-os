## ADDED Requirements

### Requirement: Display published resume download action
The system SHALL display a public CV download action on the homepage only when a published resume is available.

#### Scenario: Load public resume metadata for homepage
- **WHEN** the public homepage loads
- **THEN** the system requests resume metadata from the public resume retrieval behavior

#### Scenario: Show Download CV button
- **WHEN** public resume metadata indicates a published resume is available
- **THEN** the homepage displays an accessible Download CV action that points to the stable public resume download endpoint

#### Scenario: Hide Download CV button without published resume
- **WHEN** no published resume is available
- **THEN** the homepage does not display a Download CV action or expose private resume details

#### Scenario: Keep homepage usable while resume metadata loads
- **WHEN** public profile, project, or experience data has loaded but public resume metadata is still loading
- **THEN** the homepage remains usable and does not show a broken or misleading Download CV action

#### Scenario: Keep homepage usable when resume metadata fails
- **WHEN** public resume metadata loading fails
- **THEN** the homepage continues to display the rest of the public portfolio content without exposing a broken Download CV action
