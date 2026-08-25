## 1. Data Model and Shared Contracts

- [x] 1.1 Add a Prisma `Resume` singleton model and migration with metadata fields, private object key, publication state, upload date, and timestamps.
- [x] 1.2 Generate/update Prisma client artifacts needed by the API.
- [x] 1.3 Add shared resume response/input types and a shared resume max-size constant defaulting to 5 MB.
- [x] 1.4 Export resume types/constants from shared package indexes.

## 2. API Storage and Validation

- [x] 2.1 Add a resume upload size config path using `RESUME_MAX_UPLOAD_BYTES` with a 5 MB default.
- [x] 2.2 Add a resume PDF validation service for missing, empty, oversized, wrong-MIME, non-PDF, and corrupted PDF uploads.
- [x] 2.3 Add a private S3 resume storage abstraction and S3 implementation using the `resumes/` object prefix.
- [x] 2.4 Add server-side resume download support that streams private S3 objects without exposing bucket names, credentials, or object keys.

## 3. API Resume Behavior

- [x] 3.1 Add resume DTOs, response mapping, and private/public metadata shaping that excludes object keys from public responses.
- [x] 3.2 Add authenticated management endpoints for `GET /resume`, `POST /resume`, `PATCH /resume/publication`, and `DELETE /resume`.
- [x] 3.3 Add public endpoints for `GET /public/resume` and `GET /public/resume/download`.
- [x] 3.4 Implement safe replacement so the existing resume is preserved when upload or database update fails.
- [x] 3.5 Implement cleanup of newly uploaded objects after database failures and best-effort cleanup of previous objects after successful replacement or removal.
- [x] 3.6 Register the resume module with existing owner-auth and app module wiring.

## 4. API Tests

- [x] 4.1 Add tests proving unauthenticated callers cannot use resume management endpoints.
- [x] 4.2 Add tests for valid upload, singleton replacement, default unpublished state, publish/unpublish, remove, and managed metadata responses.
- [x] 4.3 Add tests for missing, empty, oversized, wrong-MIME, non-PDF, and corrupted PDF rejection.
- [x] 4.4 Add tests proving public metadata and download work only for published resumes.
- [x] 4.5 Add storage-failure tests for upload failure, database failure after upload, cleanup failure after replacement, and removal cleanup behavior.
- [x] 4.6 Verify public download headers include PDF content type and a recruiter-friendly attachment filename.

## 5. Web API Client and Queries

- [x] 5.1 Add resume API client functions for managed metadata, upload with progress, publication update, deletion, and public metadata.
- [x] 5.2 Add TanStack Query hooks for managed and public resume metadata.
- [x] 5.3 Add TanStack mutations that invalidate managed resume and public resume queries after successful changes.
- [x] 5.4 Keep multipart upload/progress handling isolated from the existing JSON request helper.

## 6. Admin Resume UI

- [x] 6.1 Add `/admin/resume` routing and admin navigation entry.
- [x] 6.2 Build the resume admin screen with loading, empty, error, retry, metadata, success, and pending states.
- [x] 6.3 Add PDF picker validation for MIME type, `.pdf` extension, empty files, and max size before upload.
- [x] 6.4 Add upload progress display and prevent duplicate submissions while upload is pending.
- [x] 6.5 Add replacement confirmation when a current resume exists.
- [x] 6.6 Add publish/unpublish controls with clear public/private state.
- [x] 6.7 Add removal confirmation naming the current resume and preserve visible state when removal fails.
- [x] 6.8 Ensure admin controls, dialogs, status messages, and errors are keyboard and screen-reader accessible on mobile and desktop.

## 7. Public Homepage UI

- [x] 7.1 Load public resume metadata on the homepage without calling management APIs.
- [x] 7.2 Display a Download CV action only when published resume metadata is available.
- [x] 7.3 Link Download CV to `/public/resume/download` and keep it accessible on mobile and desktop.
- [x] 7.4 Keep the homepage usable and omit the button while resume metadata loads, is missing, or fails.
- [x] 7.5 Update homepage tests for published, unpublished/missing, loading, and error resume states.

## 8. Documentation

- [x] 8.1 Update API `.env.example` with `RESUME_MAX_UPLOAD_BYTES=5242880`.
- [x] 8.2 Update the repository guide with resume storage and upload configuration.
- [x] 8.3 Update S3 operations documentation with the `resumes/*` IAM policy prefix and private-download behavior.
- [x] 8.4 Document that public CV downloads must go through the app endpoint rather than direct S3 URLs.

## 9. End-to-End Verification

- [x] 9.1 Add Playwright coverage for authenticated resume upload, replacement confirmation, publish/unpublish, and remove flows.
- [x] 9.2 Add Playwright coverage that the public homepage shows Download CV only when the resume is published.
- [x] 9.3 Run API resume tests, web resume tests, web build, API build, focused Playwright coverage, and strict OpenSpec validation.
