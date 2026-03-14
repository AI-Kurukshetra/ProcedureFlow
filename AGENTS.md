# AGENTS.md

## Purpose
This file gives AI agents and contributors a clear, production-oriented checklist for working on the Next.js frontend.

## Operating Rules
- Preserve existing behavior and routes.
- Respect Server/Client component boundaries.
- Do not add `"use client"` unless needed for interactivity.
- Keep data-fetching on the server when possible.
- Avoid breaking SEO, metadata, or route structure.
- Follow the project’s UI rules and skill guidelines in `RULES.md` and `SKILL.md`.

## Required Quality Bar
- Accessible UI: labels, focus states, contrast.
- Responsive layouts across mobile/tablet/desktop.
- Clean, consistent UI components (buttons, inputs, cards, tables).
- Stable state handling (loading/empty/error/success/disabled).
- Minimal dependencies and clean code organization.

## Verification Checklist
- `npm run build` passes.
- No console errors in development.
- Core flows: auth, CRUD, dashboard, analytics.
- Critical pages render and are responsive.

## Branching & Commits
- Keep commits small and focused.
- Use clear messages: `feat: ...`, `fix: ...`, `chore: ...`.
