## 1. Data Model and Configuration

- [x] 1.1 Add a singleton `Profile` Prisma model with required profile fields, optional URL fields, optional `profilePictureKey`, timestamps, and a database-level singleton guard
- [x] 1.2 Create and apply a Prisma migration for the `Profile` model
- [x] 1.3 Regenerate Prisma client types
- [x] 1.4 Add `.env.example` placeholders for AWS region, S3 bucket, AWS access key id, AWS secret access key, and secure picture URL-generation configuration
- [x] 1.5 Add API configuration validation for required profile-picture storage environment variables
- [x] 1.6 Document that profile management routes must not be publicly deployed before authentication exists

## 2. API Profile Contracts

- [x] 2.1 Add profile DTOs that validate required trimmed text, email, and optional GitHub and LinkedIn URLs
- [x] 2.2 Add a profile response contract that includes profile fields and a usable nullable profile-picture URL
- [x] 2.3 Add profile service methods for `GET /profile`, `PUT /profile`, and singleton create-or-update behavior
- [x] 2.4 Add public profile service behavior for `GET /public/profile`
- [x] 2.5 Add profile controller routes for `GET /profile`, `PUT /profile`, and `GET /public/profile`
- [x] 2.6 Return not-found responses when managed or public profile retrieval is requested before a profile exists
- [x] 2.7 Prevent multiple owner profile records from being created

## 3. Picture Storage and Image Processing

- [x] 3.1 Add a profile-picture storage interface for upload, delete, and URL generation
- [x] 3.2 Add an AWS S3 storage adapter that keeps the bucket private and never exposes credentials to the frontend
- [x] 3.3 Generate unique profile-picture object keys that avoid filename collisions
- [x] 3.4 Add multipart upload handling for `POST /profile/picture` with field name `file`
- [x] 3.5 Validate empty files and enforce the 5 MB upload limit
- [x] 3.6 Validate actual image content and accept only JPEG, PNG, and WebP
- [x] 3.7 Validate uploaded cropped output is square 1:1
- [x] 3.8 Normalize accepted images to 512x512 before storage
- [x] 3.9 Store only the S3 object key in PostgreSQL, not binary or base64 image data
- [x] 3.10 Generate usable profile-picture URLs in managed and public profile responses without exposing AWS credentials

## 4. Picture Mutation Flows

- [x] 4.1 Implement `POST /profile/picture` success behavior for profiles that already exist
- [x] 4.2 Return not found from `POST /profile/picture` when no profile exists
- [x] 4.3 Implement safe picture replacement by uploading the new object before updating the database
- [x] 4.4 Delete the previous stored object only after the database update succeeds
- [x] 4.5 Delete the newly uploaded object and preserve the previous picture if the database update fails
- [x] 4.6 Preserve the new profile picture and report or log cleanup failure if previous-object deletion fails after replacement
- [x] 4.7 Implement `DELETE /profile/picture` for profiles with an existing picture
- [x] 4.8 Return not found from `DELETE /profile/picture` when no profile exists
- [x] 4.9 Define and implement no-op success behavior for `DELETE /profile/picture` when the profile exists without a picture

## 5. Admin Profile Frontend

- [x] 5.1 Add a minimal TypeScript React/Vite app under `apps/web`
- [x] 5.2 Add API client functions for managed profile retrieval, profile update, picture upload with progress, and picture removal
- [x] 5.3 Build the admin profile form for full name, headline, biography, location, email, GitHub URL, and LinkedIn URL
- [x] 5.4 Build image selection for JPEG, PNG, and WebP source images
- [x] 5.5 Build a square 1:1 crop interface with drag repositioning
- [x] 5.6 Add zoom in/out control with a slider and constraints that keep the crop area covered
- [x] 5.7 Add an accurate crop preview of the final visible picture area
- [x] 5.8 Generate a 512x512 cropped image on crop confirmation
- [x] 5.9 Upload only the cropped output and never upload the original image
- [x] 5.10 Implement crop cancellation with no upload and no profile-picture change
- [x] 5.11 Keep the current picture visible during replacement until the new picture is uploaded and saved successfully
- [x] 5.12 Show upload progress, validation errors, and storage errors
- [x] 5.13 Add picture removal behavior to the admin profile interface
- [x] 5.14 Exclude filters, rotation, drawing, text overlays, color adjustment, and general image-editing controls

## 6. API Verification

- [x] 6.1 Test profile creation and updates
- [x] 6.2 Test required fields, whitespace-only text, email validation, and URL validation
- [x] 6.3 Test the singleton-profile rule
- [x] 6.4 Test managed and public profile not-found responses
- [x] 6.5 Test public profile retrieval
- [x] 6.6 Test JPEG, PNG, and WebP profile-picture acceptance
- [x] 6.7 Test invalid image content, unsupported formats, empty files, oversized files, and non-square cropped output
- [x] 6.8 Test successful picture upload and response URL generation
- [x] 6.9 Test picture replacement and previous-object deletion
- [x] 6.10 Test cleanup of the new object when database update fails
- [x] 6.11 Test previous-object deletion failure preserves the new picture and reports or logs cleanup failure
- [x] 6.12 Test picture removal, no-profile removal, and no-picture removal behavior
- [x] 6.13 Mock the storage abstraction in automated API tests

## 7. Frontend Verification

- [x] 7.1 Test that canceling the crop performs no upload
- [x] 7.2 Test crop confirmation generates square output
- [x] 7.3 Test crop repositioning updates the preview and output
- [x] 7.4 Test zoom updates the preview and keeps the crop area covered
- [x] 7.5 Test crop confirmation produces a 512x512 result
- [x] 7.6 Test upload progress and error display states

## 8. Final Validation

- [x] 8.1 Run API lint and tests
- [x] 8.2 Run API production build
- [x] 8.3 Run frontend lint and tests
- [x] 8.4 Run frontend production build
- [x] 8.5 Run OpenSpec validation
