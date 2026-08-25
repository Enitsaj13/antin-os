## Purpose

Portfolio resume management lets AntinOS keep one current owner CV in private storage, manage its publication state safely, and expose a stable public download only when the owner has published it.

## ADDED Requirements

### Requirement: Store one current resume
The system SHALL maintain at most one current resume record containing metadata and a private storage reference.

#### Scenario: Store resume metadata only
- **WHEN** a resume PDF is uploaded successfully
- **THEN** the system stores the original filename, file size, S3 object key, publication state, upload date, update date, and id in PostgreSQL
- **AND** the system does not store PDF binary data or base64 data in PostgreSQL

#### Scenario: Preserve singleton resume
- **WHEN** a resume already exists and another valid resume is uploaded successfully
- **THEN** the system replaces the current resume metadata instead of creating a second current resume

#### Scenario: Default uploaded resume to unpublished
- **WHEN** a resume is uploaded without an explicit publication state
- **THEN** the system stores the resume as unpublished

#### Scenario: Keep private object key out of public responses
- **WHEN** resume metadata is returned from a public endpoint
- **THEN** the response does not include the private S3 object key or storage bucket details

### Requirement: Validate resume uploads
The system SHALL accept only valid PDF resume uploads within the configured size limit.

#### Scenario: Accept valid PDF upload
- **WHEN** `POST /resume` receives multipart form data with a `file` field containing a non-empty PDF whose declared MIME type and actual content are valid
- **THEN** the system accepts the file if its size is within the configured maximum upload size

#### Scenario: Reject missing file
- **WHEN** `POST /resume` receives no `file` field
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject empty file
- **WHEN** `POST /resume` receives an empty file
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject oversized file
- **WHEN** `POST /resume` receives a file larger than the configured maximum upload size
- **THEN** the system rejects the request with a file-size error

#### Scenario: Default maximum size
- **WHEN** no custom resume upload size limit is configured
- **THEN** the system uses a maximum resume upload size of 5 MB

#### Scenario: Reject non-PDF declared MIME type
- **WHEN** `POST /resume` receives a file whose declared MIME type is not `application/pdf`
- **THEN** the system rejects the request with an unsupported-media or validation error

#### Scenario: Reject non-PDF content
- **WHEN** `POST /resume` receives content that is not an actual PDF even if the filename or declared MIME type says PDF
- **THEN** the system rejects the upload

#### Scenario: Reject corrupted PDF
- **WHEN** `POST /resume` receives PDF-like content that cannot be parsed or validated as a usable PDF
- **THEN** the system rejects the upload

### Requirement: Manage resumes through protected APIs
The system SHALL provide owner-authenticated APIs to retrieve, upload, replace, publish, unpublish, and remove the current resume.

#### Scenario: Retrieve managed resume metadata
- **WHEN** an authenticated owner requests `GET /resume` and a resume exists
- **THEN** the system returns resume metadata including original filename, file size, upload date, update date, and publication state

#### Scenario: Managed resume not found
- **WHEN** an authenticated owner requests `GET /resume` and no resume exists
- **THEN** the system returns a not-found response

#### Scenario: Upload resume
- **WHEN** an authenticated owner sends a valid resume file to `POST /resume`
- **THEN** the system stores the PDF in private S3 storage, stores resume metadata, and returns the managed resume metadata

#### Scenario: Publish resume
- **WHEN** an authenticated owner sends `PATCH /resume/publication` with a request to publish an existing resume
- **THEN** the system marks the resume as published and returns the updated managed resume metadata

#### Scenario: Unpublish resume
- **WHEN** an authenticated owner sends `PATCH /resume/publication` with a request to unpublish an existing resume
- **THEN** the system marks the resume as unpublished and returns the updated managed resume metadata

#### Scenario: Remove resume
- **WHEN** an authenticated owner sends `DELETE /resume` for an existing resume
- **THEN** the system removes the resume metadata and stored PDF so it no longer appears in managed or public retrieval

#### Scenario: Reject unauthenticated management request
- **WHEN** a request without valid owner authentication calls `GET /resume`, `POST /resume`, `PATCH /resume/publication`, or `DELETE /resume`
- **THEN** the system returns HTTP 401 without performing the management operation

### Requirement: Replace resumes safely
The system SHALL preserve the existing resume when replacement upload or database update fails.

#### Scenario: Successful replacement
- **WHEN** a current resume exists and the owner uploads a valid replacement PDF
- **THEN** the system uploads the new PDF, updates the resume metadata, and deletes the previous S3 object only after the metadata update succeeds

#### Scenario: New upload fails during replacement
- **WHEN** a current resume exists and uploading the replacement PDF to S3 fails
- **THEN** the system preserves the existing resume metadata and existing S3 object

