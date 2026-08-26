## Context

See `proposal.md` for motivation. The current project module already supports authenticated project CRUD, one optional project case study per project, public exposure only for published project/case-study combinations, and admin editing in the project edit workflow. Authentication is cookie/session based, public portfolio routes are unauthenticated, and management behavior is protected by the owner auth guard.

The AI drafting feature should generate transient structured content only. It must not create a second persistence path, because the existing case-study create/update/publish behavior already owns validation, draft storage, and public exposure rules.

The initial real provider is OpenAI, using the official OpenAI Node.js SDK and Responses API. Provider integration still needs to remain replaceable because local development, tests, and future provider changes should not change the project/case-study domain behavior. AntinOS is initially using an account-limited OpenAI Free API plan, so the implementation must not assume free access is permanent, must not hardcode a model, and must not automatically switch to paid models or providers.

## Goals / Non-Goals

**Goals:**

- Add a protected server-side draft-generation operation that accepts a project id and optional owner notes.
- Keep AI provider credentials and provider-specific configuration inside the API process.
- Return an editable draft shaped like case-study form data plus confirmation-needed guidance.
- Reuse existing case-study create/update behavior to save reviewed drafts as unpublished.
- Make provider integration replaceable while providing OpenAI and mock implementations.
- Use strict Structured Outputs matching the shared `CaseStudyDraft` contract for real generation.
- Surface disabled, missing-configuration, rate-limit, usage-limit, timeout, malformed-response, and provider-error states in the admin UI.

**Non-Goals:**

- No public chatbot, public AI endpoint, or unauthenticated AI generation.
- No automatic save, overwrite, publish, or public exposure of generated text.
- No database storage for raw prompts, provider responses, token usage history, or generated drafts in this change.
- No persistent usage accounting, cross-instance quota coordination, provider billing management, or automatic paid-provider/model switching.
- No rich-text editor, markdown support, screenshot generation, analytics, or AI case-study publishing automation.

## Decisions

### 1. Add a project-scoped draft endpoint that does not persist

Use a protected route such as `POST /projects/:projectId/case-study/draft` for generation. The request includes optional owner notes. The response includes:

- `draft`: context, problem, role, approach, responsibilities, technicalChallenges, outcomes, and lessonsLearned.
- `needsConfirmation`: ordered messages or field-level notes identifying claims that need owner review.

The endpoint first loads the project through existing managed project access. If the project is missing, it returns not found before provider execution. The provider payload includes only required project fields and optional owner notes. It excludes profile contact details, authentication data, resume files, education/certification records, unrelated projects, credentials, secrets, and any unrelated portfolio data.

The endpoint never writes to `ProjectCaseStudy`; saving remains a separate manual action through existing case-study create/update endpoints. Generated content is never automatically saved, overwritten, published, or exposed through public endpoints.

Alternative considered: add generation directly inside the save endpoint. Rejected because it would couple generation with persistence and make it easier to accidentally overwrite or publish unreviewed AI content.

### 2. Keep provider integration behind an internal interface

Introduce an API-local interface such as `CaseStudyDraftProvider` with one operation that accepts normalized source data and returns normalized draft data. The project service or a small case-study drafting service depends on that interface, not on a concrete provider SDK.

Provide two initial implementations:

- `OpenAiCaseStudyDraftProvider` for real generation through the official OpenAI Node.js SDK and Responses API.
- `MockCaseStudyDraftProvider` for zero-cost local development and automated tests.

`AI_PROVIDER=mock` selects deterministic mock generation. `AI_PROVIDER=openai` is allowed only when drafting is enabled and both `OPENAI_API_KEY` and `OPENAI_MODEL` are configured. Missing or inconsistent configuration disables generation with an application-safe configuration error before any provider call.

Provider-specific errors are translated into application-level timeout, provider-error, malformed-response, rate-limit, usage-limit, disabled, or configuration results before leaving the API layer.

Alternative considered: call the provider directly from the controller or web app. Rejected because it would expose implementation details, make tests brittle, and risk leaking secrets to the browser.

### 3. Use OpenAI Responses API Structured Outputs for real generation

The OpenAI implementation uses the Responses API with Structured Outputs and a strict JSON Schema that matches the shared `CaseStudyDraft` contract. The request sets provider-side response storage to false when the SDK/API supports that option. The implementation does not hardcode a model; `OPENAI_MODEL` is required server-side configuration because free-plan model availability can change.

The API requests bounded output using `AI_DRAFT_MAX_OUTPUT_TOKENS`. If the provider cannot honor strict structured output, returns invalid structured content, or only supports unstructured text for the configured model, the API returns a malformed-response/provider configuration error instead of silently falling back to text.

