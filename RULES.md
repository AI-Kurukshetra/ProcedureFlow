# Next.js Frontend Rules

## Always
- Preserve functionality
- Improve hierarchy, spacing, readability, and consistency
- Keep the UI clean, modern, and production-ready
- Follow existing project architecture
- Respect server/client component boundaries
- Keep responsive behavior solid across screen sizes
- Keep accessibility in mind for structure, contrast, and focus states
- Reuse patterns before inventing new ones

## Never
- Do not rewrite unrelated business logic
- Do not add "use client" unless required
- Do not move server-side work to the client without a reason
- Do not break routing, layouts, metadata, or SEO behavior
- Do not introduce inconsistent component patterns
- Do not overdesign with excessive gradients, shadows, or decoration
- Do not ignore loading, empty, error, success, or disabled states
- Do not add unnecessary dependencies

## Design Direction
- Minimal
- Professional
- Consistent
- Accessible
- Responsive
- Production-grade

## Visual System
- 4px/8px spacing rhythm
- Consistent radius values
- Limited shadow levels
- Clear type hierarchy
- Clean surfaces and borders
- Strong CTA clarity
- Subtle interaction feedback

## Component Direction
- Shared button variants
- Shared input and form styles
- Shared card and section patterns
- Predictable modal/drawer structure
- Readable tables and list layouts
- Clear navigation and active states

## Implementation Preference
- Prefer composable components
- Prefer readability over cleverness
- Prefer consistency over novelty
- Prefer existing project conventions over personal style
- Prefer small safe refactors over broad rewrites