#### Scenario: Database update fails after replacement upload
- **WHEN** a replacement PDF uploads to S3 but updating resume metadata fails
- **THEN** the system deletes the newly uploaded object and preserves the existing resume metadata and existing S3 object

#### Scenario: Previous object deletion fails after replacement
- **WHEN** replacement succeeds but deleting the previous S3 object fails
- **THEN** the system preserves the new resume metadata and reports or logs the cleanup failure

### Requirement: Expose published resume publicly
The system SHALL provide unauthenticated public resume metadata and download behavior only for a published resume.

#### Scenario: Retrieve public resume metadata
- **WHEN** `GET /public/resume` is requested and the current resume is published
- **THEN** the system returns public resume metadata including original filename, file size, upload date, update date, publication state, and a stable download URL

#### Scenario: Hide unpublished resume metadata
- **WHEN** `GET /public/resume` is requested and the current resume is unpublished
- **THEN** the system responds as if no public resume exists

#### Scenario: Hide missing resume metadata
- **WHEN** `GET /public/resume` is requested and no resume exists
- **THEN** the system returns a not-found response

#### Scenario: Download published resume
- **WHEN** `GET /public/resume/download` is requested and the current resume is published
- **THEN** the system returns or redirects to the PDF download without exposing AWS credentials or the private S3 object key

#### Scenario: Hide unpublished resume download
- **WHEN** `GET /public/resume/download` is requested and the current resume is unpublished
- **THEN** the system responds as if no public resume exists

#### Scenario: Return recruiter-friendly download filename
- **WHEN** a published resume is downloaded
- **THEN** the response prompts a filename suitable for recruiters, such as `Jastine-Formentera-CV.pdf`

### Requirement: Manage resumes in admin
The system SHALL provide an authenticated admin interface for viewing, uploading, replacing, publishing, unpublishing, and removing the current resume.

#### Scenario: Open resume admin route
- **WHEN** the owner opens the resume management area under `/admin/*`
- **THEN** the system displays the resume management interface only after owner authentication succeeds

#### Scenario: Display managed resume metadata
- **WHEN** the managed resume loads successfully
- **THEN** the interface displays original filename, file size, upload date, update date, and publication state

#### Scenario: Show empty state
- **WHEN** no resume exists
- **THEN** the interface displays an empty state with an upload action

#### Scenario: Upload resume from admin
- **WHEN** the owner selects a valid PDF file and confirms upload
- **THEN** the interface uploads the file and displays progress, success, or error state for the operation

#### Scenario: Confirm replacement
- **WHEN** the owner selects a new PDF while a resume already exists
- **THEN** the interface asks for confirmation before replacing the current resume

#### Scenario: Confirm removal
- **WHEN** the owner selects Remove for the current resume
- **THEN** the interface asks for confirmation and identifies the resume that will be removed

#### Scenario: Publish and unpublish from admin
- **WHEN** a resume exists
- **THEN** the interface provides clear publish and unpublish controls that reflect the current publication state

#### Scenario: Prevent duplicate resume submissions
- **WHEN** a resume upload, replacement, publication update, or removal is pending
- **THEN** the interface prevents duplicate submissions for that pending operation

#### Scenario: Retry failed load
- **WHEN** loading managed resume metadata fails
- **THEN** the interface displays the error and provides a retry action

### Requirement: Support accessible and responsive resume behavior
The system SHALL make resume management and public download behavior usable on mobile, desktop, keyboard, and assistive technology.

#### Scenario: Accessible admin controls
- **WHEN** the owner uses keyboard navigation or assistive technology
- **THEN** upload controls, confirmation dialogs, publication controls, removal controls, progress states, errors, success messages, and retry actions expose appropriate labels, roles, and focus behavior

#### Scenario: Responsive admin layout
- **WHEN** the resume management interface is viewed on desktop or mobile screens
- **THEN** the interface remains readable and operable without horizontal scrolling

#### Scenario: Accessible public download
- **WHEN** a visitor uses the public resume download action
- **THEN** the action has an accessible name and works on mobile and desktop devices

### Requirement: Document resume storage configuration
The system SHALL document the storage and deployment configuration required for resume PDF uploads and downloads.

#### Scenario: Document required environment variables
- **WHEN** a developer reads the repository setup or operations documentation
- **THEN** the documentation lists required S3 settings and the configurable resume upload size limit

#### Scenario: Document private storage expectation
- **WHEN** a developer reads the S3 operations documentation
- **THEN** the documentation explains that resume PDFs are stored privately and public downloads must use the application endpoint instead of exposing the S3 object key
