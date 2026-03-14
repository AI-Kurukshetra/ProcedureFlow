# Architecture

## Overview
- Next.js application following the project’s router convention.
- Server Components handle data fetching and composition.
- Client Components are used only for interactivity.

## Layers
- UI: Pages, layouts, and shared components.
- Data: Server-side data access and API boundaries.
- Auth: Session management and access control.

## Conventions
- Keep route structure intact.
- Co-locate components with the feature they serve.
- Prefer shared UI primitives to repeated markup.

## Boundaries
- Secrets stay server-side.
- Client only receives public configuration.
