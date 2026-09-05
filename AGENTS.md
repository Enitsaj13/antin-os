# Repository Instructions

`antin-os` is a developer career app with a public portfolio and private owner
tools. These instructions apply throughout the repository. Keep detailed setup
and operational procedures in the documentation linked from `README.md`.

## Session Startup

1. Read `README.md` as the repository and documentation map.
2. Run `git status --short --branch` and `git log -5 --oneline`. Preserve existing
   work and use the current branch unless the task includes switching branches.
3. Run `pnpm exec openspec list` to discover active changes. Select the change
   named by the user or matching the task; unrelated active changes are not scope.
4. Read the selected change's proposal, design, tasks, and delta specs, plus any
   relevant established specs under `openspec/specs/`. For tasks without a matching
   change, read only the specs and implementation relevant to the request.
5. Use `rg` for focused searches. Read additional documentation when linked from
   `README.md` or required by the task. Read `openspec/changes/archive/` only when
   historical context is needed.

## Project Boundaries

- `apps/api`: NestJS API. Keep HTTP validation and authentication in DTOs/guards,
  domain behavior in services, and persistence in Prisma. Reuse `configureApp`
  from `apps/api/src/app.setup.ts` in integration tests.
- `apps/web`: Vite, React, and Tailwind. Follow existing admin/public components
  and TanStack Query hooks in `src/queries/` and `src/mutations/`. Preserve form
  input on failure and reconcile query state after confirmed updates.
- `packages/shared`: Shared TypeScript contracts, constants, and utilities.
  Keep this package usable by both apps and free of server-only dependencies.
- `packages/api-client`: Typed HTTP access used by the web app. Preserve session
  credentials and update client methods when API contracts change.
- For contract changes, update shared types, API validation/response mapping,
  client methods, UI consumers, and affected fixtures together. Keep Prisma
  records and private fields out of public response contracts.
- Reuse neighboring patterns and existing dependencies. Keep refactors scoped to
  the requested behavior.

## OpenSpec Workflow

- Use the matching OpenSpec workflow for new capabilities or changes to specified
  behavior. Keep proposal, design, delta specs, and tasks coherent with the
  implementation. Use the repository's OpenSpec skills when applicable.
- Documentation, tooling edits, and fixes that restore existing specified
  behavior do not need a new proposal unless the user requests one.
- Update the selected change's `tasks.md` as work is completed. Mark validation
  tasks complete only after the checks have passed; the archive hook uses these
  checkboxes to identify completed changes.
- When the task includes committing a completed change, allow the post-commit
  hook to perform synchronization and archiving. Do not also archive it manually.
- When no commit is requested, use the scoped OpenSpec archive workflow manually
  for the completed change. Preserve unrelated changes.
- After either flow, inspect OpenSpec status, Git status, and recent commits.
- Update the `README.md` Status section when high-level capabilities change and
  update the relevant documentation when setup or runtime behavior changes.

## Commands and Verification

Run commands from the repository root. Use the pnpm version pinned in
`package.json` and the Node version configured in `.github/workflows/ci.yml`.
`make help`, `Makefile`, package scripts, and `.github/workflows/ci.yml` define
the commands and checks. See
`docs/development/command-reference.md` for the full command reference.

| Purpose                           | Command                              |
| --------------------------------- | ------------------------------------ |
| Check formatting of touched files | `pnpm exec prettier --check <files>` |
| API unit tests                    | `pnpm --filter api test`             |
| Web component tests               | `pnpm --filter web test`             |
| Fast commit tests for both apps   | `make test`                          |
| Lint and type checks              | `make lint typecheck`                |
| API integration tests             | `make e2e-api`                       |
| Browser tests                     | `make e2e`                           |
| Production builds                 | `make build`                         |
| Strict OpenSpec validation        | `make spec-validate`                 |
| Full feature completion gate      | `make check`                         |

- Start with checks covering the affected behavior. Add regression tests for
  behavior changes and bug fixes. For documentation-only edits, check formatting,
  referenced paths, and command accuracy; application tests are unnecessary.
- Before declaring a feature complete, run `make check`. Validate Prisma and
  test migrations when the schema changes; build Docker images when container or
  deployment behavior changes. Report unavailable checks and skipped tests.
- For job-application or job-assistant changes, `make check` counts as complete
  only when `JOB_APPLICATION_TEST_DATABASE_URL` points to a migrated disposable
  database and the output confirms that the PostgreSQL suite ran without skipping.
- API and web test/build scripts build their shared dependencies through lifecycle
  scripts. Direct tool invocations can bypass those steps; build shared packages
  first when needed. Regenerate Prisma before checks that depend on schema changes.
- `pnpm lint` includes API ESLint with `--fix`, so it can edit files. Inspect the
  resulting diff. Format touched files instead of applying repository-wide fixes
  to unrelated work.
