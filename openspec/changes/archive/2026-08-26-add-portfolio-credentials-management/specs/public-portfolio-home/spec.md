## ADDED Requirements

### Requirement: Display credentials sections conditionally
The system SHALL display education and certification sections on the public homepage only when each section is publicly enabled and has at least one individually published record returned by public credentials retrieval.

#### Scenario: Load public credentials for homepage
- **WHEN** the public homepage loads
- **THEN** the system requests education and certification data from public credentials retrieval behavior

#### Scenario: Show enabled education section with published entries
- **WHEN** public education retrieval returns one or more published education records
- **THEN** the homepage displays an Education section with those records

#### Scenario: Hide disabled education section
- **WHEN** education public-section visibility is disabled
- **THEN** the homepage omits the Education section without exposing hidden education records

#### Scenario: Hide education section with no published entries
- **WHEN** education public-section visibility is enabled but public education retrieval returns no records
- **THEN** the homepage omits the Education section

#### Scenario: Show enabled certifications section with published entries
- **WHEN** public certification retrieval returns one or more published certification records
- **THEN** the homepage displays a Certifications section with those records

#### Scenario: Hide disabled certifications section
- **WHEN** certifications public-section visibility is disabled
- **THEN** the homepage omits the Certifications section without exposing hidden certification records

#### Scenario: Hide certifications section with no published entries
- **WHEN** certifications public-section visibility is enabled but public certification retrieval returns no records
- **THEN** the homepage omits the Certifications section

#### Scenario: Preserve homepage when credentials fail
- **WHEN** public education or certification loading fails
- **THEN** the homepage continues to display the rest of the public portfolio content and presents accessible retry behavior for the failed credentials content

#### Scenario: Support responsive credentials sections
- **WHEN** education or certification sections are displayed on desktop or mobile screens
- **THEN** the homepage presents the credential records in a readable layout without horizontal scrolling
