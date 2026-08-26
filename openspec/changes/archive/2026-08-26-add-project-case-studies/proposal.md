## Why

Portfolio projects can currently show summary-level information, but selected work needs deeper recruiter-facing context about the problem, contribution, technical decisions, challenges, outcomes, and lessons learned. Adding optional project case studies lets the portfolio tell richer project stories without mixing this with skill-growth or learning-tracking features.

## What Changes

- Add optional one-to-one case-study behavior for portfolio projects.
- Store case-study narrative fields, ordered responsibilities, ordered challenges, ordered outcomes, and independent publication state.
- Add authenticated management behavior for creating, reading, updating, publishing, unpublishing, and removing a project case study.
- Prevent duplicate case studies for the same project and preserve existing project behavior.
- Extend project deletion so an associated case study is safely removed with its project.
- Add case-study management to the existing project edit workflow with draft, published, empty, loading, validation, error, retry, and removal states.
- Extend public project detail responses and `/projects/:slug` pages to show case-study content only when both the project and case study are public.
- Keep draft case-study content private and avoid revealing whether a draft exists.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `portfolio-projects`: Adds optional project case-study management, validation, publication, public exposure, public detail rendering, and deletion behavior tied to existing portfolio projects.

## Impact

- API: project case-study database model, migration, authenticated management endpoints, public project-detail response shape, validation, and tests.
- Web: project edit workflow, API client/query/mutation contracts, public project detail rendering, metadata, accessible repeatable-field controls, and tests.
- Shared contracts: case-study types, create/update/public response contracts, ordered text-entry handling, and publication-state behavior.
- E2E: project edit case-study workflows and public/draft publication combinations.
- OpenSpec: `portfolio-projects` behavior contract is extended.
