## Why

The private job tracker stores application progress, but the owner still has to manually interpret each job description and repeatedly turn the same verified portfolio evidence into interview and outreach material. A job-scoped AI assistant can reduce that work while remaining grounded in the owner's real profile, projects, and experience and preserving explicit human control over every saved change.

## What Changes

- Add an optional private `jobDescription` field to job-application records, contracts, validation, forms, and detail/edit behavior so each application can retain the source material used for analysis.
- Add an authenticated, job-application-scoped AI assistant that can extract suggested company and position values plus separate responsibilities, required skills, preferred skills, and keywords from the stored job description.
- Compare extracted responsibilities and skills with relevant profile, project, and experience evidence; derive owner skills from those managed sources without adding a separate skills catalog, and distinguish supported matching qualifications from honest gaps or unknowns.
- Generate selectable structured outputs for interview questions with editable evidence-grounded suggested answers, a tailored self-introduction, a cover-letter draft, a follow-up-message draft, and a suggested next action.
- Keep generated results transient until the owner reviews and edits them. Any accepted update must use an explicit owner action and the normal job-application update path; generation never changes stored application data by itself.
- Never invent experience, qualifications, metrics, skills, or outcomes, and identify unsupported or ambiguous claims as needing confirmation.
- Never submit an application, contact an employer, browse or operate an external job site, or automatically change application status or dates.
- Keep job descriptions, evidence, prompts, and generated content private, authenticated, server-side, minimally scoped, and absent from public APIs and pages.
- Reuse the existing server-side AI provider abstraction, OpenAI structured-output integration, disabled/configuration behavior, timeout, rate, usage, and output-token controls, and deterministic mock mode; add a shared server-configurable maximum input length enforced before provider execution.

## Capabilities

### New Capabilities

- `job-application-ai-assistant`: Private, evidence-grounded job-description analysis and owner-reviewed drafting for a selected job application, including safety, privacy, provider, and non-persistence rules.

### Modified Capabilities

- `job-application-tracking`: Store, validate, edit, return, search, and protect the optional private `jobDescription` source field without exposing it publicly.

## Impact

- Database and Prisma migration for the optional job-description field.
- Shared job-application request/response contracts, API client methods, validation, and generated Prisma types.
- Authenticated job-application API behavior for AI requests and explicit acceptance of reviewed field updates.
- API AI infrastructure, including extracting reusable provider/configuration/limiter behavior from the existing project case-study drafting implementation without changing that feature.
- Protected job-application create/edit/detail and assistant review interfaces, query invalidation, accessible generation states, and confirmation flows.
- API unit/E2E, web component, Playwright, privacy-isolation, mock-provider, unsupported-claim, and no-automatic-mutation tests.
- Server deployment continues to use existing AI environment variables and secrets plus a shared API-only maximum-input-length setting; no provider secret, model/limit configuration, or private job content is exposed to the browser beyond authenticated application responses.
