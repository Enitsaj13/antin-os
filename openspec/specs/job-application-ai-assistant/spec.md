# job-application-ai-assistant Specification

## Purpose
Provide the authenticated portfolio owner with a private, evidence-grounded assistant for understanding a selected job and preparing reviewed application material without inventing qualifications or acting on the owner's behalf.
## Requirements
### Requirement: Analyze a selected job description

The system SHALL let the authenticated owner request structured analysis for an existing job application that has a non-empty job description. The analysis SHALL include suggested company and position values plus separate ordered collections of responsibilities, required skills, preferred skills, and keywords derived from the job description, and SHALL NOT modify the stored job application.

#### Scenario: Extract structured job details

- **WHEN** the authenticated owner requests analysis for an existing application with a job description
- **THEN** the system returns normalized suggested company, suggested position, responsibilities, required skills, preferred skills, and keywords derived from that job description
- **AND** leaves the stored application unchanged

#### Scenario: Reject analysis without source material

- **WHEN** the authenticated owner requests analysis for an application whose job description is empty
- **THEN** the system returns an actionable validation error
- **AND** does not call the AI provider

#### Scenario: Reject analysis for a missing application

- **WHEN** the authenticated owner requests analysis for a job-application identifier that does not exist
- **THEN** the system returns HTTP 404
- **AND** does not call the AI provider

### Requirement: Compare requirements with verified portfolio evidence

The assistant SHALL compare extracted responsibilities and required or preferred skills only with relevant fields from the owner's managed profile, projects, and experience. Owner skill evidence SHALL be derived from managed profile headline/biography content, experience technologies/achievements, and project tech stacks, summaries, and case studies; this capability SHALL NOT require or imply a separate stored skills catalog. The comparison SHALL distinguish supported matching qualifications, honest skill or experience gaps, and unknown or ambiguous requirements. Every claimed match SHALL identify the supporting source record or source field, and missing evidence SHALL NOT be rewritten as a qualification.

#### Scenario: Identify an evidence-backed match

- **WHEN** a job requirement is supported by a managed project, experience, or profile field
- **THEN** the assistant classifies it as a match
- **AND** identifies the portfolio evidence supporting the classification

#### Scenario: Identify an honest gap

- **WHEN** no managed profile, project, or experience evidence supports a required skill or qualification
- **THEN** the assistant classifies the item as a gap or unknown
- **AND** does not imply that the owner has the unsupported qualification

#### Scenario: Derive owner skills from managed evidence

- **WHEN** the assistant evaluates whether the owner has a required or preferred skill
- **THEN** it uses only skill evidence present in the managed profile, experience, or project sources
- **AND** identifies the supporting source instead of treating an inferred or unstored skill as verified

#### Scenario: Preserve ambiguity

- **WHEN** the job description or portfolio evidence is insufficient to determine whether a requirement is met
- **THEN** the assistant marks the comparison as needing owner confirmation instead of guessing

### Requirement: Generate job-scoped preparation and communication drafts

The assistant SHALL let the authenticated owner generate one selected output for the current job application: tailored interview questions with editable suggested answers, a self-introduction, a cover-letter draft, a follow-up-message draft, or a suggested next action. Generated output SHALL be based on the stored job description and verified portfolio evidence, SHALL be returned in a normalized structured contract, and SHALL identify statements that need owner confirmation.

#### Scenario: Generate interview questions

- **WHEN** the owner selects interview-question generation for an analyzed job
- **THEN** the system returns questions and editable suggested answers tailored to the extracted responsibilities, required skills, preferred skills, keywords, and the owner's supported evidence or gaps
- **AND** each suggested answer identifies the evidence it relies on or marks unsupported portions for owner confirmation

#### Scenario: Avoid inventing a suggested answer

- **WHEN** the available portfolio evidence cannot support a truthful suggested answer to an interview question
- **THEN** the system provides honest preparation guidance, identifies the gap, or marks the answer as needing owner confirmation
- **AND** does not construct a first-person claim that the owner has the missing experience or skill

#### Scenario: Generate a tailored communication draft

- **WHEN** the owner selects self-introduction, cover-letter, or follow-up-message generation
- **THEN** the system returns an editable draft tailored to the selected job
- **AND** excludes unsupported experience, qualifications, metrics, and outcomes

#### Scenario: Suggest a next action

- **WHEN** the owner requests a next-action suggestion
- **THEN** the system returns a concise recommendation and rationale based on the stored application state and available dates
- **AND** does not change the application's status, dates, notes, or follow-up notes

#### Scenario: Normalize provider output

- **WHEN** the provider returns a generated response
- **THEN** the API validates, trims, and normalizes it before returning only the supported output fields and confirmation guidance

### Requirement: Prevent unsupported claims

The assistant MUST NOT invent or embellish experience, qualifications, skills, responsibilities, clients, dates, employers, metrics, achievements, or outcomes. Content not directly supported by the selected job description and managed portfolio evidence SHALL be omitted, described as a gap, or clearly marked for owner confirmation.

#### Scenario: Omit an unsupported metric

- **WHEN** no source record supports a numerical result or performance claim
- **THEN** generated content omits the metric
- **AND** does not replace it with an invented approximation

#### Scenario: Flag a plausible but unsupported claim

- **WHEN** the provider proposes a statement that is plausible but not supported by the supplied evidence
- **THEN** the normalized result excludes the statement from verified content or lists it as needing owner confirmation

### Requirement: Keep generated content non-persistent until explicit review

