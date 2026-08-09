# Access Control — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Confirm the Phase 10 contract and security map

1. Inventory every public, Agent, staff, booking, confirmation, legacy Agent-ID, page, and API route introduced through Phase 9.
2. Record an endpoint/page matrix covering public access, required role, ownership predicate, `401`/`403`/non-revealing `404`, CSRF, Origin, and redirect behavior.
3. Fix cookie name/options, trusted local origin, return-path parser, eight-hour boundary, sign-in throttle policy, safe error shapes, and no-cache rules.
4. Confirm Phase 10 includes only the approved authentication and access-control scope.

**Checkpoint:** one testable route and threat-boundary contract covers every existing surface.

## 2. Prove cryptography and dependency compatibility

1. Implement and benchmark asynchronous Node `scrypt` at `N=2^17`, `r=8`, `p=1`, 64-byte output, sufficient `maxmem`, unique salts, versioned encoding, and constant-time verification on Node 24.19.0.
2. Implement cryptographically random UUID, session-token, and CSRF-token generation with at least 256 bits of token entropy and one-way token hashing.
3. Establish dummy-hash verification for unknown accounts and redaction tests for all secret material.
4. Verify any Fastify cookie plugin against Fastify 5/NestJS 11, server build/test startup, and the dependency audit; add no password-hashing package.

**Checkpoint:** stable runtime primitives and the minimal cookie integration work in every required environment without secret exposure.

## 3. Add account and session persistence

1. Add `UserAccount`, `AuthSession`, roles, relations, indexes, and timestamps through Prisma and a committed migration.
2. Enforce normalized email and unique session hashes; enforce `AGENT`-requires-Agent and `STAFF`-forbids-Agent with SQLite constraints where practical and matching application checks.
3. Preserve the Phase 9 database, all Appointment/status-event records, and the manually managed active-slot partial index.
4. Prove clean migration, Phase 9 upgrade, repeated no-op deployment, schema consistency, direct constraint behavior, and unchanged legacy data.

**Checkpoint:** accounts and sessions are durable without weakening any existing persistence invariant.

## 4. Seed deterministic demonstration accounts

1. Define stable Staff and per-Agent account IDs, normalized emails, explicit demo-only enablement, documented credentials, and precomputed versioned scrypt hashes.
2. Make seeding repeat-safe with exactly one account per approved identity and no sessions.
3. Prove no plaintext password, hash, raw token, or credential output appears in logs or tracked runtime configuration.
4. Test production-like configuration refuses silent demo credential seeding.

**Checkpoint:** deterministic local identities are clearly non-production and safely seeded.

## 5. Build session lifecycle services and APIs

1. Add strict sign-in DTO/body limits, normalization, generic credential failure, dummy verification, bounded controlled-clock throttling, and secure session rotation.
2. Add server-side session resolution for valid, missing, malformed, unknown, expired, revoked, and inactive-account cases.
3. Add safe current-session DTO shaping with only the approved Agent identity fields.
4. Add idempotent sign-out that revokes the current session and clears the cookie.
5. Test exact expiry boundary, restart persistence, fixation resistance, rotation, cookie attributes, safe responses, and redaction.

**Checkpoint:** authentication creates, resolves, rotates, expires, and revokes opaque sessions safely.

## 6. Establish CSRF, Origin, CORS, and redirect defenses

1. Bind a CSRF token to each session and require its custom header on authenticated state-changing requests.
2. Validate configured trusted origins for sign-in and mutations; configure credentialed CORS without wildcard origins.
3. Build and fuzz the same-origin relative return-path validator and role-safe fallbacks.
4. Separate public booking/idempotency behavior from authenticated mutation handling so an unrelated cookie creates no bypass.
5. Test cross-session, expired, revoked, missing, malformed, untrusted-origin, preflight, wildcard, and encoded-redirect attacks.

**Checkpoint:** browser credentials cannot be abused cross-site and redirects remain inside the application.

