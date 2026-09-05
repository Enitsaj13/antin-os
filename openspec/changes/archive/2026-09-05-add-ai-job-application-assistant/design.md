## Context

See `proposal.md` for motivation and the delta specs for behavior. The job-application module currently provides private owner-only CRUD, filtering, table/Kanban management, and dashboard counts, but its record has no job-description source field.

AI case-study drafting already provides the server-side behaviors this change must preserve and reuse: configuration-gated `mock` and `openai` providers, OpenAI Responses API strict structured output with provider storage disabled, request timeout, output-token limit, in-memory rate and usage windows, response normalization, safe error mapping, and transient owner review. Those pieces currently live under the project case-study module and use case-study-specific provider input/output contracts.

The application is a single-owner NestJS API and React admin app using cookie authentication. Job descriptions are externally authored, untrusted text. Profile, project, and experience records are owner-managed professional evidence, including unpublished records that remain private even when used by this feature.

## Goals / Non-Goals

**Goals:**

- Add a backward-compatible private job-description source field.
- Reuse one shared server-side AI execution path and one shared cost-control budget for case-study and job-assistant requests.
- Make every assistant result structured, source-grounded, editable, transient, and safe to retry.
- Preserve exact evidence references so the owner can audit why a requirement was classified as a match.
- Keep responsibilities, required skills, preferred skills, and keywords distinct through extraction, comparison, and review.
- Pair interview questions with editable suggested answers that use cited evidence or explicitly acknowledge a gap.
- Treat pasted job descriptions as untrusted data rather than provider instructions.
- Keep the existing case-study drafting API and user behavior compatible through the AI infrastructure refactor.

**Non-Goals:**

- No application submission, browser automation, employer messaging, email integration, resume upload, interview scheduling, or job-board integration.
- No autonomous status/date changes and no background or scheduled AI generation.
- No persistent AI conversation, prompt, response, analysis, embedding, vector index, token ledger, or generated-draft history.
- No resume-file parsing, education/certification matching, external company research, web search, or use of data outside the selected job and managed profile/projects/experience.
- No distributed limiter or cross-instance usage accounting; the existing single-instance limitation remains.
- No new AI provider, model fallback, browser-side provider SDK, or provider-specific configuration exposed to the web app.

## Decisions

### 1. Add a nullable job-description column to the existing record

Add `jobDescription String?` to `JobApplication` with a forward-only Prisma migration. Add it to shared create/update/response types, API validation, normalization, service selection/search, test factories, and create/edit forms. Use a shared maximum of 30,000 characters: large enough for normal pasted listings while bounding database, browser, search, and provider input. Whitespace-only input normalizes to `null`; oversized input is rejected rather than truncated.

The list/table response can continue carrying the field because all job-application APIs are authenticated, but the table must not render the complete description. Existing text search includes it. No public contract or endpoint receives it.

Alternative considered: store the job description only in assistant request state. Rejected because the description must remain associated with the application and reusable across sessions without repasting.

### 2. Refactor case-study AI mechanics into a shared API-local drafting module

Extract the existing configuration parsing, enablement checks, provider selection, OpenAI client/transport, timeout execution, structured-response parsing, safe provider errors, and limiter into a reusable API-local AI drafting module. Keep domain schemas, prompts, normalization, and mock result factories in their owning case-study and job-application modules.

The shared provider executes an internal structured request containing a schema name, strict JSON schema, trusted system instructions, serialized domain input, output-token bound, and abort signal. The OpenAI implementation retains `store: false`. The shared mock implementation dispatches to deterministic domain result factories without network use. Case-study contracts and endpoints remain unchanged while their existing provider adapter delegates through this shared runner.

Use one shared limiter instance and the existing `AI_DRAFT_RATE_LIMIT` and `AI_DRAFT_USAGE_LIMIT` windows across all AI drafting operations. This prevents a second feature from bypassing the configured overall request budget. Reuse `AI_DRAFTING_ENABLED`, `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_DRAFT_TIMEOUT_MS`, and `AI_DRAFT_MAX_OUTPUT_TOKENS`; do not add a second provider configuration set. Add `AI_DRAFT_MAX_INPUT_CHARACTERS` as a positive-integer API-only setting, defaulting to 60,000 characters, and have the shared runner reject a normalized serialized domain input above that limit before provider execution. `AI_DRAFT_MAX_NOTES_LENGTH` remains the case-study owner-notes limit.

