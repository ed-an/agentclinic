# Accessible Clinic Shell — Validation

## Merge standard

Phase 1 can be merged only when all required static, component, browser, build, and manual evidence below passes. Manual review supplements but does not replace automated validation.

## 1. Static checks

Run the root formatting, linting, and strict type-check commands.

**Success:** both workspaces pass with no warnings promoted to errors, type checking emits no artifacts, and Tailwind/PostCSS configuration is covered.

## 2. Vitest validation

Run `npm run test:validation` from the repository root.

Verify focused tests cover:

1. one banner, main, and contentinfo landmark;
2. accessible brand and primary-navigation names;
3. all specified navigation destinations and `aria-current` behavior;
4. the skip link as the first keyboard stop and the main landmark as its target;
5. loading status, empty-state heading, and error alert/retry semantics;
6. unique headings and scope-accurate content on placeholder routes; and
7. automated axe scans of the shell and state patterns with no violations.

**Success:** all Vitest tests pass deterministically without a running application or external service.

## 3. Production build

Run the root production-build command.

**Success:** NestJS and Next.js build successfully, Tailwind generates the expected stylesheet, and every placeholder route is included in the Next.js route output.

## 4. Playwright accessibility and navigation

Run the documented root Playwright validation command.

Verify that it:

1. starts the web application on an isolated test port and always stops it;
2. runs axe against Home, Agents, Ailments, Therapies, Appointments, and Staff with no serious or critical violations;
3. tabs first to the skip link, activates it, and moves focus to main content;
4. reaches and activates primary navigation links using only the keyboard;
5. confirms the destination route and current-page indication after navigation; and
6. fails for broken routes, inaccessible names, or keyboard-order regressions.

**Success:** all supported-browser checks exit zero and leave no web process listening.

## 5. Responsive review

Use automated browser checks at representative 320-pixel phone, tablet, and desktop viewport widths, then supplement them with a 400% zoom review.

Confirm that:

1. header navigation wraps without clipping or overlap;
2. no route has horizontal page scrolling;
3. headings and state messages maintain readable line lengths;
4. focus indicators remain visible; and
5. all content and functionality remain available without a mobile-menu interaction.

**Success:** all routes reflow without lost content or functionality across the required viewport and zoom conditions.

## 6. State-pattern review

Render loading, empty, and error patterns through their focused tests and applicable Next.js boundaries.

**Success:** messages are warm and actionable, roles are announced correctly, retry is offered only for recoverable errors, and loading animation is disabled when reduced motion is preferred.

## 7. Scope review

Confirm that the implementation follows [the mission](../mission.md), [the technical constitution](../tech-stack.md), and [requirements.md](requirements.md).

**Success:** the feature adds only the shell foundation, honest placeholder routes, design tokens, and reusable states; it introduces no domain data, operational controls, database work, authentication, or premature server behavior.

## Merge checklist

- [ ] Formatting, linting, and strict type checking pass.
- [ ] All focused Vitest and axe validation tests pass.
- [ ] Both production builds pass.
- [ ] Runtime smoke checks pass and clean up their processes.
- [ ] Playwright axe, navigation, keyboard, and responsive checks pass and clean up their process.
- [ ] Every primary navigation destination resolves and identifies the current page.
- [ ] Loading, empty, and error patterns meet their semantic requirements.
- [ ] Phone, tablet, desktop, and 400% zoom reviews pass without horizontal page scrolling.
- [ ] README and CI document and execute the new validation workflow.
- [ ] Mission, technical constitution, and scope reviews reveal no unexplained deviation.
