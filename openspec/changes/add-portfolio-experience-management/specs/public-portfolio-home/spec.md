## ADDED Requirements

### Requirement: Display published experience timeline
The system SHALL display published work experience entries as a chronological timeline on the public portfolio homepage.

#### Scenario: Load public experience for homepage
- **WHEN** the homepage loads
- **THEN** the system requests experience data from the public experience retrieval behavior

#### Scenario: Display timeline entries
- **WHEN** published experience entries load successfully
- **THEN** the homepage displays each entry's company, role, location when present, employment type, date range, current-role state, summary, and any supplied achievements and technologies

#### Scenario: Order timeline entries
- **WHEN** published experience entries are displayed on the homepage
- **THEN** the homepage presents them in chronological timeline order using the public experience ordering

#### Scenario: Hide unpublished experience from homepage
- **WHEN** unpublished experience entries exist
- **THEN** the homepage does not expose them unless they are returned by public experience retrieval

#### Scenario: Show empty experience state
- **WHEN** public experience retrieval returns no entries
- **THEN** the homepage displays an empty experience state without implying unpublished entries exist

#### Scenario: Show experience loading state
- **WHEN** homepage experience data is loading
- **THEN** the homepage displays a loading state without stale timeline, empty, or error messaging

#### Scenario: Show experience error and retry state
- **WHEN** homepage experience loading fails
- **THEN** the homepage displays an accessible error state with a retry action
