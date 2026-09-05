# Shared AI Drafting and Job Assistant

The API has one reusable structured AI drafting path for project case-study
drafts and the private job-application assistant. AI configuration, credentials,
timeouts, input/output bounds, rate limits, usage limits, provider execution,
and safe errors remain inside the NestJS API. The browser receives no provider
key, model name, limit configuration, complete prompt, or raw provider response.

## Architecture

`AiDraftingModule` owns a singleton configuration, in-memory limiter, structured
provider, and runner. Domain services supply fixed trusted instructions, a strict
JSON Schema, serialized domain input, a normalizer, and a deterministic mock
factory. The OpenAI adapter uses the Responses API with strict structured output,
an abort signal, the configured output-token bound, and `store: false`.

Case-study and job-assistant requests consume the same configured rate and usage
budgets. These counters live in one API process: they reset on restart and do not
coordinate between multiple replicas. Production deployments that scale the API
horizontally need a shared limiter before treating the configured windows as
global limits.

No provider fallback exists. Invalid configuration, timeouts, malformed output,
and provider failures return application-safe errors instead of switching models,
providers, or unstructured output.

## Job assistant API

All job-application routes require the owner session. Generate one transient
result with:

```http
POST /job-applications/:id/assistant
Content-Type: application/json

{"operation":"analyze"}
```

The closed operations are `analyze`, `interviewQuestions`, `selfIntroduction`,
`coverLetter`, `followUpMessage`, and `nextAction`. Every response includes the
selected operation, `sourceUpdatedAt`, confirmation guidance, and only that
operation's normalized fields.

The server reloads the selected job and builds a bounded evidence snapshot from:

- profile full name, headline, and biography;
- managed projects, tech stacks, and case studies, including private records;
- managed experience dates, summaries, achievements, and technologies.

Skill matches are derived only from profile headline/biography, project summary,
description, tech stack and case-study fields, or experience achievements and
technologies. Matches cite stable safe source ids, labels, and fields. Contact
details, social links, location, resume files/metadata, storage keys, credentials,
authentication data, unrelated jobs, and unrelated application notes are not
provider input.

Job descriptions and portfolio text are serialized as untrusted data. Fixed
instructions prohibit source text from changing the operation, inventing facts,
using tools, browsing, sending messages, contacting employers, or submitting an
application. The provider receives no such capabilities.

Generation never writes to the database. Review state remains in the protected
React screen until the owner copies, cancels, or explicitly previews and confirms
an existing job-application update. Generated history and AI provenance are not
stored. Job descriptions and generated content never appear on public routes.

## Runtime configuration

All variables are API-only:

```bash
AI_DRAFTING_ENABLED=false
AI_PROVIDER=
OPENAI_API_KEY=
OPENAI_MODEL=
AI_DRAFT_TIMEOUT_MS=30000
AI_DRAFT_RATE_LIMIT=5/60
AI_DRAFT_USAGE_LIMIT=25/86400
AI_DRAFT_MAX_INPUT_CHARACTERS=60000
AI_DRAFT_MAX_NOTES_LENGTH=2000
AI_DRAFT_MAX_OUTPUT_TOKENS=1200
```

`AI_DRAFT_MAX_INPUT_CHARACTERS` must be a positive integer. The runner measures
the normalized serialized domain payload before provider execution and rejects
oversized input without truncating evidence. The output-token value is passed to
the structured provider. Rate and usage values use `count/windowSeconds`.

Use deterministic mock mode for development, automated tests, deployment smoke
checks, and the first verification after changing AI configuration:

```bash
AI_DRAFTING_ENABLED=true
AI_PROVIDER=mock
```

Mock mode makes no provider call. Only after mock behavior passes should an
operator intentionally set `AI_PROVIDER=openai` with `OPENAI_API_KEY` and
`OPENAI_MODEL` in the API runtime. Never create a `VITE_*` AI variable or a
second browser/provider configuration.
