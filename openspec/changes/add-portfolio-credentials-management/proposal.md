## Why

AntinOS needs a way to manage education and certification content without forcing those sections onto the public portfolio before the owner is ready. Persistent section-level visibility lets the owner keep records available in admin while controlling whether each public section is exposed.

## What Changes
ru
- Add portfolio credential management for education and certification records.
- Add persistent singleton portfolio settings with `showEducation` and `showCertifications`, both defaulting to `false`.
- Add protected admin visibility toggles at the top of the credentials admin page.
- Keep admin education and certification management available regardless of public-section visibility.
- Gate public education and certification APIs by both section visibility and individual entry publication state.
- Show education and certification sections on the public homepage only when the corresponding section is enabled and has at least one published entry.
- Add API, web, and Playwright coverage for enabled, disabled, empty, published, and unpublished combinations.

## Capabilities

### New Capabilities
- `portfolio-credentials`: Education and certification storage, management APIs/UI, public retrieval, and section visibility settings.

### Modified Capabilities
- `public-portfolio-home`: Homepage education and certification section rendering must follow the new public credentials visibility behavior.

## Impact

- Database: add education, certification, and singleton portfolio settings persistence.
- API: add protected management endpoints, public credentials endpoints, validation, and visibility-setting updates.
- Web: add credentials admin page, visibility toggles, query/mutation hooks, homepage sections, and responsive accessible states.
- Tests: add API unit tests, web tests, and focused Playwright coverage for visibility and publication combinations.
