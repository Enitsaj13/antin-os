## 1. Route and Data Setup

- [x] 1.1 Update web route parsing so `/` resolves to a public portfolio homepage, while `/admin/profile`, `/admin/projects`, `/admin/projects/new`, and `/admin/projects/:id/edit` remain admin routes.
- [x] 1.2 Ensure the public homepage bypasses admin session restoration and never redirects unauthenticated visitors to `/admin/login`.
- [x] 1.3 Reuse existing public profile and public projects query/client behavior for homepage data loading.
- [x] 1.4 Ensure the homepage does not call management profile or projects APIs.

## 2. Homepage UI

- [x] 2.1 Add a public homepage component that displays profile picture, full name, headline, biography, location, email, GitHub link, and LinkedIn link when available.
- [x] 2.2 Add a derived skills summary from public project `techStack` values with duplicate values collapsed.
- [x] 2.3 Add selected published project highlights with title, summary, image when present, tech stack, and links to public project detail pages.
- [x] 2.4 Add a link from the homepage to `/projects` when public projects are available.
- [x] 2.5 Handle missing optional profile and project values without broken images, empty links, or placeholder URLs.

## 3. States and Metadata

- [x] 3.1 Add homepage loading states for profile and project requests.
- [x] 3.2 Add missing-profile and empty-project homepage states.
- [x] 3.3 Add accessible API-error states with retry actions for failed profile or project loads.
- [x] 3.4 Add route-aware document title and description metadata for `/`, `/projects`, and `/projects/:slug`.

## 4. Responsive and Accessible Behavior

- [x] 4.1 Add desktop and mobile homepage layouts that preserve readable content without horizontal scrolling.
- [x] 4.2 Ensure homepage links, retry actions, loading states, empty states, errors, images, and project cards expose appropriate accessible labels, roles, and alternative text.
- [x] 4.3 Verify keyboard navigation reaches all interactive homepage controls and links.

## 5. Tests

- [x] 5.1 Add web tests proving `/` renders the public homepage and does not render the admin profile form.
- [x] 5.2 Add web tests proving the homepage uses public profile and public project hooks without management hooks.
- [x] 5.3 Add web tests for profile content, contact/social links, derived skills, selected project cards, and `/projects` navigation.
- [x] 5.4 Add web tests for loading, missing-profile, empty-project, API-error, and retry states.
- [x] 5.5 Add web tests proving admin routes still require authentication and remain under `/admin/*`.
- [x] 5.6 Add focused Playwright coverage for opening `/` as an unauthenticated visitor.

## 6. Verification

- [x] 6.1 Run `pnpm format:check`.
- [x] 6.2 Run `pnpm test:commit`.
- [x] 6.3 Run `pnpm --filter web build`.
- [x] 6.4 Run focused Playwright homepage coverage.
- [x] 6.5 Run `pnpm exec openspec validate add-public-portfolio-home --strict`.
