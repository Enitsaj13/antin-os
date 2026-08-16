# portfolio-profile Specification

## Purpose
Portfolio profile management lets AntinOS maintain one owner profile, publish a safe public profile view, and manage a cropped profile picture without storing original images.
## Requirements
### Requirement: Manage the singleton owner profile
The system SHALL provide management behavior for exactly one owner profile containing full name, headline, biography, location, email, GitHub URL, LinkedIn URL, and optional profile picture.

#### Scenario: Managed profile not found
- **WHEN** `GET /profile` is requested and no profile exists
- **THEN** the system returns a not-found response

#### Scenario: Get managed profile
- **WHEN** `GET /profile` is requested and a profile exists
- **THEN** the system returns the managed owner profile with all profile fields and any usable profile-picture URL

#### Scenario: Create singleton profile
- **WHEN** `PUT /profile` receives a valid profile request and no profile exists
- **THEN** the system creates the owner profile and returns it

#### Scenario: Update singleton profile
- **WHEN** `PUT /profile` receives a valid profile request and a profile already exists
- **THEN** the system updates the existing owner profile instead of creating another profile

#### Scenario: Prevent multiple profiles
- **WHEN** repeated valid `PUT /profile` requests are made
- **THEN** the system maintains exactly one owner profile record

#### Scenario: Reject invalid profile fields
- **WHEN** `PUT /profile` receives missing required text, whitespace-only required text, an invalid email, or invalid optional GitHub or LinkedIn URL
- **THEN** the system rejects the request with a validation error

### Requirement: Expose public owner profile
The system SHALL provide public profile retrieval separately from management behavior.

#### Scenario: Public profile not found
- **WHEN** `GET /public/profile` is requested and no profile exists
- **THEN** the system returns a not-found response

#### Scenario: Get public profile
- **WHEN** `GET /public/profile` is requested and a profile exists
- **THEN** the system returns the public owner profile with profile fields and any usable profile-picture URL

#### Scenario: Keep management deployment private
- **WHEN** profile management routes are deployed
- **THEN** `GET /profile`, `PUT /profile`, `POST /profile/picture`, and `DELETE /profile/picture` MUST NOT be exposed on a public surface until authentication exists

### Requirement: Upload and store cropped profile pictures
The system SHALL accept cropped profile pictures through the API and store only private object storage references in PostgreSQL.

#### Scenario: Upload cropped picture
- **WHEN** `POST /profile/picture` receives multipart form data with a `file` field containing a valid cropped JPEG, PNG, or WebP image and a profile exists
- **THEN** the system stores the image, updates the profile-picture reference, and returns the updated profile with a usable profile-picture URL

#### Scenario: Upload picture without profile
- **WHEN** `POST /profile/picture` receives a valid file and no profile exists
- **THEN** the system returns a not-found response without storing the profile picture

#### Scenario: Store object key only
- **WHEN** a profile picture is stored
- **THEN** PostgreSQL stores only the storage object key and does not store binary or base64 image data

#### Scenario: Return usable picture URL
- **WHEN** management or public profile responses include a profile picture
- **THEN** the response includes a usable profile-picture URL generated without exposing storage credentials

#### Scenario: Keep original image out of storage
- **WHEN** a profile picture is uploaded after client-side cropping
- **THEN** only the cropped output is uploaded and stored

### Requirement: Validate uploaded profile pictures
The system SHALL validate profile-picture uploads by file size, actual image content, format, aspect ratio, and output dimensions.

#### Scenario: Accept supported image formats
- **WHEN** `POST /profile/picture` receives actual JPEG, PNG, or WebP image content
- **THEN** the system accepts the image format if all other validation passes

#### Scenario: Reject unsupported image format
- **WHEN** `POST /profile/picture` receives content that is not an actual JPEG, PNG, or WebP image
- **THEN** the system rejects the request with an unsupported-media error

#### Scenario: Reject empty file
- **WHEN** `POST /profile/picture` receives an empty `file`
- **THEN** the system rejects the request with a validation error

#### Scenario: Reject oversized file
- **WHEN** `POST /profile/picture` receives a `file` larger than 5 MB
- **THEN** the system rejects the request with a file-size error

#### Scenario: Reject non-square cropped output
- **WHEN** `POST /profile/picture` receives image content whose dimensions are not a square 1:1 aspect ratio
- **THEN** the system rejects the request with a validation error

#### Scenario: Normalize stored image
- **WHEN** `POST /profile/picture` receives a valid square image that is not already 512x512
- **THEN** the system normalizes the stored image to 512x512

### Requirement: Replace profile pictures safely
The system SHALL preserve a valid profile picture when replacement upload or database update fails.

#### Scenario: Successful replacement
- **WHEN** a profile already has a picture and `POST /profile/picture` receives a valid new cropped picture
- **THEN** the system uploads the new image, updates the profile reference, deletes the previous stored object after the database update succeeds, and returns the updated profile

#### Scenario: New upload fails
- **WHEN** replacement is requested and uploading the new cropped image fails
- **THEN** the system preserves the existing profile-picture reference

