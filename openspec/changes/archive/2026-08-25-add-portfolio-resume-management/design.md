## Context

See `proposal.md` for motivation. The app is a Vite web client backed by a Nest API, Prisma/PostgreSQL, TanStack Query, and private AWS S3 storage. Profile pictures already use server-side S3 uploads and project images use presigned browser uploads; resumes need stricter privacy because the public download must not expose the private object key.

Existing management APIs are protected by the owner auth guard, public portfolio APIs are unauthenticated, and singleton profile data uses a unique `singletonKey` value. Resume management should reuse these patterns.

## Goals / Non-Goals

**Goals:**

- Add one current resume with metadata in PostgreSQL and PDF bytes in private S3.
- Keep all management operations owner-authenticated.
- Validate PDF uploads by request shape, declared MIME type, file size, and actual PDF parseability before storage.
- Preserve the previous resume through replacement failure paths.
- Serve a stable public download endpoint for published resumes without exposing AWS credentials, bucket names, or object keys.
- Add admin UI and public homepage integration using existing query/mutation and visual patterns.

**Non-Goals:**

- No PDF preview, parsing into structured résumé fields, text extraction UI, version history, analytics, or applicant tracking.
- No direct browser-to-S3 upload for resume PDFs in this change.
- No public access to unpublished resume metadata or download behavior.

## Decisions

### Data model

Add a Prisma `Resume` model with:

- `id String @id @default(cuid())`
- `singletonKey String @unique @default("owner")`
- `originalFilename String`
- `fileSize Int`
- `contentType String`
- `objectKey String`
- `isPublic Boolean @default(false)`
- `uploadedAt DateTime @default(now())`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Use `singletonKey = "owner"` for upsert/update lookup to match `Profile`. Keep `uploadedAt` separate from `updatedAt` so publication-only changes do not change the upload date.

Alternative considered: use a generated id and `findFirst`. Rejected because a unique singleton key gives a database-level guard against multiple current resumes.

### Upload path and PDF validation

Use `POST /resume` with `multipart/form-data` and memory-backed upload handling, limited by a new configurable max size. Start with `RESUME_MAX_UPLOAD_BYTES`, default `5 * 1024 * 1024`. Also export a shared constant for web-side validation.

Validation order:

1. File is present and non-empty.
2. Size is within configured max.
3. Declared MIME type is `application/pdf`.
4. Original filename ends in `.pdf`, used only as a user-facing sanity check.
5. Actual bytes begin with a valid PDF header and can be parsed by a PDF parser.

Use a small server-side PDF parser dependency for content validation rather than relying only on magic bytes. The parser only validates parseability; it does not store extracted content.

Alternative considered: presigned browser upload. Rejected for this change because the API must validate actual PDF content before storage and avoid exposing object keys to public surfaces.

### S3 storage behavior

Add a dedicated resume storage abstraction, similar to the existing picture/image storage interfaces, with:

- `upload({ body, contentType }) -> { key }`
- `delete(key)`
- `download(key) -> { body, contentType, contentLength }`

Store objects under `resumes/<uuid>.pdf` in the existing private bucket. Reuse existing `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and TTL configuration where useful. Do not use `AWS_S3_PUBLIC_BASE_URL` for resume downloads because the public response must not expose the private key.

### Public download

`GET /public/resume` returns public metadata only when `isPublic` is true. The response includes `downloadUrl: "/public/resume/download"` and excludes `objectKey`.

`GET /public/resume/download` verifies a published resume exists, fetches the private S3 object server-side, and streams it through the API with:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="Jastine-Formentera-CV.pdf"`
- `Content-Length` when available
- conservative cache headers suitable for a replaceable personal CV

The filename should come from a helper that uses the public profile full name when available and falls back to `Jastine-Formentera-CV.pdf`.

Alternative considered: redirect to a presigned S3 URL. Rejected because presigned S3 URLs expose bucket/key details in the URL path.

### Safe replacement and removal

Replacement order:

1. Load existing resume, if any.
2. Validate the new upload fully.
3. Upload the new PDF to S3.
4. Upsert/update the singleton database row with `isPublic: false`.
5. If database update fails, delete the newly uploaded object and preserve the old row.
6. If database update succeeds, delete the old object asynchronously or best-effort with logging.

Default replacement to unpublished even if the previous resume was published, because the owner should explicitly publish the new CV after upload.

Removal order:

1. Load existing resume.
2. Delete metadata or clear the singleton row.
3. Delete the old S3 object best-effort.

If S3 deletion fails after metadata removal, log the cleanup failure. The public app must no longer expose the resume once metadata is removed.

### Admin UI

Add a resume admin section under `/admin/resume` and include it in admin navigation. The screen should show:

- Current filename, size, uploaded date, updated date, and public/private state.
- PDF file picker with client-side MIME/extension/size validation.
- Upload progress via XMLHttpRequest or axios-style progress support, because `fetch` does not provide portable upload progress.
- Replace confirmation when a resume already exists.
- Remove confirmation naming the current file.
- Publish/unpublish control.
- Loading, empty, error, retry, success, and pending states.

Use existing styling patterns from profile/project/experience admin surfaces. Keep the interface compact and operational rather than marketing-like.

### Web data and public homepage

Add shared resume types and API client functions:

- `getResume`
- `uploadResume`
- `updateResumePublication`
- `deleteResume`
- `getPublicResume`

Add TanStack Query hooks/mutations that invalidate managed resume and public resume queries after mutation.

On the homepage, load `GET /public/resume` alongside the existing public profile/projects/experience calls. Display a `Download CV` button only when public metadata exists. If resume metadata is loading or fails, keep the rest of the homepage usable and omit the button.

### Documentation

Update API `.env.example`, repository guide, and S3 operations docs with:

- Existing AWS variables required for resume storage.
- `RESUME_MAX_UPLOAD_BYTES`, default `5242880`.
- S3 prefix `resumes/*`.
- IAM policy note adding `resumes/*` to allowed `PutObject`, `GetObject`, and `DeleteObject`.
- Public download behavior through the app endpoint, not direct S3 object URLs.

## Risks / Trade-offs

- [Risk] Proxying downloads through the API uses server bandwidth. → Mitigation: PDFs are capped at 5 MB and this personal portfolio should have low download volume.
- [Risk] PDF validation can be too strict for unusual but valid PDFs. → Mitigation: use a parser-based check plus tests for representative valid PDFs and corrupted inputs.
- [Risk] Replacement can orphan old S3 objects if cleanup fails after a successful database update. → Mitigation: log cleanup failures and keep the user-facing state correct.
- [Risk] Upload progress requires using XMLHttpRequest or another transport outside the existing JSON request helper. → Mitigation: isolate multipart upload in the resume API client while keeping query/mutation patterns consistent.

## Migration Plan

1. Add the Prisma migration for `Resume`.
2. Deploy API code and environment variables before using the admin UI.
3. Update IAM policy to include the `resumes/*` prefix.
4. Upload and publish the current CV through `/admin/resume`.

Rollback: unpublish or delete the resume from admin before reverting the feature. If the migration is rolled back, manually remove any `resumes/*` S3 objects created during testing.
