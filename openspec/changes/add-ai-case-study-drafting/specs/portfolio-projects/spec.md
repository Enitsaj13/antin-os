## ADDED Requirements

### Requirement: Generate project case-study drafts with AI
The system SHALL provide authenticated project-scoped behavior that generates an editable case-study draft from an existing portfolio project and optional owner notes.

#### Scenario: Generate draft for existing project
- **WHEN** an authenticated owner requests an AI case-study draft for an existing project with optional notes
- **THEN** the system loads the managed project before generation and returns structured draft fields for context, problem, role, approach, responsibilities, technical challenges, outcomes, lessons learned, and needs-confirmation guidance

#### Scenario: Limit source data for generation
- **WHEN** the system prepares a project case-study draft request
- **THEN** it sends only required project fields and optional owner notes as source material and excludes profile contact details, authentication data, resume files, credentials, unrelated projects, secrets, and unrelated portfolio data

#### Scenario: Include confirmation guidance
- **WHEN** generated content contains claims, gaps, assumptions, metrics, responsibilities, or outcomes that are not directly supported by the project record or owner notes
- **THEN** the system identifies those items as needing owner confirmation instead of presenting them as verified facts

#### Scenario: Avoid unsupported claims
- **WHEN** project information and owner notes do not support a responsibility, metric, outcome, or business result
- **THEN** the generated draft omits the unsupported claim or marks the missing information for confirmation

#### Scenario: Enforce owner notes length
- **WHEN** the owner notes exceed the configured maximum notes length
- **THEN** the system rejects the draft-generation request with a validation error and does not call the AI provider

#### Scenario: Return normalized structured output
- **WHEN** the AI provider returns a draft response
- **THEN** the system validates and normalizes the response before returning only the supported case-study draft fields and needs-confirmation guidance

#### Scenario: Reject missing project
- **WHEN** an authenticated owner requests an AI case-study draft for a project that does not exist
- **THEN** the system returns a not found error and does not call the AI provider

#### Scenario: Reject unauthenticated drafting
- **WHEN** project case-study draft generation is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not call the AI provider

### Requirement: Keep AI draft generation non-persistent until manual acceptance
The system SHALL NOT automatically save, overwrite, publish, or expose generated case-study draft content.

#### Scenario: Return draft without saving
- **WHEN** the AI draft generation request succeeds
- **THEN** the system returns the generated draft without creating or updating a stored project case study

#### Scenario: Preserve existing case study during generation
- **WHEN** the selected project already has a case study and the owner generates an AI draft
- **THEN** the existing stored case study remains unchanged unless the owner later saves reviewed content through the normal case-study save behavior

#### Scenario: Save accepted draft as unpublished
- **WHEN** the owner manually accepts reviewed generated content and saves it as a case study
- **THEN** the system stores the case study with `isPublic` set to false unless the owner separately uses the existing publish behavior

#### Scenario: Publish separately
- **WHEN** the owner saves an accepted AI draft as an unpublished case study
- **THEN** the saved case study does not appear publicly until the owner performs a separate publish action

#### Scenario: Do not expose generated drafts publicly
- **WHEN** public project list or detail APIs are requested after draft generation but before an explicit save and publish
- **THEN** the public responses do not include generated draft content and do not reveal that AI drafting occurred

### Requirement: Protect AI provider credentials and drafting limits
The system SHALL keep AI provider access server-side and enforce safeguards for rate limits, usage limits, timeouts, and provider failures.

#### Scenario: Keep provider secrets server-side
- **WHEN** the admin web app requests or renders AI case-study drafting behavior
- **THEN** AI provider API keys, credentials, model identifiers, timeout values, usage-limit settings, and other private provider configuration are never sent to the browser

#### Scenario: Disable generation when drafting is off
- **WHEN** AI drafting is disabled by configuration
- **THEN** the system rejects draft-generation requests with an actionable disabled state and does not call the AI provider

