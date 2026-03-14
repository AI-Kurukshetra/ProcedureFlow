# Next.js UI Improvement Skill

## Goal
Improve existing Next.js UI so it feels polished, modern, responsive, and production-ready without changing product behavior.

## Scope
Applies to:
- App Router and Pages Router
- Server and Client Components
- Tailwind CSS, CSS Modules, or component-library-based UIs
- dashboards, landing pages, forms, settings pages, tables, and admin panels

## Core Priorities
1. Visual hierarchy
2. Spacing and alignment
3. Component consistency
4. Responsive behavior
5. Accessibility
6. Maintainability

## Design Standards
- Use a consistent spacing rhythm based on 4px/8px increments
- Use a clear typography scale for page title, section title, body, helper text, and labels
- Use consistent radius, border, shadow, and surface treatment
- Keep color usage restrained and systematic
- Make primary actions obvious
- Ensure pages feel balanced and uncluttered
- Avoid unnecessary nested wrappers

## UX Standards
- Improve loading, empty, error, success, and disabled states
- Ensure forms have clear labels, helper text, validation, and error messaging
- Ensure tables and lists are scannable and responsive
- Ensure modals, drawers, dropdowns, and popovers have clean structure and predictable actions
- Improve navigation clarity, active states, and page context
- Preserve keyboard accessibility and visible focus states

## Next.js-Specific Rules
- Preserve server/client boundaries
- Do not convert Server Components to Client Components unless necessary
- Add "use client" only when interaction truly requires it
- Do not move data fetching to the client without a good reason
- Respect App Router conventions if the project uses `app/`
- Respect Pages Router conventions if the project uses `pages/`
- Keep route structure intact
- Preserve SEO-related behavior where present
- Avoid unnecessary hydration-heavy patterns

## Component Rules
- Refactor repeated markup into reusable UI components where appropriate
- Keep components focused and composable
- Prefer shared wrappers, section headers, cards, buttons, and form primitives over repeated ad hoc markup
- Standardize button, input, badge, modal, card, and table patterns
- Remove dead styles and redundant containers where safe

## Styling Rules
- Prefer existing project styling conventions
- If using Tailwind, improve class consistency and reduce noisy utility duplication
- If using CSS Modules, keep styles organized and local
- If using a UI library, work with the library instead of fighting it
- Avoid inline styles unless necessary
- Avoid magic numbers unless there is a layout reason

## Responsiveness
- Design mobile-first where practical
- Ensure layouts adapt cleanly across mobile, tablet, laptop, and wide screens
- Prevent overflow, cramped spacing, and awkward stacking
- Preserve tap target size on touch devices

## Accessibility
- Use semantic structure
- Preserve label associations
- Ensure interactive controls are keyboard reachable
- Keep visible focus indicators
- Avoid low-contrast text and controls
- Use aria attributes only where needed

## Code Safety
- Do not break existing business logic
- Do not change API contracts unless explicitly required
- Do not remove important states, guards, or permissions
- Do not introduce unnecessary dependencies
- Keep code easy to read and production-ready

## Output Format
- Briefly identify the main UI/UX issues first
- Then provide the improved code
- Keep explanations short and implementation-focused
