## Context

The web app already has public project listing/detail routes and admin routes protected under `/admin/*`. Public profile and public project APIs exist, so the homepage should compose those APIs rather than add backend behavior.

The current profile model does not contain an explicit skills field. For this change, homepage skills are derived from public projects' `techStack` values. A separate profile-schema change can add owner-curated skills later if needed.

## Goals / Non-Goals

**Goals:**

- Make `/` a visitor-facing portfolio homepage.
- Keep profile and project management under `/admin/*`.
- Reuse public profile and public projects query/client behavior.
- Make the homepage resilient to loading, not-found, empty, and API-error states.
- Add route-aware document title and description for public routes.

**Non-Goals:**

- No new API routes or database fields.
- No authentication changes.
- No blog, AI-generated content, or CMS behavior.
- No project ordering management; selected projects can be derived from the public project list.

## Decisions

1. Use `/` exclusively for the public homepage.

   Rationale: This makes the deployed root URL useful to visitors and keeps admin intent explicit. Admin users can continue to open `/admin/profile` for management.

   Alternative considered: Keep `/` as an alias to profile admin. This preserves old behavior but conflicts with the requested public homepage and makes unauthenticated visitor behavior confusing.

2. Compose the homepage from existing public query hooks.

   Rationale: `GET /public/profile` and `GET /public/projects` already define the safe public data boundary. Reusing them avoids duplicating API behavior and avoids exposing management routes.

   Alternative considered: Add a combined `/public/home` endpoint. This may become useful later for performance, but it is outside the requested scope and unnecessary for the current app size.

3. Derive skills from public project tech stacks.

   Rationale: The profile API does not currently expose a dedicated skills field, and the request excludes new management APIs. Published project tech stacks are already public and map naturally to a skills summary.

   Alternative considered: Add a profile `skills` field. That would require API, database, admin form, and validation changes beyond this homepage change.

4. Treat project highlights as a small subset of the public project list.

   Rationale: There is no public ordering or featured flag today. Showing a deterministic subset from `GET /public/projects` keeps the behavior simple and avoids new management requirements.

   Alternative considered: Add featured-project management. This would require new admin behavior and is out of scope.

5. Manage SEO metadata in the web route layer.

   Rationale: The Vite app controls the document shell. Updating `document.title` and description per public route is enough for the current SPA and avoids introducing an SSR framework.

   Alternative considered: Static metadata only in `index.html`. That would not adapt to public profile/project content and would continue to look admin-oriented.

## Risks / Trade-offs

- [Risk] Skills derived from projects may omit skills not represented in published projects. -> Mitigation: Document this as the current behavior and keep future curated skills as a separate profile capability.
- [Risk] Separate profile and project requests can partially fail. -> Mitigation: Render independent loading/error/empty states so one failing data source does not hide all available content.
- [Risk] SPA metadata updates are weaker than server-rendered metadata for crawlers. -> Mitigation: Provide correct client-side metadata now and leave SSR/static generation as a future deployment concern.
- [Risk] Reassigning `/` from admin to public can surprise the owner during development. -> Mitigation: Preserve `/admin/profile` and `/admin/projects` as explicit management routes.

## Migration Plan

1. Add the public homepage route and components.
2. Update route parsing so `/` no longer resolves to admin profile.
3. Add public query handling for profile/projects on the homepage.
4. Add metadata updates for `/`, `/projects`, and project detail routes as needed.
5. Add unit and browser coverage for public homepage behavior and admin route preservation.
6. Roll back by restoring `/` to the previous route behavior and removing the homepage route/component if needed.