#### Scenario: Reject missing provider configuration
- **WHEN** required server-side AI provider configuration is missing or inconsistent
- **THEN** the system rejects draft-generation requests with an actionable configuration state and does not call the AI provider

#### Scenario: Allow zero-cost mock mode
- **WHEN** the deployment is configured for mock AI drafting
- **THEN** authenticated draft-generation requests return deterministic structured draft content without calling an external AI provider

#### Scenario: Require structured provider responses
- **WHEN** the configured AI provider cannot return a strict structured response matching the case-study draft contract
- **THEN** the system rejects the generation attempt with a malformed-response or configuration error and does not fall back to unstructured text

#### Scenario: Rate-limit draft generation
- **WHEN** authenticated draft-generation requests exceed the configured rate limit
- **THEN** the system rejects additional requests with a rate-limit error and does not call the AI provider

#### Scenario: Enforce usage limits
- **WHEN** draft generation would exceed the configured usage limit for the owner or deployment
- **THEN** the system rejects the request with a usage-limit error and does not call the AI provider

#### Scenario: Handle provider timeout
- **WHEN** the AI provider does not return a draft before the configured timeout
- **THEN** the system returns a timeout error state and does not save any generated content

#### Scenario: Handle malformed provider response
- **WHEN** the AI provider returns malformed, incomplete, or unsupported structured data
- **THEN** the system returns a malformed-response state and does not save any generated content

#### Scenario: Handle provider failure
- **WHEN** the AI provider returns an error
- **THEN** the system returns a provider-error state without exposing provider secrets or raw provider internals and does not save any generated content

#### Scenario: Avoid sensitive logging
- **WHEN** the system handles AI draft generation, success, or failure
- **THEN** it does not log API keys, authorization headers, complete prompts, owner notes, raw AI provider responses, or provider secrets

#### Scenario: Keep public chatbot out of scope
- **WHEN** a public visitor opens public portfolio routes
- **THEN** the system does not expose an AI chatbot, public AI drafting entry point, or public AI provider interaction

### Requirement: Review and accept AI case-study drafts in admin
The system SHALL provide an authenticated admin review flow that lets the owner inspect and edit every generated field before saving it.

#### Scenario: Start draft flow from project management
- **WHEN** the authenticated owner opens project management
- **THEN** the system provides an AI case-study draft flow that starts by selecting an existing project

#### Scenario: Add optional owner notes
- **WHEN** the owner starts the AI draft flow for a selected project
- **THEN** the system allows optional notes to be provided as source material for generation

#### Scenario: Generate and review draft
- **WHEN** the owner submits the selected project and optional notes for generation
- **THEN** the system displays the generated draft in editable fields before any case-study save occurs

#### Scenario: Edit generated fields
- **WHEN** the generated draft is displayed
- **THEN** the owner can edit context, problem, role, approach, responsibilities, technical challenges, outcomes, lessons learned, and confirmation-needed information before accepting the draft

#### Scenario: Manually accept generated content
- **WHEN** the owner chooses to accept the reviewed draft
- **THEN** the system copies the reviewed draft into the case-study save workflow without publishing it automatically

#### Scenario: Warn before replacing unsaved form values
- **WHEN** accepting generated content would replace unsaved case-study form values
- **THEN** the admin UI warns the owner and requires confirmation before replacing the unsaved form values

#### Scenario: Cancel generated draft
- **WHEN** the owner cancels or leaves the AI draft review before saving
- **THEN** the system discards unsaved generated content without changing the stored case study

#### Scenario: Prevent duplicate generation requests
- **WHEN** an AI draft-generation request is pending
- **THEN** the admin UI prevents duplicate generation submissions for the same flow

#### Scenario: Display generation states
- **WHEN** the AI draft flow is pending, disabled, missing configuration, rate-limited, usage-limited, timed out, receives a malformed response, fails because of a provider error, or can be retried
- **THEN** the admin UI displays an accessible state with recovery guidance where applicable
