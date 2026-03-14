# API Rules

## Boundaries
- Server-only secrets stay on the server.
- Client uses only public endpoints and public keys.

## Contracts
- Preserve existing API shapes unless explicitly requested.
- Validate inputs and handle errors consistently.

## Data Access
- Prefer server-side data fetching for sensitive or heavy queries.
- Cache where appropriate to reduce latency.
