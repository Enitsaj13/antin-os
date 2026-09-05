## 1. Shared AI Drafting Infrastructure

- [x] 1.1 Add characterization tests for the existing case-study AI configuration, OpenAI structured request, deterministic mock output, normalization, timeout, limiter, and application-safe error behavior before refactoring it.
- [x] 1.2 Extract the existing server-only enablement, provider selection, credentials, model, timeout, rate/usage windows, and output-token settings into a reusable AI drafting configuration module, and add the positive-integer API-only `AI_DRAFT_MAX_INPUT_CHARACTERS` setting with its default and example placeholder.
- [x] 1.3 Implement a reusable strict-structured-output provider runner and safe provider error contract that enforces the configured normalized input-character limit before provider execution and preserves OpenAI `store: false`, abort handling, malformed-response rejection, and secret-safe logging.
- [x] 1.4 Move rate and usage counting behind one shared limiter instance so case-study and job-assistant operations consume the same configured windows, while retaining the documented single-instance behavior.
- [x] 1.5 Implement shared mock dispatch with deterministic domain result factories and no network access.
- [x] 1.6 Adapt project case-study drafting to the shared runner, configuration, limiter, and mock dispatch while preserving its current endpoint and response contracts.
- [x] 1.7 Run the case-study unit, API E2E, and web regression tests and confirm the shared refactor causes no observable case-study behavior change.

## 2. Job Description Persistence

- [x] 2.1 Add the shared 30,000-character `jobDescription` limit and extend job-application create, update, and response contracts with an optional nullable job-description field.
- [x] 2.2 Add nullable `jobDescription` storage to the Prisma `JobApplication` model, create a forward-only migration, regenerate Prisma types, and verify existing records remain valid with `null` descriptions.
- [x] 2.3 Extend API DTO validation and normalization so job descriptions are trimmed, blank descriptions clear to `null`, and oversized values are rejected without truncation.
- [x] 2.4 Extend job-application selection, create, update, response, and text-search behavior to persist and privately return the field without rendering it through any public controller or contract.
- [x] 2.5 Update API unit/E2E fixtures and tests for create, read, update, clear, search, maximum-length rejection, unauthenticated access, and public isolation of job descriptions.

## 3. Assistant Contracts and Domain Validation

- [x] 3.1 Define shared closed operation identifiers for analysis, interview questions, self-introduction, cover letter, follow-up message, and next action, plus the validated assistant request contract.
- [x] 3.2 Define discriminated response contracts with `sourceUpdatedAt`, confirmation guidance, suggested job fields, separate responsibilities/required skills/preferred skills/keywords, evidence references, matching qualifications, gaps, unknowns, and operation-specific editable output including interview questions with suggested answers.
- [x] 3.3 Create strict JSON Schemas for each operation with unknown properties disabled and bounded arrays/text suitable for the existing output-token limit.
- [x] 3.4 Implement domain normalizers that trim output, reject incomplete shapes and unknown evidence references, and prevent provider-native or partial malformed content from reaching the client.
- [x] 3.5 Add fixed trusted instructions that treat job descriptions and portfolio fields as untrusted serialized data, forbid source instructions from changing the task, forbid unsupported claims, and expose no tool or external-action behavior.
- [x] 3.6 Implement deterministic job-assistant mock results for every operation, including the four extraction groups, evidence-backed matches, honest gaps, interview questions with suggested answers, confirmation items, and no automatic mutation semantics.
- [x] 3.7 Unit test all schemas, normalizers, prompt boundaries, extraction categories, suggested-answer evidence, evidence-reference validation, unsupported-claim handling, input-length rejection, and deterministic mock modes without calling a real provider.

## 4. Private Assistant API

- [x] 4.1 Build a bounded server-side evidence snapshot from the selected job, profile full name/headline/biography, managed projects/case studies, and managed experience; derive owner skill evidence only from those source fields while excluding contact details, resume files, credentials, storage keys, unrelated jobs, and unrelated notes.
- [x] 4.2 Enforce individual source bounds and `AI_DRAFT_MAX_INPUT_CHARACTERS`, returning an actionable validation error without silent truncation or provider execution when the job description is empty or the normalized evidence payload is too large.
- [x] 4.3 Implement the job-assistant service so each selected operation reloads current stored sources, consumes the shared limiter, calls the configured structured provider with the shared timeout, normalizes the result, and performs no database mutation.
- [x] 4.4 Add the owner-authenticated `POST /job-applications/:id/assistant` endpoint with closed operation validation, HTTP 404 before provider use for missing applications, and application-safe disabled/configuration/rate/usage/timeout/malformed/provider errors.
- [x] 4.5 Ensure responses include the source application update timestamp and only safe source labels/ids, generated content, evidence classifications, and confirmation guidance—not prompts, provider configuration, raw responses, or secrets.
- [x] 4.6 Add controller/service tests for authentication, missing applications, empty descriptions, source minimization, derived skill evidence, all six operations, configured input/rate/usage/output limits, timeout/error mapping, no provider fallback, and zero writes during generation.
- [x] 4.7 Add API E2E tests proving assistant routes are private, job/application data remains unchanged after generation, public APIs expose no description or AI metadata, and mock-mode requests never make an external call.