Generating or regenerating assistant content SHALL NOT create, update, delete, submit, or change a job application. The owner SHALL be able to review and edit generated content before copying it or explicitly applying a reviewed value through the normal authenticated job-application update behavior. The interface SHALL warn before an explicit apply action replaces unsaved or stored text.

#### Scenario: Generate without saving

- **WHEN** an assistant request succeeds
- **THEN** the result is held in editable review state
- **AND** no job-application field or separate generated-content record is created or updated

#### Scenario: Apply a reviewed field explicitly

- **WHEN** the owner reviews a suggested company, position, note, or follow-up message and explicitly chooses to apply it
- **THEN** the reviewed value is submitted through the normal job-application update behavior
- **AND** only the field confirmed by the owner is changed

#### Scenario: Warn before replacing text

- **WHEN** applying reviewed content would replace unsaved form input or non-empty stored text
- **THEN** the interface identifies the affected field and requires confirmation before replacement

#### Scenario: Discard an unaccepted draft

- **WHEN** the owner cancels or leaves the assistant review without applying content
- **THEN** the transient generated content is discarded
- **AND** the stored application remains unchanged

### Requirement: Never act on an application autonomously

The assistant SHALL NOT submit a job application, operate or browse an external job site, send a message, contact an employer, upload a resume, schedule an interview, or automatically change an application status or date. It SHALL provide text and suggestions for owner review only.

#### Scenario: Generate application material

- **WHEN** the assistant produces a cover letter, follow-up message, or next-action suggestion
- **THEN** it returns the content to the authenticated review interface only
- **AND** performs no external action

#### Scenario: Decline an automatic submission path

- **WHEN** any assistant request or provider response implies submitting or sending content automatically
- **THEN** the system does not expose or execute such an action

### Requirement: Protect job-search and portfolio source data

Every assistant endpoint and interface MUST require a valid owner session. The server SHALL send the AI provider only the selected application's required job fields and bounded professional evidence from the owner's managed profile, projects, and experience. It SHALL exclude authentication data, provider credentials, profile contact details, resume files, storage credentials, unrelated private data, and public exposure of job descriptions or generated content. Complete prompts, job descriptions, evidence payloads, and raw provider responses SHALL NOT be written to application logs or persisted as AI history.

#### Scenario: Reject unauthenticated assistant access

- **WHEN** a request without a valid owner session calls a job-application assistant endpoint
- **THEN** the API returns HTTP 401
- **AND** discloses no application, portfolio, prompt, or generated data

#### Scenario: Minimize provider source data

- **WHEN** the server constructs a provider request
- **THEN** it includes only the selected job source and bounded professional evidence needed for the requested output
- **AND** excludes contact details, authentication data, resume files, credentials, secrets, and unrelated private records

#### Scenario: Keep assistant data out of public behavior

- **WHEN** any public API, page, metadata response, or portfolio route is requested
- **THEN** it exposes no job description, assistant analysis, generated draft, gap analysis, prompt, or indication that assistant content exists

### Requirement: Reuse protected AI provider controls

Job-application assistant requests SHALL use the existing server-side AI enablement, provider selection, credentials, model configuration, timeout, rate limit, usage limit, output-token limit, error mapping, and deterministic mock-mode behavior. They SHALL also enforce a server-configurable maximum input length across the normalized job-description and professional-evidence payload before provider execution. Provider credentials, model configuration, input/output limits, and other private configuration MUST NOT be sent to the browser. The system SHALL validate provider output and SHALL NOT silently fall back to unstructured output, another model, or another provider.

#### Scenario: Use deterministic mock mode

- **WHEN** AI drafting is enabled with the mock provider
- **THEN** authenticated assistant requests return deterministic structured results without a paid or external provider call

#### Scenario: Reject disabled or invalid configuration

- **WHEN** AI drafting is disabled or its required server configuration is incomplete
- **THEN** the assistant returns an actionable disabled or configuration state
- **AND** does not call an external provider

#### Scenario: Enforce request controls

- **WHEN** an assistant request exceeds the configured rate limit or usage limit, or the provider exceeds the configured timeout
- **THEN** the API stops or rejects the request with the corresponding application-safe error

#### Scenario: Reject an oversized provider input

- **WHEN** the normalized job-description and professional-evidence payload exceeds the configured maximum input length
- **THEN** the API returns an actionable input-length error
- **AND** does not call the AI provider or silently truncate source evidence

#### Scenario: Reject malformed provider output

- **WHEN** provider output is incomplete or does not match the requested structured contract
- **THEN** the API returns an application-safe malformed-response error
- **AND** does not return partial provider-native content

### Requirement: Provide an accessible assistant review workflow

The protected job-application interface SHALL provide keyboard-accessible controls to choose an assistant output, generate it, review and edit it, copy it, explicitly apply supported fields, cancel it, and retry recoverable failures. It SHALL prevent duplicate requests while generation is pending and display accessible pending, disabled, configuration, input-length, rate-limit, usage-limit, timeout, malformed-response, provider-error, and retry states.

#### Scenario: Review generated content with a keyboard

- **WHEN** the owner uses only a keyboard in the assistant workflow
- **THEN** output selection, generation, review fields, copy, apply, confirmation, cancel, and retry controls are reachable and meaningfully labeled

#### Scenario: Prevent duplicate generation

- **WHEN** an assistant request is pending
- **THEN** the initiating generation control remains disabled until the request completes or fails

#### Scenario: Recover from a provider failure

- **WHEN** generation fails with a recoverable application-safe error
- **THEN** the interface preserves the selected application and requested output
- **AND** presents appropriate recovery guidance and a retry action

