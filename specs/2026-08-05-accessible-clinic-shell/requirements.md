# Accessible Clinic Shell — Requirements

## Context

This feature delivers Phase 1, **Accessible clinic shell**, from [the roadmap](../roadmap.md). Phase 0 established the responsive Next.js application and semantic header, main, and footer landmarks. Phase 1 turns that minimal structure into a consistent, navigable foundation for the future AgentClinic journeys.

The shell must follow [the mission](../mission.md): it should feel warm and reassuring, work well for agents and clinic staff, and remain approachable for students and live demonstrations. It must also follow [the technical constitution](../tech-stack.md), particularly WCAG 2.2 AA, mobile-first responsive design, Tailwind CSS, server rendering by default, Vitest validation tests, and browser coverage for critical interaction behavior.

## Goal

Provide a reusable responsive shell in which keyboard and assistive-technology users can move between the home page and clearly identified placeholder areas, while future features can reuse consistent design tokens and loading, empty, and error patterns.

## Decisions

1. Build a multi-route shell with placeholder pages for agents, ailments, therapies, appointments, and staff.
2. Keep placeholder routes informational only; do not introduce domain data, forms, booking behavior, or server endpoints early.
3. Include a skip link, linked AgentClinic brand, primary navigation, semantic page landmarks, and visible keyboard focus.
4. Adopt Tailwind CSS and define reusable semantic design tokens for color, spacing, radius, shadow, and readable content widths.
5. Keep navigation usable without client-side JavaScript by allowing links to wrap on narrow screens rather than adding a menu toggle.
6. Provide reusable loading, empty, and error-state components. Connect the loading and error patterns to Next.js route conventions.
7. Use Vitest with Testing Library and axe for focused semantic, accessibility, and keyboard-order checks.
8. Use Playwright with axe for real-browser accessibility smoke checks, responsive viewport checks, route navigation, and keyboard navigation.

## Functional requirements

### Global shell

- Every application route renders the same header, main-content area, and footer.
- A skip link is the first keyboard-focusable control and moves focus to the main content.
- The header contains a linked AgentClinic brand and a primary navigation landmark.
- Navigation links cover Home, Agents, Ailments, Therapies, Appointments, and Staff.
- The current route is communicated programmatically and visually.
- The main landmark has a stable focus target for skip-link navigation without entering the normal tab order.
- The footer provides concise clinic context without duplicating primary navigation.

### Placeholder routes

- Each future clinic area has its own Next.js route and descriptive document metadata.
- Each placeholder page identifies the area, explains that it is coming in a later phase, and avoids controls that imply unavailable functionality.
- Placeholder pages use the shared page-container and empty-state patterns.
- Unknown routes continue to use Next.js not-found behavior.

### State patterns

- A reusable loading state exposes an accessible status message and does not create distracting animation for users who prefer reduced motion.
- A reusable empty state provides a heading, explanation, and optional action slot.
- A reusable error state uses an alert, gives a clear recovery message, and supports an optional retry action.
- The root route includes Next.js `loading` and `error` boundaries built from these shared components.

### Responsive design and tokens

- The shell is mobile-first and remains usable from 320 CSS pixels through wide desktop displays and at 400% zoom.
- Navigation wraps without clipping, overlap, or horizontal page scrolling.
- Page content uses a reusable centered container and readable line length.
- Color contrast, focus indicators, target spacing, typography, borders, and surfaces derive from reusable semantic tokens rather than one-off values.
- Motion respects `prefers-reduced-motion`.

## Quality requirements

- Components remain server components unless browser state or a framework error boundary requires a client component.
- Navigation and state patterns expose native semantics before ARIA is added.
- Focus is never hidden behind the sticky or static shell.
- Placeholder pages do not fetch data or depend on the server.
- Automated checks run without external application services.
- The implementation remains small and readable enough for course and demonstration audiences.

## Out of scope

- Domain data, search, filters, forms, or operational controls for any placeholder area.
- Database, Prisma, authentication, authorization, or new server endpoints.
- Collapsible mobile-menu state or a complex navigation hierarchy.
- Final brand artwork, animation, dark mode, or polished feature-page design.
- Loading, empty, or error behavior tied to real domain requests.

## Completion outcome

AgentClinic has a warm, responsive, keyboard-navigable shell; future clinic areas have honest placeholder destinations; reusable state patterns and Tailwind tokens are available for later phases; and both component-level and browser-level accessibility checks pass.
