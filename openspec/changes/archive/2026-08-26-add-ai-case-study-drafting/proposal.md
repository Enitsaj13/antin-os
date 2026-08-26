## Why

Project case studies are useful recruiter-facing content, but writing the first draft is slow and repetitive when much of the source material already exists in the portfolio project record. An authenticated AI drafting flow can speed up drafting while keeping the owner in full control of review, edits, saving, and publishing.

## What Changes

- Add an authenticated admin-only AI case-study drafting flow for portfolio projects.
- Allow the owner to select an existing project, add optional notes, generate a structured draft, review and edit every generated field, manually accept the draft, and save it as an unpublished case study.
- Add protected API behavior that generates a draft matching `ProjectCaseStudy` fields without saving, overwriting, publishing, or exposing generated content.
- Use OpenAI as the initial real provider through the official OpenAI Node.js SDK and Responses API, while keeping the drafting interface provider-independent.
- Require strict Structured Outputs that match the shared `CaseStudyDraft` contract; malformed or unavailable structured output fails safely instead of falling back to unstructured text.
- Add a mock provider mode for zero-cost local development and all automated tests.
- Keep AI provider credentials and AI configuration server-side, with empty placeholders in `.env.example` and no browser-exposed AI environment variables.
- Require explicit server configuration before real AI drafting is enabled, including provider, API key, model, timeout, rate limit, usage limit, notes length, and output token controls.
- Add safeguards for disabled/missing configuration, rate limits, usage limits, provider timeouts, malformed responses, provider errors, and confirmation-needed content.
- Require generated drafts to avoid inventing metrics, responsibilities, or outcomes and clearly identify fields or claims that need owner confirmation.
- Exclude public chatbot behavior, automatic publishing, automatic overwrite, persistent usage accounting, provider billing management, and public exposure of generated content.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `portfolio-projects`: Add authenticated AI-assisted case-study draft generation and review behavior to existing project case-study management.

## Impact

- API: new protected project-scoped draft-generation endpoint, request/response DTOs, rate/usage limiting, timeout/provider-error mapping, OpenAI and mock provider implementations, and an internal provider-independent drafting interface.
- Web: admin project case-study drafting workflow integrated with existing project/case-study management screens.
- Shared/API client: typed draft request and response contracts matching existing case-study field conventions.
- Configuration: server-side AI drafting settings for `AI_DRAFTING_ENABLED`, `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_DRAFT_TIMEOUT_MS`, `AI_DRAFT_RATE_LIMIT`, `AI_DRAFT_USAGE_LIMIT`, `AI_DRAFT_MAX_NOTES_LENGTH`, and `AI_DRAFT_MAX_OUTPUT_TOKENS`, with no public exposure of secrets.
- Tests: API, web, and Playwright coverage using mocked providers only, including success, malformed output, timeout, missing configuration, missing project, unauthorized request, rate limit, usage limit, provider failure, no database writes, and no public exposure before manual save/publication.