## 7. Protect staff operations

1. Add authentication and `STAFF` role guards/policies to every staff page and API while retaining response shapes where practical.
2. Ensure Agents cannot read, confirm, or cancel through staff endpoints and direct legacy requests cannot bypass guards.
3. Remove the unauthenticated staff demonstration warning and render the authenticated Staff identity/navigation state.
4. Test `401`, `403`, CSRF, Origin, server-rendered page protection, cache control, and all Phase 9 staff behavior.

**Checkpoint:** only Staff sessions can use the existing staff queue and mutations.

## 8. Migrate Agent identity and enforce ownership

1. Add `/agent/dashboard`, `GET /agent/appointments/upcoming`, and authenticated Agent cancellation without accepting browser-selected `agentId`.
2. Put authenticated Agent ownership into repository read/mutation predicates and select non-revealing `404` behavior for another Agent's Appointment.
3. Disable, redirect, or protect prior route-selected Agent pages/APIs so identifiers in routes, bodies, and queries cannot bypass ownership.
4. Prove Staff gain no Agent ownership and one Agent cannot discover, read, or cancel another Agent's Appointment.
5. Preserve controlled-clock eligibility, idempotency, status-event history, availability restoration, concurrency, and privacy behavior.

**Checkpoint:** Agent access is session-derived and ownership-safe at the authoritative server boundary.

## 9. Build sign-in, sign-out, recovery, and navigation UI

1. Add the accessible sign-in page with generic invalid-credential, throttle, validation, loading, and retryable-error states.
2. Add no-JavaScript-capable page redirects with validated return paths and role-appropriate post-sign-in destinations.
3. Render signed-out, Agent, and Staff navigation exactly as approved and implement accessible sign-out.
4. Handle refresh, server restart, expiry, direct URLs, wrong roles, and recovery without rendering protected content into unauthorized HTML.
5. Remove Phase 8/9 unauthenticated-demo paths and warnings and test focus, announcements, keyboard use, and responsive layouts.

**Checkpoint:** each role sees a clear, accessible journey and protected pages remain protected before hydration.

## 10. Automate the authorization and browser matrices

1. Cover every protected staff and Agent API/page as unauthenticated, Agent, Staff, correct owner, and wrong owner where applicable.
2. Cover sign-in for both roles, generic failures, throttling/recovery, current session, rotation, refresh/restart persistence, expiry, and idempotent sign-out.
3. Cover CSRF, CORS, Origin, return-path, fixation, identifier manipulation, unauthorized HTML, cache, and secret/privacy attacks.
4. Add Playwright journeys for Agent sign-in/dashboard/cancellation and Staff sign-in/queue management, including direct URL and ownership attacks.
5. Validate keyboard/focus, no-JavaScript protection, axe, 320px/400%-zoom-equivalent, 1440px, overflow, and retryable failures.

**Checkpoint:** automated evidence proves the full identity, authorization, browser, and accessibility contract.

## 11. Run regressions and merge-readiness checks

1. Run every Phase 2–9 migration, persistence, catalog, availability, booking, idempotency, concurrency, cancellation, dashboard, staff queue, privacy, accessibility, timezone, and controlled-clock test.
2. Reprove that `PENDING` and `CONFIRMED` block slots, the active-slot partial index remains intact, and status-event history stays append-only.
3. Run Prisma generation, formatting, linting, strict type checking, validation tests, migration/schema checks, production builds, smoke tests, complete Playwright, relevant dependency audit, and `git diff --check` on Node 24.19.0.
4. Inspect tracked files, database, seed output, logs, responses, HTML, URLs, screenshots, traces, and errors for credentials, hashes, tokens, or excess personal data.
5. Record required evidence, any environmental blocker, and confirmation that no out-of-scope identity or later-phase feature was introduced.

**Checkpoint:** all automated and manual evidence is green and the branch is ready for review without claiming completion prematurely.
