## Why

AntinOS needs an owner profile so the portfolio can present a consistent public identity while giving the owner a managed place to maintain profile content and a cropped profile picture. Adding this now complements project management and establishes the profile foundation before authentication and richer portfolio pages are added.

## What Changes

- Add singleton owner profile API behavior for managed and public profile retrieval.
- Add create/update behavior for profile fields: full name, headline, biography, location, email, GitHub URL, LinkedIn URL, and optional profile picture.
- Add profile-picture upload, replacement, and removal behavior through the NestJS API.
- Add image validation for JPEG, PNG, and WebP content, empty files, 5 MB size limit, square cropped output, and normalized 512x512 storage.
- Store profile pictures in a private AWS S3 bucket through a storage abstraction and store only S3 object keys in PostgreSQL.
- Add safe profile-picture replacement and cleanup behavior around S3 uploads, database updates, and previous-object deletion.
- Add the minimum admin profile frontend for editing profile fields and selecting, cropping, previewing, uploading, replacing, canceling, and removing a profile picture.
- Keep public profile retrieval separate from management behavior.
- Document that management routes must not be publicly deployed before authentication exists.

## Capabilities

### New Capabilities

- `portfolio-profile`: Singleton owner profile management, public profile retrieval, profile-picture cropping workflow, image validation, and private S3-backed picture storage.

### Modified Capabilities

- None.

## Impact

- Adds a Prisma `Profile` model and migration with singleton enforcement.
- Affects NestJS API modules, DTOs, controllers, services, multipart upload handling, storage abstraction, S3 integration, configuration validation, and automated tests.
- Adds frontend admin profile UI and crop behavior with tests.
- Adds environment variable placeholders for AWS S3 configuration while prohibiting committed real credentials.
