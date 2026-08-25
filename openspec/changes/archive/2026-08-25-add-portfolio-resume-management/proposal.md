## Why

The public portfolio needs a safe, recruiter-friendly way to offer the owner's current CV without hardcoding an external file link or exposing private storage details. Adding singleton resume management keeps the portfolio content self-contained while preserving the existing private S3 and authenticated admin model.

## What Changes

- Add authenticated owner management for one current resume/CV PDF.
- Allow the owner to upload, replace, publish, unpublish, and remove the resume.
- Accept PDF uploads only, with server-side validation of size, declared MIME type, and actual PDF content.
- Store the PDF object in the existing private S3 storage and store only metadata plus the S3 object key in PostgreSQL.
- Preserve the existing resume when replacement upload or database update fails, and clean up S3 objects according to the replacement outcome.
- Add public resume metadata and a stable public download endpoint that only work when the resume is published.
- Add a public homepage Download CV button that appears only when a published resume exists.
- Document required S3 and deployment environment variables for resume storage.

## Capabilities

### New Capabilities

- `portfolio-resume`: Singleton resume management, private PDF storage, protected admin API/UI behavior, public published metadata, and public download behavior.

### Modified Capabilities

- `public-portfolio-home`: Display an accessible Download CV action when a published resume is available.

## Impact

- API: new resume module, Prisma model/migration, protected management routes (`GET /resume`, `POST /resume`, `PATCH /resume/publication`, `DELETE /resume`), public routes (`GET /public/resume`, `GET /public/resume/download`), upload validation, S3 storage integration, and tests.
- Web: admin resume management UI, public homepage Download CV button, TanStack Query hooks/mutations, API client/shared types, and web tests.
- Storage/config: reuse existing AWS S3 credentials and bucket configuration, add configurable resume max upload size defaulting to 5 MB, and store resume objects under a dedicated prefix.
- Docs: update S3 setup and development environment documentation for resume PDF storage.
- E2E: add Playwright coverage for admin resume management and public download visibility.
