## 1. Admin Routing and Shell

- [x] 1.1 Extract the current profile management UI from `App` into a focused profile admin component without changing behavior
- [x] 1.2 Add lightweight route parsing/navigation helpers for `/`, `/admin/profile`, `/admin/projects`, `/admin/projects/new`, and `/admin/projects/:id/edit`
- [x] 1.3 Add an admin shell with Profile and Projects navigation links
- [x] 1.4 Route `/admin/profile` to the extracted profile interface
- [x] 1.5 Route `/` to the profile admin experience or redirect-equivalent behavior

## 2. Project List

- [x] 2.1 Add a projects list view at `/admin/projects` using the existing managed projects query hook
- [x] 2.2 Display title, slug, tech stack, publication state, and updated date for each project
- [x] 2.3 Add Edit and Delete actions for each listed project
- [x] 2.4 Add loading state behavior for the projects list
- [x] 2.5 Add empty state behavior for no projects or no matching filtered projects
- [x] 2.6 Add error and retry behavior for project list load failures
- [x] 2.7 Add all, public, and unpublished filter controls with client-side filtering
- [x] 2.8 Add desktop compact table layout and mobile stacked-list layout

## 3. Project Form

- [x] 3.1 Add a reusable project form component for create and edit flows
- [x] 3.2 Add `/admin/projects/new` create route with default private publication state
- [x] 3.3 Add `/admin/projects/:id/edit` edit route that loads and populates an existing project
- [x] 3.4 Include title, slug, summary, description, tech stack, repository URL, live URL, image URL, and isPublic inputs
- [x] 3.5 Generate a suggested lowercase kebab-case slug from the title before the slug is manually edited
- [x] 3.6 Preserve manually edited slug values when the title changes later
- [x] 3.7 Normalize optional empty text fields to the API contract expected by project create and update requests
- [x] 3.8 Convert tech stack input into a trimmed non-empty string array before submission

## 4. Validation and Error Handling

- [x] 4.1 Add client-side validation for required title, slug, summary, and tech stack values
- [x] 4.2 Add client-side validation for lowercase kebab-case slug format
- [x] 4.3 Add client-side validation for repository URL, live URL, and image URL formats
- [x] 4.4 Add client-side validation for empty tech stack entries
- [x] 4.5 Display API validation errors on create and update failures while keeping the owner on the form
- [x] 4.6 Display HTTP 409 duplicate-slug conflicts with clear duplicate-slug messaging
- [x] 4.7 Disable create and update submissions while the corresponding mutation is pending

## 5. Publication and Deletion

- [x] 5.1 Add a clear public/private publication toggle to the project form
- [x] 5.2 Add a confirmation warning before saving a public project with incomplete optional project information
- [x] 5.3 Ensure private project saves do not require the publication warning confirmation
- [x] 5.4 Add a delete confirmation dialog that names the project being permanently deleted
- [x] 5.5 Ensure canceling the delete confirmation does not call the delete mutation
- [x] 5.6 Remove deleted projects from the management list after successful deletion
- [x] 5.7 Keep projects visible and display the API error when deletion fails
- [x] 5.8 Disable duplicate delete submissions while deletion is pending

## 6. Server State

- [x] 6.1 Reuse the existing TanStack Query project query and mutation hooks as the server-state boundary
- [x] 6.2 Invalidate managed project list state after successful create, update, and delete mutations
- [x] 6.3 Invalidate managed project detail state after successful update and delete mutations
- [x] 6.4 Navigate back to the projects list after successful create or update
- [x] 6.5 Ensure failed create, update, or delete mutations leave existing project data intact

## 7. Accessibility and Responsive Behavior

- [x] 7.1 Ensure admin navigation, filter controls, form fields, publication toggle, dialog controls, edit actions, delete actions, retry actions, and submission buttons are keyboard operable
- [x] 7.2 Associate field-level validation errors with their relevant form inputs
- [x] 7.3 Expose list/form/API errors through accessible status or alert semantics
- [x] 7.4 Verify responsive layout behavior for desktop table and mobile stacked project list

## 8. Frontend Verification

- [x] 8.1 Update existing profile admin tests for the new `/admin/profile` route and shell
- [x] 8.2 Add tests for admin navigation between Profile and Projects
- [x] 8.3 Add tests for project list loading, empty, error, retry, filter, and row-action states
- [x] 8.4 Add tests for create form defaults, slug suggestion, manual slug preservation, validation, and successful submission
- [x] 8.5 Add tests for edit form loading, update submission, duplicate-slug conflict handling, and API validation errors
- [x] 8.6 Add tests for publication warning behavior
- [x] 8.7 Add tests for delete confirmation, cancel, success, failure, and pending states
- [x] 8.8 Run `pnpm --filter web test`
- [x] 8.9 Run `pnpm --filter web build`
- [x] 8.10 Run `pnpm exec openspec validate add-portfolio-projects-admin-ui --strict`