Alternative considered: return raw provider text or parse best-effort prose. Rejected because it weakens contracts, complicates UI error handling, and increases the chance of leaking unsupported claims.

### 4. Validate generated output before returning it

Provider output is parsed, validated, normalized, and trimmed to the shared `CaseStudyDraft` contract before returning to the web app. The API rejects malformed output rather than passing partial or provider-native content to the client.

The system prompt and post-processing should bias toward:

- using only project fields and owner notes as source material,
- avoiding invented metrics and unsupported outcomes,
- producing concise recruiter-readable prose,
- placing uncertain claims into `needsConfirmation`.

The API must not log complete prompts, owner notes, raw provider responses, API keys, authorization headers, or provider internals. Safe application errors should be enough for the admin UI to show retry guidance without exposing provider secrets.

### 5. Rate and usage limits live on the API side

Draft generation should check configurable limits before provider execution. For this single-owner app, an in-memory limiter is acceptable for local development and a single API instance, but the design should isolate limit checks so a persistent/shared limiter can replace it later if deployment topology changes.

Configuration should include:

- `AI_DRAFTING_ENABLED`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AI_DRAFT_TIMEOUT_MS`
- `AI_DRAFT_RATE_LIMIT`
- `AI_DRAFT_USAGE_LIMIT`
- `AI_DRAFT_MAX_NOTES_LENGTH`
- `AI_DRAFT_MAX_OUTPUT_TOKENS`

The initial usage limit is an in-memory request-count limit per configured window. Rate and usage checks happen before OpenAI execution to control cost and avoid unnecessary provider calls. The in-memory limiter resets after API restart and does not coordinate across multiple API instances; that limitation must be documented.

Alternative considered: only rely on provider-side limits. Rejected because local UI needs predictable errors and the app should avoid unnecessary provider calls.

### 6. Review UX extends the existing project edit workflow

Add AI drafting controls to project case-study management instead of creating a separate public or global AI page. The UI flow is:

Select project -> add optional notes -> generate draft -> review and edit -> manually accept -> save as unpublished case study -> publish separately.

For a project edit screen, project selection can be implicit because the project is already selected. A project-list-level entry point can navigate to the edit screen or a focused draft panel for that project.

Generated content should populate editable review state first. The owner can edit every generated field before accepting it into the existing case-study form. If existing unsaved case-study form values are present, the UI must warn that accepting generated content will replace those unsaved values. Canceling or leaving the drafting flow must not change stored data or saved form state.

The UI should show pending, disabled, configuration, timeout, rate-limit, usage-limit, malformed-response, provider-error, and retry states. It must prevent duplicate generation requests while one is pending.

Alternative considered: create a standalone generation page under `/admin/projects/ai-draft`. Rejected for initial scope because project edit already owns the case-study form, validation, and save actions.

## Risks / Trade-offs

- AI may produce plausible unsupported claims -> prompt constraints, strict source inputs, `needsConfirmation`, and owner review before save.
- Provider latency can make the admin UI feel stuck -> request timeout, pending state, cancel/retry affordance, and duplicate-submit prevention.
- Free-plan model availability can change -> require `OPENAI_MODEL` configuration and fail disabled/configuration states instead of hardcoding a fallback model.
- In-memory rate/usage limits do not coordinate across multiple API instances -> document the limitation and isolate limiter logic for later replacement.
- Provider response schemas can drift -> use strict Structured Outputs, then validate and normalize responses before returning them.
- Saving generated content could overwrite existing case-study form edits -> keep generation separate from persistence and require explicit owner accept/save steps.
- New provider dependency can make tests flaky or costly -> automated tests and Playwright use mock providers only and never call the real OpenAI API.
- Prompt/privacy leakage risk -> send minimal project data, never send unrelated user/profile/resume/credential data, and avoid logging complete prompts, notes, or raw responses.

## Migration Plan

No database migration is required for draft generation because generated drafts are transient and existing `ProjectCaseStudy` storage is reused after manual save.

Deployment steps:

1. Add empty `.env.example` placeholders for the server-only AI drafting variables.
2. Deploy API and web changes with drafting disabled or with `AI_PROVIDER=mock` for zero-cost local development.
3. Configure `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL` only in environments where the owner wants real AI drafting.
4. Keep browser environment variables free of AI provider keys, model names, timeout values, and usage-limit configuration.

Rollback strategy:

- Disable the drafting feature through configuration or remove provider credentials.
- Existing manually saved case studies remain valid because persistence uses the existing case-study model.
