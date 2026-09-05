<!--
Use a Conventional Commit title: type(optional-scope): summary
Examples: feat(jobs): add interview preparation; chore: update repository tooling.
Summarize the whole branch, including implementation commits before any automatic
OpenSpec archive commit. Replace these prompts with concrete details.
The Pull Request Metadata workflow will add generated commit and file details.
Keep manual notes outside its antin-os:pr-summary:start/end HTML markers.
-->

## Summary

<!-- Explain the problem and the resulting behavior in one or two sentences. -->

## Changes

<!-- List the meaningful changes. Include API, UI, database, or documentation
details only when they help a reviewer understand the result. -->

## Validation

<!-- List the commands actually run and their outcomes. State skipped, failed,
or unavailable checks explicitly. For job-application or job-assistant changes,
confirm that the PostgreSQL suite ran without skipping against a migrated,
disposable test database configured with JOB_APPLICATION_TEST_DATABASE_URL. -->

## Deployment notes

<!-- Include required migrations, environment changes, or manual follow-up.
Remove this section when it does not apply. Link related issues or OpenSpec
artifacts when relevant; do not invent issue numbers or completion claims. -->
