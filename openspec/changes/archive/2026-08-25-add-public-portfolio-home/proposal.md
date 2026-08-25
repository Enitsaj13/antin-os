## Why

Visitors currently have public project pages, but `/` still behaves as an admin-oriented entry point. A public portfolio homepage gives AntinOS a clear visitor landing experience while keeping all management behavior under `/admin/*`.

## What Changes

- Add a public homepage at `/` that loads the owner profile from `GET /public/profile`.
- Load selected published projects from `GET /public/projects` and display them as homepage project highlights.
- Display profile picture, name, headline, biography, location, social links, contact information, skills, and project summaries.
- Keep all admin interfaces under `/admin/*`; `/` must not show or require admin authentication.
- Add responsive, accessible homepage layouts with loading, empty, and API-error states.
- Add SEO metadata for the public homepage.
- Do not add authentication changes, AI features, blogs, or new management APIs.

## Capabilities

### New Capabilities

- `public-portfolio-home`: Public portfolio homepage behavior, content composition, route ownership, states, accessibility, responsiveness, and SEO.

### Modified Capabilities

None.

## Impact

- Affected code: Vite web app routing, public homepage components, public profile/project query usage, tests, and browser metadata handling.
- Affected APIs: Existing `GET /public/profile` and `GET /public/projects` only; no new APIs.
- Affected behavior: `/` becomes public-facing, while admin profile management remains reachable at `/admin/profile`.