#### Scenario: Database update fails after new upload
- **WHEN** the new cropped image upload succeeds but updating the profile record fails
- **THEN** the system deletes the newly uploaded object and preserves the existing profile-picture reference

#### Scenario: Previous object deletion fails after replacement
- **WHEN** replacement succeeds but deleting the previous stored object fails
- **THEN** the system preserves the new profile picture and reports or logs the cleanup failure

### Requirement: Remove profile pictures
The system SHALL allow the current profile picture to be removed.

#### Scenario: Remove existing picture
- **WHEN** `DELETE /profile/picture` is requested and the profile has a current profile picture
- **THEN** the system clears the profile-picture reference from PostgreSQL, removes the previous stored object, and returns a profile response without a profile picture

#### Scenario: Remove picture when no profile exists
- **WHEN** `DELETE /profile/picture` is requested and no profile exists
- **THEN** the system returns a not-found response

#### Scenario: Remove picture when none exists
- **WHEN** `DELETE /profile/picture` is requested and the profile exists without a profile picture
- **THEN** the system returns the unchanged profile response without a profile picture

### Requirement: Crop profile pictures in the admin interface
The system SHALL provide an admin profile interface for selecting, cropping, previewing, uploading, replacing, canceling, and removing a profile picture.

#### Scenario: Select supported source image
- **WHEN** the owner selects a JPEG, PNG, or WebP image in the admin profile interface
- **THEN** the selected image opens in a square 1:1 crop interface

#### Scenario: Reposition selected image
- **WHEN** the selected image is open in the crop interface
- **THEN** the owner can reposition the image by dragging it

#### Scenario: Zoom selected image
- **WHEN** the selected image is open in the crop interface
- **THEN** the owner can zoom in and zoom out using a slider

#### Scenario: Keep crop area covered
- **WHEN** the owner adjusts zoom or position
- **THEN** the zoom and position constraints keep the square crop area covered without empty space

#### Scenario: Preview cropped output
- **WHEN** the owner adjusts the crop
- **THEN** the crop preview accurately shows the final visible profile-picture area

#### Scenario: Confirm crop
- **WHEN** the owner confirms the crop
- **THEN** the interface generates a 512x512 cropped image and uploads only that cropped output to `POST /profile/picture`

#### Scenario: Cancel crop
- **WHEN** the owner cancels the crop
- **THEN** the crop interface closes without uploading anything or changing the current profile picture

#### Scenario: Replace picture in interface
- **WHEN** the owner starts replacing an existing picture
- **THEN** the current picture remains visible until the new cropped picture is uploaded and saved successfully

#### Scenario: Show upload progress and errors
- **WHEN** a profile-picture upload is in progress or fails validation or storage
- **THEN** the interface shows upload progress and relevant validation or storage errors

#### Scenario: Exclude general image editing
- **WHEN** the owner crops a profile picture
- **THEN** the interface does not provide filters, rotation, drawing, text overlays, color adjustments, or general-purpose image editing

### Requirement: Protect private S3 storage
The system SHALL store profile pictures in a private AWS S3 bucket through server-side storage behavior.

#### Scenario: Keep bucket private
- **WHEN** profile pictures are stored in AWS S3
- **THEN** the S3 bucket remains private

#### Scenario: Keep credentials server-side
- **WHEN** the admin interface uploads or retrieves profile data
- **THEN** AWS credentials are never exposed to the frontend

#### Scenario: Generate unique object keys
- **WHEN** a profile picture is stored
- **THEN** the object key is unique enough to prevent filename collisions

#### Scenario: Report storage errors
- **WHEN** S3 upload, URL generation, or deletion fails
- **THEN** the system returns, reports, or logs an appropriate storage error according to the operation outcome

### Requirement: Require owner authentication for profile management
The system SHALL require owner authentication for all profile management behavior while keeping public profile retrieval unauthenticated.

#### Scenario: Reject unauthenticated managed profile retrieval
- **WHEN** `GET /profile` is requested without valid owner authentication
- **THEN** the system returns HTTP 401

#### Scenario: Reject unauthenticated profile upsert
- **WHEN** `PUT /profile` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not create or update the owner profile

#### Scenario: Reject unauthenticated profile picture upload
- **WHEN** `POST /profile/picture` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not store a profile picture

#### Scenario: Reject unauthenticated profile picture removal
- **WHEN** `DELETE /profile/picture` is requested without valid owner authentication
- **THEN** the system returns HTTP 401 and does not remove the current profile picture

#### Scenario: Allow authenticated profile management
- **WHEN** `GET /profile`, `PUT /profile`, `POST /profile/picture`, or `DELETE /profile/picture` is requested with valid owner authentication
- **THEN** the system allows the request to proceed to the existing profile management behavior

#### Scenario: Keep public profile unauthenticated
- **WHEN** `GET /public/profile` is requested without owner authentication
- **THEN** the system allows the request to proceed to the existing public profile behavior

