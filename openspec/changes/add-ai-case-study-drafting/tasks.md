## 1. Contracts And Configuration

- [x] 1.1 Add shared request and response types for AI case-study draft generation, including draft fields and confirmation-needed guidance.
- [x] 1.2 Add API-client support for the protected project-scoped draft-generation request.
- [x] 1.3 Add the server-only AI drafting configuration keys: `AI_DRAFTING_ENABLED`, `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_DRAFT_TIMEOUT_MS`, `AI_DRAFT_RATE_LIMIT`, `AI_DRAFT_USAGE_LIMIT`, `AI_DRAFT_MAX_NOTES_LENGTH`, and `AI_DRAFT_MAX_OUTPUT_TOKENS`.
- [x] 1.4 Add empty placeholders for the AI drafting variables to `.env.example` without adding any real API key.
- [x] 1.5 Enforce that `AI_PROVIDER=mock` works without external credentials and `AI_PROVIDER=openai` requires both `OPENAI_API_KEY` and `OPENAI_MODEL`.
- [x] 1.6 Ensure provider credentials, model identifiers, timeout values, and private provider configuration are never exposed through web build-time environment variables or public API responses.
- [x] 1.7 Add the official OpenAI Node.js SDK dependency only where the API server needs it.

## 2. API Draft Generation

- [x] 2.1 Add a protected project-scoped draft-generation endpoint for authenticated owner requests.
- [x] 2.2 Validate draft-generation input, including project id and optional owner notes length.
- [x] 2.3 Load the selected project before generation and return not found without calling the provider when the project is missing.
- [x] 2.4 Add the provider-independent `CaseStudyDraftProvider` interface and wire draft generation through that interface.
- [x] 2.5 Implement `MockCaseStudyDraftProvider` for deterministic zero-cost local development and automated tests.
- [x] 2.6 Implement `OpenAiCaseStudyDraftProvider` using the official OpenAI Node.js SDK and Responses API.
- [x] 2.7 Request strict Structured Outputs with a JSON Schema matching the shared `CaseStudyDraft` contract.
- [x] 2.8 Require `OPENAI_MODEL` configuration instead of hardcoding a model identifier.
- [x] 2.9 Set provider-side response storage to false when supported by the OpenAI SDK/API.
- [x] 2.10 Build the provider prompt/source payload from required project information and optional owner notes only.
- [x] 2.11 Ensure prompts exclude profile contact details, authentication data, resume files, credentials, unrelated projects, secrets, and unrelated portfolio data.
- [x] 2.12 Parse, validate, and normalize provider output into structured case-study draft fields plus confirmation-needed guidance.
- [x] 2.13 Reject malformed provider output without falling back to unstructured text and without saving generated content.
- [x] 2.14 Keep draft generation non-persistent so the endpoint never creates, updates, overwrites, publishes, or exposes a stored case study.

## 3. Limits And Failure Handling

- [x] 3.1 Add API-side rate limiting before provider execution.
- [x] 3.2 Add API-side in-memory request-count usage-limit checks per configured window before provider execution.
- [x] 3.3 Enforce `AI_DRAFT_MAX_NOTES_LENGTH` and `AI_DRAFT_MAX_OUTPUT_TOKENS` to control input and output size.
- [x] 3.4 Add provider timeout handling with a distinct timeout error response.
- [x] 3.5 Map provider failures to safe provider-error responses without leaking provider secrets or raw provider internals.
- [x] 3.6 Add disabled and missing-configuration behavior that prevents provider calls and returns an actionable admin error.
- [x] 3.7 Return a distinct malformed-response state for invalid structured provider output.
- [x] 3.8 Ensure application logs never include API keys, authorization headers, complete prompts, owner notes, raw OpenAI responses, or provider secrets.

## 4. Admin Review Workflow

- [x] 4.1 Add AI draft controls to project case-study management from the authenticated admin project workflow.
- [x] 4.2 Support selecting an existing project when the draft flow is launched outside a specific project edit context.
- [x] 4.3 Allow optional owner notes to be entered before generation.
- [x] 4.4 Show pending, disabled, configuration, rate-limit, usage-limit, timeout, malformed-response, provider-error, and retry states with accessible feedback.
- [x] 4.5 Prevent duplicate generation submissions while generation is pending.
- [x] 4.6 Display generated draft fields in editable review controls before any save operation occurs.
- [x] 4.7 Display confirmation-needed guidance clearly beside or near the relevant generated content.
- [x] 4.8 Allow the owner to manually accept reviewed draft content into the existing case-study form.
- [x] 4.9 Save accepted draft content only through existing case-study create/update behavior and default the saved case study to unpublished.
- [x] 4.10 Preserve existing stored case-study content unless the owner explicitly saves reviewed generated content.
- [x] 4.11 Warn before accepting generated content over unsaved case-study form values.
- [x] 4.12 Allow canceling or leaving the draft flow without changing stored case-study data.

## 5. Privacy And Public Behavior

- [x] 5.1 Confirm public project list and detail APIs never expose generated draft content before explicit save and publish.
- [x] 5.2 Confirm public routes do not expose a chatbot, AI drafting entry point, provider interaction, or drafting metadata.
- [x] 5.3 Confirm generated draft content remains hidden from public UI until saved as a case study and separately published.
- [x] 5.4 Confirm provider details and drafting metadata are not included in public project responses.

## 6. Tests

- [x] 6.1 Add API tests for authenticated successful generation with mocked provider output and strict structured draft fields.
- [x] 6.2 Add API tests proving unauthenticated requests do not call the provider.
- [x] 6.3 Add API tests for missing project, validation errors, malformed provider output, provider error, timeout, rate limit, usage limit, disabled configuration, and missing OpenAI configuration.
- [x] 6.4 Add API tests proving rate-limit and usage-limit failures happen before provider execution.
- [x] 6.5 Add API tests proving generation does not create, update, overwrite, publish, or expose a stored case study.
- [x] 6.6 Add API tests proving generated content is not exposed by public APIs before manual save and publication.
- [x] 6.7 Add web tests for project selection, optional notes, pending state, generated editable review, confirmation-needed guidance, manual accept, replacement warning, cancel, and duplicate-submit prevention.
- [x] 6.8 Add web tests for disabled, configuration, rate-limit, usage-limit, timeout, malformed-response, provider-error, and retry states.
- [x] 6.9 Add Playwright coverage for generating a draft through mock mode, reviewing/editing it, accepting it, saving it as unpublished, and publishing separately.
- [x] 6.10 Add Playwright or API coverage proving public pages do not expose unsaved or unpublished generated draft content.
- [x] 6.11 Ensure unit, integration, and Playwright tests never call the real OpenAI API.

## 7. Documentation And Verification

- [x] 7.1 Document required server-side AI drafting environment variables, mock mode, OpenAI Free-plan development setup, and local disabled-state behavior.
- [x] 7.2 Document that in-memory rate and usage limits reset after API restart and do not coordinate across multiple API instances.
- [x] 7.3 Document that real OpenAI drafting requires `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL`, and that the app does not automatically switch to a paid model or provider.
- [x] 7.4 Run formatting and linting checks.
- [x] 7.5 Run API and web unit tests.
- [x] 7.6 Run API and web builds.
- [x] 7.7 Run relevant Playwright E2E tests in mock mode.
- [x] 7.8 Run `pnpm exec openspec validate add-ai-case-study-drafting --strict`.
