# Next.js Production Readiness

## Goals
- Fast, accessible, and stable UI
- Clean separation of server and client logic
- Predictable builds and deployments

## Build & Runtime
- Use `next build` for production checks.
- Keep environment variables in `.env.local`, `.env.production`.
- Validate required envs at startup.

## Rendering Strategy
- Prefer Server Components for data-heavy views.
- Use Client Components only for interactivity.
- Use streaming/Suspense for large pages where appropriate.

## Performance
- Use optimized images with `next/image`.
- Avoid heavy client-side bundles.
- Keep requests minimal and cache on the server.

## Security
- Do not expose secrets to the client.
- Use server-side API routes for sensitive work.
- Validate input at the boundary.

## UX
- Provide loading, empty, error, and success states.
- Ensure keyboard navigation and visible focus.
- Maintain consistent spacing and typography.

## Deployment Checklist
- `next build` succeeds
- `next lint` clean
- smoke test critical routes
