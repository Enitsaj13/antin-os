## 1. Public Routing

- [x] 1.1 Extend the lightweight route parser for `/projects` and `/projects/:slug`
- [x] 1.2 Render the public projects listing for `/projects`
- [x] 1.3 Render the public project detail page for `/projects/:slug`
- [x] 1.4 Preserve existing admin profile and project routes
- [x] 1.5 Add public navigation helpers that do not require a router dependency

## 2. Public Projects Listing

- [x] 2.1 Add a public projects list component backed by `usePublicProjects`
- [x] 2.2 Display each public project's title, summary, image when present, and tech stack
- [x] 2.3 Link each public project summary to `/projects/:slug`
- [x] 2.4 Ensure the listing never calls managed project query hooks or endpoints
- [x] 2.5 Add loading state behavior for the public projects list
- [x] 2.6 Add empty state behavior when no public projects are available
- [x] 2.7 Add API-error and retry behavior for public list load failures
- [x] 2.8 Add responsive list layout for desktop and mobile viewports

## 3. Public Project Detail

- [x] 3.1 Add a public project detail component backed by `usePublicProject`
- [x] 3.2 Display title, summary, image when present, tech stack, and description when present
- [x] 3.3 Display repository and live-demo links only when their URLs are present
- [x] 3.4 Add a link back to `/projects`
- [x] 3.5 Ensure detail pages never call managed project query hooks or endpoints
- [x] 3.6 Add loading state behavior for the public project detail page
- [x] 3.7 Add not-found state behavior for missing or unpublished slugs
- [x] 3.8 Add API-error and retry behavior for non-not-found detail failures
- [x] 3.9 Add responsive detail layout for desktop and mobile viewports

## 4. Accessibility

- [x] 4.1 Give project detail, repository, live-demo, retry, and back-navigation links clear accessible names
- [x] 4.2 Ensure all public project links and retry actions are keyboard operable
- [x] 4.3 Expose loading and empty states through accessible status semantics
- [x] 4.4 Expose not-found and API-error states through accessible alert or status semantics
- [x] 4.5 Provide useful alt text for project images using the project title

## 5. Frontend Verification

- [x] 5.1 Add tests for `/projects` route rendering and public projects query usage
- [x] 5.2 Add tests for public list loading, empty, API-error, retry, and data-display states
- [x] 5.3 Add tests that public list rendering does not expose unpublished projects from managed data
- [x] 5.4 Add tests for `/projects/:slug` route rendering and public detail query usage
- [x] 5.5 Add tests for public detail field rendering, optional links, and back navigation
- [x] 5.6 Add tests for public detail loading, not-found, API-error, and retry states
- [x] 5.7 Add tests for accessible names and status/error semantics on public project pages
- [x] 5.8 Run `pnpm --filter web test`
- [x] 5.9 Run `pnpm --filter web build`
- [x] 5.10 Run `pnpm exec openspec validate add-public-portfolio-projects-ui --strict`
