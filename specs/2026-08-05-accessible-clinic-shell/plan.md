# Accessible Clinic Shell — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Establish the Phase 1 styling foundation

1. Add Tailwind CSS and its Next.js/PostCSS integration to the web workspace.
2. Replace one-off global layout rules with Tailwind utilities and semantic theme tokens.
3. Retain only essential global element behavior such as document colors, focus scrolling, and reduced-motion handling.
4. Define reusable page-container and content-width conventions.

**Checkpoint:** Tailwind compiles in development and production, shared tokens are discoverable, and the current page remains responsive without horizontal scrolling.

## 2. Build the accessible global shell

1. Add a first-focusable skip link targeting the main landmark.
2. Make the AgentClinic brand a Home link and add a labeled primary navigation landmark.
3. Add links for Home, Agents, Ailments, Therapies, Appointments, and Staff.
4. Communicate the current route visually and with `aria-current`.
5. Refine header, main, and footer components around the shared responsive container.
6. Preserve native landmarks, visible focus indicators, and a logical keyboard order.

**Checkpoint:** the shell works at 320-pixel and desktop widths, exposes one banner/main/contentinfo landmark set, and can be traversed predictably using only Tab, Shift+Tab, Enter, and the skip link.

## 3. Add future-area placeholder routes

1. Create routes for agents, ailments, therapies, appointments, and staff.
2. Give each route unique metadata, a primary page heading, and warm scope-accurate copy.
3. Build a reusable page-header/container pattern.
4. Render the shared empty-state pattern on placeholder routes without fake data or disabled workflow controls.

**Checkpoint:** every primary navigation link resolves successfully, identifies its destination, and remains honest about unavailable future functionality.

## 4. Add reusable state patterns

1. Create reusable loading, empty, and error components with native accessible semantics.
2. Add optional action slots only where they clarify a real next step.
3. Wire shared loading and error components to the root route boundary files.
4. Ensure loading motion respects reduced-motion preferences.

**Checkpoint:** each pattern renders meaningful standalone content, exposes the intended accessible role, and can be reused by later domain features.

## 5. Add focused Vitest accessibility validation

1. Add axe and user-event testing dependencies to the web workspace.
2. Test shell landmarks, accessible names, navigation destinations, and current-page state.
3. Test keyboard order beginning with the skip link.
4. Run axe against the shell and reusable state patterns.
5. Keep page-content tests focused on route-specific outcomes.

**Checkpoint:** focused Vitest tests pass with no axe violations and prove the expected keyboard order and state semantics.

## 6. Add Playwright browser validation

1. Configure Playwright for the production-like Next.js web application.
2. Add an automated axe smoke check for the rendered home page and each placeholder route.
3. Verify real-browser skip-link and primary-navigation keyboard behavior.
4. Verify navigation destinations and current-page indication.
5. Check representative phone, tablet, and desktop viewports for horizontal page overflow.
6. Expose a root script for the browser validation suite and include it in CI.

**Checkpoint:** the browser suite passes against a locally started application and reliably starts and stops its web server.

## 7. Complete documentation and repository checks

1. Document the new routes and browser-test commands in the README.
2. Ensure CI installs the Playwright browser and runs the same root commands used locally.
3. Run formatting, linting, strict types, Vitest validation, production builds, runtime smoke checks, and Playwright validation.
4. Review the work against the mission, technical constitution, requirements, and scope boundaries.

**Checkpoint:** the complete validation procedure passes locally, CI expresses the same requirements, and the branch is ready for review.
