# Access Control — Validation

Phase 10 is merge-ready only when every required check below passes. Automate acceptance criteria with Vitest through the root `npm run test:validation` command and use Playwright for critical browser journeys. Use Node 24.19.0 and the previously successful Playwright environment. Report environmental limitations as blocked, never passed; do not use `sudo` or silently skip required checks.

## Migration, schema, and seed

- [ ] Migrations succeed from a clean database and from a completed Phase 9 database containing every Appointment status and status-event form.
- [ ] Repeated migration deployment is a no-op and Prisma generation/schema consistency checks pass.
- [ ] Existing Phase 2–9 data, foreign keys, timestamps, Appointment statuses, and status events remain unchanged.
- [ ] The manually managed active-slot partial unique index remains intact and still covers `PENDING` and `CONFIRMED`.
- [ ] `UserAccount` uses stable UUIDs, normalized unique email, one role, activity state, timestamps, and the approved optional unique Agent relation.
- [ ] Database constraints reject Agent accounts without exactly one linked Agent and Staff accounts with an Agent link where practical; application policy rejects them independently.
- [ ] `AuthSession` enforces account relation and unique token hash and stores creation, absolute expiry, and optional revocation.
- [ ] Account seeding is deterministic and repeat-safe with exactly one Staff account and one account per seeded Agent.
- [ ] Demo seeding requires explicit local/demo configuration, creates no sessions, and is rejected or omitted in production-like configuration.
- [ ] No plaintext passwords, session tokens, CSRF tokens, or secret output exists in the database, migration, seed output, logs, or tracked files.

## Cryptography and dependency compatibility

- [ ] Password records are versioned and contain the approved scrypt parameters, a unique cryptographic salt, and a 64-byte derived key—not plaintext or reversible data.
- [ ] Asynchronous Node scrypt uses `N=2^17`, `r=8`, `p=1`, sufficient explicit `maxmem`, and constant-time equal-length comparison.
- [ ] Valid hashes verify; wrong passwords fail; malformed/unsupported records fail closed; Unicode and approved password-size boundaries are deterministic.
- [ ] Unknown accounts execute verification against a valid dummy hash and share the generic response path with wrong-password and inactive-account failures.
- [ ] Session and CSRF tokens each contain at least 256 bits of cryptographic entropy and are independent across sessions.
- [ ] Raw tokens differ from their persisted hashes; database lookup works only through the hash; generated UUIDs and tokens do not use predictable randomness.
- [ ] The Fastify cookie integration resolves to a Fastify 5/Node 24-compatible maintained version and passes NestJS startup, build, Vitest, Playwright, and relevant dependency audit checks.
- [ ] No third-party password-hashing dependency or experimental Node Argon2 API is introduced.

## Sign-in and throttling

- [ ] Valid Agent and Staff credentials succeed and create the correct role/link identity.
- [ ] Email normalization trims/normalizes according to the fixed contract and supports case-insensitive seeded email lookup without creating aliases.
- [ ] Unknown email, wrong password, and inactive account return the same generic `401` status and safe body.
- [ ] Missing, malformed, oversized, wrongly typed, and unexpected fields return strict safe `400` responses.
- [ ] A valid sign-in creates exactly one durable server-side session and one approved session cookie.
- [ ] A successful repeated sign-in generates an independent token and CSRF binding, replaces the cookie, and revokes the prior identifiable session.
- [ ] Failed authentication creates no session and leaks no existence, password, hash, token, database, or stack detail.
- [ ] Per-source and per-normalized-identity throttles activate at the documented threshold, return the documented bounded response, recover at the controlled-clock boundary, and evict bounded state safely.
- [ ] Throttling cannot be bypassed by email casing/whitespace and does not claim distributed production protection.
- [ ] Responses and logs never expose credentials, cookies, password hashes, token hashes, raw session tokens, or raw CSRF tokens.

## Session lifecycle and cookies

- [ ] A valid session survives page refresh and server restart and returns only approved safe identity fields.
- [ ] Missing cookie returns `401` from current-session lookup and every protected API.
- [ ] Malformed, unknown, expired, revoked, and inactive-account sessions return safe `401` responses and never authorize work.
- [ ] The controlled clock proves validity immediately before expiry and rejection exactly at and after `expiresAt`.
- [ ] The eight-hour lifetime is absolute; requests do not roll server expiry or cookie lifetime forward.
- [ ] Successful sign-in defeats session fixation and never adopts a caller-provided token or CSRF value.
- [ ] Sign-out revokes the current session and clears the cookie; repeated, missing, invalid, expired, and revoked-session sign-outs remain safe and idempotent.
- [ ] Cookie assertions cover `HttpOnly`, `SameSite`, `Path=/`, host-only behavior, aligned `Max-Age`/`Expires`, production `Secure`, and documented safe local-development behavior.
- [ ] Cookie content has no account, role, Agent, appointment, authentication, or personal data beyond the opaque token.
- [ ] Authenticated responses use safe cache controls and identities cannot leak through shared/public caches.

## Authorization matrix