- The job-application PostgreSQL suite requires `JOB_APPLICATION_TEST_DATABASE_URL`
  and skips without it. Use a migrated, disposable test database: the suite deletes
  job-application records. A passing default E2E command does not prove this suite
  ran. Existing Playwright tests mock API routes; they do not verify persistence.

## Database, Privacy, and AI

- Schema changes belong in `apps/api/prisma/schema.prisma` with a new migration
  under `apps/api/prisma/migrations/`. Preserve applied migrations. Run
  `pnpm --filter api prisma validate` and `make prisma-generate`; do not hand-edit
  generated clients or build output.
- `make migrate` runs `prisma migrate dev` against the configured database. Use
  `prisma migrate deploy` for applying committed migrations in CI/deployment.
  Database resets and restores require explicit task scope; retain the backup
  safeguards documented in `docs/development/command-reference.md`.
- Owner management and job-application routes require `OwnerAuthGuard`. Public
  endpoints expose only the intended published fields. Keep job descriptions,
  application notes, and generated job-assistant content private.
- Keep credentials in server environment configuration. Commit example placeholders
  only; keep `.env` files and `.backups/` out of Git. AI credentials and provider
  configuration must never be exposed through `VITE_*` variables or browser code.
- Reuse `apps/api/src/ai-drafting/` for AI configuration, provider execution, and
  shared limits. Use `AI_DRAFTING_ENABLED=true` and `AI_PROVIDER=mock` for automated
  tests and local smoke checks. Real provider calls must be intentional task scope.
- Preserve strict structured output, bounded input, safe errors, and evidence
  validation. Generated results remain transient until explicit owner review and
  acceptance; generation must not save records or contact employers. See
  `docs/specs/ai-drafting.md` for the detailed contract.

## Git and Handoff

- Commit, push, or publish when included in the user's task. Stage only the intended
  changes. `.github/workflows/pull-request-metadata.yml` creates or refreshes PR
  details after branch pushes, including manual terminal pushes. For agent-assisted
  commit-and-push requests, verify the resulting PR and report its URL.
- For commit-and-push work starting on the repository's default branch or shared
  `dev` branch, create a descriptive task branch unless the user specifies a
  branch or requests a direct push. Use the requested PR base, an existing PR's
  base, or the repository's default branch for a new PR.
- Use Conventional Commit subjects and PR titles: `type(optional-scope): summary`.
  Supported types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, and `revert`. Use `feat` for new behavior, `fix` for bug
  fixes, and `chore` for maintenance. Examples: `feat(jobs): add interview prep`,
  `fix(api): preserve job descriptions`, and `chore: update tooling`.
  Use `!` and a `BREAKING CHANGE:` footer when appropriate.
- Inspect the staged diff to write the commit message. For nontrivial changes,
  include a body explaining the problem, meaningful changes, and relevant checks
  actually run. Keep the subject concise and separate the body with a blank line.
- The pre-commit hook runs `pnpm test:commit`. The post-commit hook runs
  `pnpm openspec:archive-complete --commit`: when `openspec/` is clean, it scans all
  completed changes, syncs their specs, archives them, validates, and may create an
  additional `chore(openspec): archive completed changes` commit. Inspect task
  completion before committing and inspect status/history afterward.
- Keep the hooks enabled and avoid duplicating an archive already performed by
  the hook. A successful commit alone does not establish that post-commit
  archiving succeeded; inspect its output and any remaining changes.
- After a successful branch push, allow the metadata workflow to create or refresh
  the PR before making manual edits. It creates drafts against the default branch
  and respects an existing PR's base and draft/ready state. If a different base is
  requested, create the PR with that base before pushing subsequent updates.
- If the workflow is unavailable, use an authenticated GitHub connector or `gh`
  to find the existing open PR before creating one. Preserve its draft/ready state;
  create a draft if work or required validation is incomplete. Setup and recovery
  instructions are in `docs/development/ci.md`.
- Write the PR title and body from the full branch diff and commits relative to
  its base. The automatic OpenSpec archive commit must not become the title of a
  feature PR. Use `.github/pull_request_template.md` for manual context. Add the
  problem and outcome, actual validation results, and applicable deployment notes
  outside the `antin-os:pr-summary:start` / `antin-os:pr-summary:end` HTML markers;
  the workflow replaces the content between them on each push. Preserve useful
  human-authored context and links when updating an existing description.
- When using `gh`, supply an explicit `--title` and write the Markdown body to a
  temporary file passed with `--body-file`. Read back the PR title/body and verify
  the base/head branches. Report the PR URL; if GitHub authentication or access
  prevents creation/update, report the blocker and provide the prepared metadata.
- Report what changed, the checks actually run, skipped or failed checks, and
  remaining manual work. Include the branch/commits when relevant and identify
  uncommitted files. Do not claim the full gate passed after only focused checks.
