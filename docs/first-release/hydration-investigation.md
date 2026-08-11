# Hydration warning investigation

Date: 2026-08-11

Branch: `feature/first-release`

WIP reference inspected, not merged or modified: `wip/hydration-warning-workaround` / `e2789e7`

## Method and evidence

The WIP changes only `<body>` to `<body suppressHydrationWarning>` and does not identify or correct a markup source. Current main-derived code retains ordinary `<html lang="en"><body>` markup.

Production builds were exercised in Playwright with console warning/error capture before browser extensions were simulated. The home page rendered and hydrated without a hydration, server-rendered-HTML, or markup-mismatch warning.

Extension-like behavior was then isolated by intercepting the server HTML and adding `data-extension-injected="true"` to `<body>` before React hydrated. The attribute was present, the application remained interactive, and the controlled Chromium run emitted no captured hydration/mismatch warning. This proves the injection path was exercised but does not claim to represent every extension or browser mutation.

Automated evidence is in `apps/web/e2e/hydration-warning.spec.ts`. The complete Playwright suite remains the regression gate.

## Disposition

No application-owned server/client markup mismatch is reproducible in the controlled extension-free run, and the selected extension-injected attribute also does not reproduce the warning. There is therefore no source defect to fix and no justification for merging `suppressHydrationWarning`, which could conceal future real mismatches.

Recommendation: after human review of this evidence, retire/delete `wip/hydration-warning-workaround` through a separate explicitly approved branch action. Until then, leave it unchanged.