## 5. Job Description Admin Experience

- [x] 5.1 Add a labeled multiline job-description field with length guidance and remaining/error feedback to protected job-application create and edit forms.
- [x] 5.2 Preserve job-description input after failed creates/updates, support explicit clearing, and refresh table, Kanban, detail, edit, and dashboard queries from confirmed server state.
- [x] 5.3 Include job-description matches in private text search without expanding complete descriptions in desktop table rows or mobile stacked entries.
- [x] 5.4 Add component tests for create/edit/clear/validation/failure preservation, description search, responsive table behavior, and absence from public pages.

## 6. Assistant Review Experience

- [x] 6.1 Add authenticated API-client support and query mutations for the discriminated assistant operation and application-safe error states.
- [x] 6.2 Add a protected assistant panel to the selected job edit/detail workflow that requires a saved non-empty description and offers analysis plus the five explicit generation choices rather than a free-form chat input.
- [x] 6.3 Render analysis with suggested company/position, separate responsibilities/required skills/preferred skills/keywords, evidence-backed matching qualifications, honest gaps, unknowns, source labels, and confirmation-needed guidance.
- [x] 6.4 Render operation-specific editable review state for interview questions paired with suggested answers, self-introduction, cover letter, follow-up message, and next action, with evidence/confirmation guidance, copy and cancel controls, and no automatic save.
- [x] 6.5 Implement explicit apply previews for company, position, `followUpNotes`, and append/replace `notes`, using the existing update mutation and confirming before replacing stored or unsaved values.
- [x] 6.6 Compare `sourceUpdatedAt` with current application state, mark stale generated content, and require regeneration or conscious continuation before applying it.
- [x] 6.7 Prevent duplicate pending generation and expose keyboard-accessible pending, disabled, configuration, input-length, rate-limit, usage-limit, timeout, malformed-response, provider-error, stale, retry, copy, apply, confirmation, and cancel states.
- [x] 6.8 Add component tests for every operation, extraction categories, interview suggested answers, evidence/gap rendering, editing/copying, explicit apply destinations, overwrite confirmation, stale-source handling, cancellation, retry, duplicate prevention, and no mutation before confirmation.

## 7. End-to-End Privacy and Safety Verification

- [x] 7.1 Add Playwright coverage using mock mode for saving a job description, reviewing the four extraction groups and an evidence-grounded suggested interview answer, reviewing each output category, applying one confirmed field, and discarding an unaccepted draft.
- [x] 7.2 Add adversarial job-description coverage showing instruction-like pasted content cannot alter the requested operation, introduce unsupported evidence, enable tools, or produce an external action.
- [x] 7.3 Verify unauthenticated access, public pages, metadata, public APIs, application logs, and browser-visible configuration expose no job descriptions, generated content, provider keys, model/limit settings, complete prompts, or raw responses.
- [x] 7.4 Verify there is no endpoint or UI control for submission, job-site operation, employer contact, message sending, resume upload, interview scheduling, or automatic status/date changes.

## 8. Documentation and Final Validation

- [x] 8.1 Update API and operations documentation for the reusable AI drafting architecture, shared rate/usage/input/output limit budget, deterministic mock development, job-description privacy, transient review, evidence-derived skills, and the in-memory multi-instance limitation.
- [x] 8.2 Document `AI_DRAFT_MAX_INPUT_CHARACTERS`, the existing reused AI environment variables, the absence of browser secrets or a second provider configuration, and the requirement to enable mock mode before real-provider smoke testing.
- [x] 8.3 Run Prisma validation/generation, formatting, linting, type checks, unit tests, API E2E, Playwright E2E, production builds, Docker builds, and strict OpenSpec validation; resolve all failures without calling the real AI provider.