- [ ] Every protected staff and Agent API returns `401` without authentication.
- [ ] Every `/staff/**` API/page permits Staff and denies Agent with the documented `403` or page state.
- [ ] Every Agent-owned API/page permits Agent and denies Staff; Staff never gains Agent ownership implicitly.
- [ ] An Agent can view only the dashboard/appointments belonging to the Agent linked to its account.
- [ ] An Agent can cancel only an eligible Appointment belonging to that linked Agent.
- [ ] Another Agent's Appointment cannot be discovered, read, or cancelled and receives the documented non-revealing `404` where disclosure matters.
- [ ] Route, body, query, duplicate-parameter, encoded-identifier, and stale-client manipulation cannot select or override Agent ownership.
- [ ] Ownership is part of authoritative repository read/mutation predicates; concurrent changes cannot create a check-then-use bypass.
- [ ] Direct requests to every legacy Agent-ID and unauthenticated-demo route cannot bypass authentication, role, or ownership policy.
- [ ] Protected mutations enforce authentication, authorization, Origin, and CSRF independently of UI visibility.
- [ ] Public catalogs, ailments, therapies, availability, booking, and safe confirmation remain accessible without authentication.
- [ ] Public responses expose no account/session fields or new protected Agent information.

## CSRF, Origin, CORS, and redirects

- [ ] Missing, malformed, or invalid CSRF headers return `403` for authenticated state-changing requests.
- [ ] A CSRF token from another session is rejected, even for the same account.
- [ ] Expired, revoked, unknown, and inactive-account sessions cannot use an old CSRF token.
- [ ] Valid CSRF and session bindings succeed only for an otherwise authorized mutation.
- [ ] Sign-in and all state-changing requests reject missing/untrusted Origin according to the documented browser/non-browser policy and accept only configured trusted origins.
- [ ] Credentialed CORS reflects only an exact trusted configured origin, emits appropriate credentials/vary behavior, and never returns wildcard origin.
- [ ] Untrusted preflight and credentialed requests fail without protected data or mutation.
- [ ] Absolute, protocol-relative, cross-origin, backslash, encoded, credential-bearing, malformed, and nested return-path attacks cannot produce an open redirect.
- [ ] Valid same-origin relative return paths work, and invalid paths fall back to the correct safe role destination.
- [ ] Public idempotent booking remains functional with and without an unrelated auth cookie and cannot inherit an authenticated CSRF bypass.

## UI and browser journeys

- [ ] Agent sign-in reaches `/agent/dashboard`, refresh preserves the session, and the Agent can complete an eligible own-Appointment cancellation.
- [ ] Staff sign-in reaches the protected appointment queue and can perform the existing confirm/cancel journey.
- [ ] Agent and Staff sign-out clear identity, prevent back/direct protected access, and return navigation to the signed-out state.
- [ ] Expired sessions redirect protected pages to sign-in with safe recovery and no redirect loop.
- [ ] Invalid credentials provide useful generic feedback without indicating whether the email exists.
- [ ] Signed-out navigation shows **Sign in**; Agent navigation shows **My dashboard** and **Sign out**; Staff navigation shows **Staff appointments** and **Sign out**; unauthorized role links are absent.
- [ ] Direct URL access is protected before hydration and when JavaScript is disabled.
- [ ] Unauthorized server-rendered HTML, metadata, streamed payloads, and client state contain no protected content.
- [ ] Browser/API ownership attack confirms one Agent cannot access or cancel another Agent's Appointment.
- [ ] Browser CSRF and untrusted-origin attempts are rejected without mutation.
- [ ] Loading, validation, throttle, forbidden/not-found, expired, success, sign-out, and retryable server-error states render and recover as specified.
- [ ] Keyboard-only sign-in, sign-out, redirects, dashboard, and staff actions use logical order, visible focus, correct focus restoration/placement, and announced status/errors.
- [ ] Agent and Staff journeys have no serious or critical axe violations.
- [ ] 320px/400%-zoom-equivalent and 1440px layouts preserve readable content and every action without horizontal page overflow.
- [ ] Authentication tokens, credentials, hashes, unnecessary personal data, and protected content do not appear in URLs, HTML, browser console, server logs, screenshots, traces, or errors.

## Regression and merge checks

- [ ] Every Phase 2–9 migration, persistence, Agent, Ailment, Therapy, availability, booking, confirmation, idempotency, concurrency, cancellation, dashboard, staff queue, privacy, browser, accessibility, timezone, and controlled-clock test passes.
- [ ] `PENDING` and `CONFIRMED` continue to block slots and the active-slot partial index remains the final database safeguard.
- [ ] Appointment status-event history remains append-only and every existing transition, cutoff, idempotency, rollback, and privacy rule remains intact.
- [ ] Phase 8/9 unauthenticated-demo paths and warnings are removed without removing authorized functionality.
- [ ] No registration, password management, MFA, OAuth/SSO, account administration, multi-role, impersonation, refresh-token, device, email, production IdP, full audit-log, or later-phase feature is introduced.
- [ ] Prisma generation, formatting, linting, strict type checking, root validation tests, migration/schema checks, production builds, smoke tests, complete Playwright, relevant dependency audit, and `git diff --check` pass on Node 24.19.0.
- [ ] Environmental limitations are reported as blocked, never passed, and no required check is skipped silently.

## Merge gate

- [ ] The branch contains the approved Phase 10 implementation and evidence only.
- [ ] Every checklist item above is passed with reproducible evidence or Phase 10 is not merged.
- [ ] The roadmap is marked complete only after implementation and all validation succeed in a later authorized change.