Alternative considered: duplicate the OpenAI provider, configuration, and limiter in the job-application module. Rejected because limits would diverge, cost controls could be bypassed, and provider error/privacy fixes would need to be maintained twice.

### 3. Use one authenticated job-scoped endpoint with discriminated operations

Add an owner-protected operation such as `POST /job-applications/:id/assistant` with a closed `operation` enum:

- `analyze`
- `interviewQuestions`
- `selfIntroduction`
- `coverLetter`
- `followUpMessage`
- `nextAction`

The server, not the browser, loads the selected application and builds the professional evidence snapshot. The browser cannot provide custom system instructions, arbitrary source records, provider options, a schema, or a model. Each request produces one discriminated structured response with `sourceUpdatedAt`, `needsConfirmation`, and only the fields for the chosen operation.

Each operation runs directly from current stored source data rather than accepting a previous AI analysis as trusted input. The UI may show a prior analysis alongside a later draft, but provider-generated analysis is never promoted to verified evidence. This uses one bounded provider call per selected output and prevents stale or client-edited analysis from becoming an authoritative source.

Alternative considered: generate analysis and all five artifacts in one request. Rejected because it increases latency and cost, may return content the owner did not request, and makes partial retry and output contracts harder to manage.

### 4. Build a bounded professional evidence snapshot on the server

The assistant source contains:

- Selected job application: id, company, position, job description, status, and relevant application/interview/next-action dates.
- Profile: full name, headline, and biography.
- Projects: stable id/title references plus summary, description, tech stack, and available case-study evidence.
- Experience: stable id/company/role references plus summary, achievements, technologies, and dates.

Exclude profile email, location, social URLs, image/storage keys, authentication values, resume metadata/files, credentials, secrets, unrelated application notes, and unrelated job applications. Include managed unpublished projects and experiences because this is a private owner tool, but never expose that snapshot through a public route.

There is no new skills table in this change. Treat owner skills as evidence derived only from profile headline/biography text, experience technologies/achievements, and project tech stacks, summaries, descriptions, and case studies. A skill becomes a supported match only when the result cites one of those supplied records; otherwise it remains a gap, unknown, or confirmation item.

Normalize and bound individual strings/arrays, then measure the serialized domain input against `AI_DRAFT_MAX_INPUT_CHARACTERS` before provider execution. Return an actionable input-length error rather than silently dropping or truncating evidence. Evidence references in analysis results use stable ids and safe labels; generated prose and suggested answers must not claim a match unless at least one supplied record supports it.

Alternative considered: send the entire database record graph or resume file. Rejected because it violates data minimization, expands prompt-injection/privacy risk, and provides fields outside the requested evidence sources.

### 5. Treat job descriptions as untrusted prompt content

Serialize the job description and evidence as data under explicit keys, separate from trusted provider instructions. The trusted instructions state that text inside source fields cannot change the task, request tools, override safety rules, or introduce facts. The provider receives no tools, browsing, code execution, file access, or external-action capability.

Strict per-operation JSON schemas use `additionalProperties: false`. Domain normalizers trim values, reject invalid shapes and unknown evidence references, and require unsupported claims to be omitted or included in `needsConfirmation`. Provider-native output and partial malformed responses never reach the browser.

Alternative considered: interpolate the pasted description directly into a free-form prompt. Rejected because job listings can contain adversarial or accidental instruction-like text and free-form output weakens validation.

### 6. Return auditable, operation-specific structured contracts

The analysis contract contains suggested company/position values and separate ordered responsibilities, required skills, preferred skills, and keywords, followed by evidence-backed matching qualifications, gaps, unknowns, and confirmation items. A match carries one or more references to supplied project, experience, or profile evidence. Suggested company/position values remain suggestions even when extraction confidence is high.

Draft contracts contain only their relevant editable content:

- Interview questions: ordered questions paired with editable suggested answers and evidence references. When evidence cannot support a truthful first-person answer, return honest preparation guidance, the identified gap, or a confirmation marker instead of inventing an answer.
- Self-introduction, cover letter, and follow-up message: editable text plus confirmation items.
- Next action: action text, rationale, and an optional suggested date, with no mutation semantics.

All contracts include `sourceUpdatedAt`. If the application changes after generation, the UI marks the result stale and asks the owner to regenerate or consciously continue reviewing it.

