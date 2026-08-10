# Accessibility production checklist

This is a WCAG 2.2 AA-oriented review, not formal certification. Test public catalog/search, booking, Agent sign-in/dashboard/cancellation, Staff sign-in/queue/actions, errors, empty states, expiry, and sign-out.

- Complete every journey using keyboard only; verify logical order and visible focus.
- Verify focus placement/restoration after validation, confirmation, errors, expiry, and navigation.
- Confirm headings, landmarks, labels, descriptions, error association, and status announcements.
- Run axe and block serious/critical findings.
- Inspect text/control/focus contrast in normal, hover, disabled, and error states.
- At 320 CSS pixels and 400%-zoom equivalent, confirm reflow and no horizontal page overflow.
- At 1440px, confirm readable line length and no detached labels/actions.
- Verify useful loading, empty, failure, session-expiry, and recovery states.
- Confirm protected or personal content is absent from unauthorized HTML, URLs, screenshots, traces, and errors.

Record browser/OS, viewport, assistive technology if used, reviewer, date, findings, and remediation evidence.

## Accepted post-merge follow-up

Automated axe, keyboard, focus, reflow, responsive, and critical-browser-journey checks passed for Phase 11. The complete manual NVDA/assistive-technology review was not completed before merge and remains a visible post-merge follow-up. No formal WCAG certification is claimed; complete and record the manual review before making any formal accessibility-compliance claim.