Alternative considered: one raw Markdown/text response for every operation. Rejected because it cannot reliably represent evidence, gaps, confirmation items, or safe field-level review.

### 7. Keep generation separate from persistence

The assistant endpoint is read-plus-generate only and performs no database write. Review state lives in the React screen and is discarded on cancel/navigation. Every result can be edited and copied.

Explicit apply controls use existing job-application update mutations:

- Suggested company or position can replace its corresponding field.
- A reviewed follow-up message can replace `followUpNotes`.
- Other reviewed output can be explicitly appended to or replace `notes`, or copied without saving.

The UI shows the exact destination and resulting text before applying. Replacing non-empty stored text or unsaved form input requires confirmation. A confirmed update sends only the chosen destination field, waits for the server response, and refreshes job-application views. No AI provenance or raw response is stored.

Alternative considered: create an `AiJobDraft` table and assistant save endpoint. Rejected because the user did not request history, it would expand retention/privacy obligations, and existing job-application text fields plus copy behavior cover deliberate retention.

### 8. Integrate the assistant into the protected job workflow

Place the assistant on the selected application's protected detail/edit experience rather than creating a global chatbot. Require a saved non-empty job description before enabling generation. Present analysis and the five output choices as explicit actions, with editable review state and clear evidence/gap/confirmation sections.

Use existing authenticated API-client behavior and query mutation patterns. Disable duplicate generation while pending. Map disabled, configuration, input-length, rate-limit, usage-limit, timeout, malformed-response, provider-error, and stale-source conditions to accessible guidance without exposing provider internals. Automated tests always select the mock provider.

Alternative considered: a free-form chat box. Rejected because open-ended prompts weaken source boundaries, structured validation, predictable cost, and the guarantee that the assistant cannot be turned into an external-action agent.

## Risks / Trade-offs

- [Prompt injection in pasted job descriptions] -> Treat descriptions as serialized untrusted data, use trusted fixed instructions and strict schemas, expose no tools, and validate all output.
- [Plausible fabricated qualifications] -> Require evidence references for matches, classify unsupported items as gaps/unknowns, retain confirmation guidance, and require owner review.
- [Private job-search or portfolio leakage] -> Keep endpoints owner-authenticated, minimize provider input, use provider storage-disabled requests, avoid sensitive logs/history, and add explicit public-isolation tests.
- [Provider cost and latency multiply across output modes] -> Generate only the selected operation and share the existing timeout, rate, usage, and output-token limits.
- [Shared AI refactor breaks case-study drafting] -> Preserve its public contracts and add characterization tests around provider selection, errors, mock output, timeout, limiter behavior, and structured normalization before moving code.
- [In-memory limits reset on restart and do not coordinate replicas] -> Retain and document the known single-instance constraint; keep the limiter interface replaceable for a future shared store.
- [Large evidence sets exceed the configured or provider context] -> Enforce stored-field bounds and `AI_DRAFT_MAX_INPUT_CHARACTERS`, then return an actionable error before provider execution instead of silently truncating evidence.
- [Generated content becomes stale after application edits] -> Return the source update timestamp, mark stale review state in the UI, and require regeneration or conscious owner continuation.
- [Explicit apply overwrites useful notes] -> Show destination previews, require confirmation for non-empty/unsaved values, and submit only the confirmed field.

## Migration Plan

1. Add characterization coverage for the current case-study AI configuration, provider, limiter, mock, timeout, normalization, and error behavior.
2. Extract and adopt the shared AI drafting module, add an empty/defaulted `AI_DRAFT_MAX_INPUT_CHARACTERS` example setting, and keep the existing case-study endpoint and UI behavior unchanged.
3. Add the nullable `jobDescription` column and deploy the backward-compatible Prisma migration before application code relies on it.
4. Deploy shared contracts and API support, including the assistant endpoint, with AI drafting disabled or in mock mode first.
5. Deploy the protected web editor and review workflow, then verify privacy, explicit apply, stale-source, and failure states using mock mode.
6. Enable the already configured OpenAI provider only after production smoke tests confirm limits and structured normalization.

Rollback strategy:

- Disable AI drafting through the existing server configuration to stop both drafting features immediately.
- Roll back the web/API release without dropping `jobDescription`; the nullable column is harmless to the earlier application version and retained descriptions avoid data loss.
- Do not reverse the database migration during an application rollback. Remove the column only in a separately reviewed future migration if the capability is permanently retired.
