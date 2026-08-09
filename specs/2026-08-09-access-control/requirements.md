# Access Control — Requirements

## Context

This feature delivers Phase 10, **Access control**, from [the roadmap](../roadmap.md). Phases 3–9 intentionally used public demonstration routes while establishing the Agent directory, catalogs, booking, Agent dashboard, and staff queue. Phase 10 replaces those temporary identity assumptions with authenticated Agent and Staff accounts, persistent server-side sessions, role checks, and Agent ownership enforcement. Public discovery, availability, booking, and safe confirmation remain available.

The work supports [the mission](../mission.md) by protecting care information while preserving a warm, clear, accessible demonstration experience. It follows [the technical constitution](../tech-stack.md): NestJS is authoritative for authentication, authorization, validation, persistence, and response shaping; Prisma and SQLite remain server-only; Next.js consumes the versioned HTTP API and protects server-rendered pages; UTC and the controlled clock govern session expiry; and automated security, accessibility, migration, and browser evidence is required.

## Goal

Provide email/password authentication for the two roles `AGENT` and `STAFF` so that:

- demonstration users can sign in, keep an opaque database-backed session across refresh and server restart, inspect the current safe identity, and sign out;
- staff operations are available only to Staff accounts;
- Agent dashboard and cancellation operations derive identity from the authenticated Agent account and cannot access another Agent's records;
- unauthenticated, wrong-role, wrong-owner, expired-session, CSRF, CORS, and redirect failures are handled safely and consistently; and
- public catalogs, availability, booking, and safe appointment confirmation continue to work without authentication.

## Decisions

### Compatibility and dependency decision

1. Target the required Node 24.19.0 environment and the repository's current NestJS 11/Fastify 5, Prisma 7/SQLite, Next.js 15, Vitest 3, and Playwright stack.
2. Use Node's stable built-in asynchronous `crypto.scrypt` for password hashing with a unique random salt, `N = 2^17`, `r = 8`, `p = 1`, a 64-byte derived key, and an explicitly sufficient `maxmem`. Encode a versioned record containing algorithm, parameters, salt, and derived key; compare equal-length derived keys with `timingSafeEqual`.
3. This chooses no third-party password-hashing dependency. Node 24.19 includes built-in Argon2id, but that API is Stability 1.2 (release candidate) in the required runtime. Using stable built-in scrypt avoids experimental-API and native-addon installation risk across local, build, seed, Vitest, and Playwright environments while meeting OWASP's documented minimum scrypt profile. Reconsider Argon2id after the required Node LTS API is stable and repository performance measurements justify migration.
4. Generate session tokens, CSRF tokens, salts, and UUIDs with Node cryptographic primitives. Session and CSRF tokens contain at least 256 bits of entropy. Hash opaque tokens before persistence with a one-way cryptographic digest; raw tokens exist only at request/cookie boundaries and must never be logged or stored.
5. Use the Fastify 5-compatible `@fastify/cookie` plugin only for cookie parsing/serialization if required; do not use JWT, Passport session state, localStorage, sessionStorage, or a client-side authentication library. Verify the resolved plugin version, Node engine, production build, and dependency audit before merge.
6. Database-backed sessions are compatible with the modular NestJS server and Prisma/SQLite adapter because authentication state remains durable and server-authoritative. Prisma models express primary, foreign-key, nullability, and unique constraints. Add manually controlled SQLite `CHECK` constraints in the migration where Prisma schema language cannot express the cross-field role/Agent invariant, following the repository's existing custom-migration practice, and cover schema consistency explicitly.

Primary compatibility references: [Node 24.19 crypto documentation](https://nodejs.org/docs/latest-v24.x/api/crypto.html), [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Fastify cookie plugin](https://github.com/fastify/fastify-cookie), and [Prisma database feature guidance](https://www.prisma.io/docs/orm/reference/database-features).

### Accounts and persistence

7. Add `UserAccount` with stable UUID `id`, normalized lowercase unique `email`, `passwordHash`, single `role` (`AGENT` or `STAFF`), nullable unique `agentId`, `isActive`, `createdAt`, and `updatedAt`.
8. Every `AGENT` account has exactly one linked Agent; every `STAFF` account has no Agent link. Enforce the relation, uniqueness, and role/link combination at database level where practical and again in server policy.
9. Add `AuthSession` with stable UUID `id`, `accountId`, unique `tokenHash`, `csrfTokenHash` (or an equivalent server-side binding), `createdAt`, `expiresAt`, and nullable `revokedAt`.
10. Use an eight-hour absolute lifetime with no rolling extension, remember-me, refresh token, or client-side token. A successful sign-in always creates a fresh session. Expired, revoked, unknown, malformed, or inactive-account sessions are rejected.
11. Store only cryptographic hashes of session and CSRF tokens. Never persist plaintext passwords, raw session tokens, or raw CSRF tokens.

### Demonstration identities

12. Seed one Staff account and one Agent account for every seeded Agent using stable IDs, normalized unique emails, and precomputed versioned scrypt hashes so seeding is deterministic and repeat-safe.
13. Clearly document non-production demo credentials in a safe developer-facing location. Gate account seeding behind an explicit local/demo seed configuration so credentials are never silently treated as production identities.
14. Seeds create no sessions and never print passwords, hashes, or tokens. Production deployment and credential management remain outside Phase 10.

### Authentication API and behavior

15. Prefer `POST /auth/sign-in`, `POST /auth/sign-out`, and `GET /auth/session` under the existing versioned API convention.
16. Sign-in strictly validates a normalized email and password, rejects unknown/additional fields and oversized bodies, and returns one generic `401` shape for unknown account, wrong password, and inactive account.
17. Verify unknown accounts against a valid dummy scrypt record to reduce account-enumeration timing differences. Do not claim exact timing equality; test the shared code path and response contract.
18. Apply bounded per-source and per-normalized-identity in-memory sign-in throttling suitable for the current single-instance demonstration. Fix and document its threshold, window, retry response, controlled-clock behavior, bounded storage/eviction, and recovery. It is not a distributed production control.
19. Successful sign-in replaces any presented session: revoke the prior valid session where identifiable, generate an independent new session and CSRF token, and set the approved cookie. Failed sign-in creates no session and does not preserve a misleading authenticated state.
20. Sign-out revokes the current session and clears the cookie. Missing, invalid, expired, or already revoked sessions still produce a safe idempotent sign-out outcome without reviving state.
21. Current-session lookup returns only account ID, normalized email, role, expiration, and—for Agents—the linked Agent ID and safe Agent name. Return a CSRF token only as required by the approved double-submit/header design. Never expose hashes, password material, raw relations, or Prisma records.

### Cookie, CSRF, CORS, and redirect policy

22. The session cookie is `HttpOnly`, `Secure` in production, `SameSite=Lax` or stricter where compatible, `Path=/`, host-only unless a deployment document requires a domain, and has `Max-Age`/`Expires` aligned with server expiry. It contains only the opaque raw session token.
23. Require a custom-header CSRF token bound to the same server-side session for authenticated state-changing `POST`, `PATCH`, and `DELETE` operations. Compare its hash safely and return `403` for missing, invalid, cross-session, expired, or revoked bindings.
24. Validate `Origin` for sign-in and every state-changing request. SameSite is defense in depth, not the sole CSRF control. Preserve public appointment-booking idempotency and ensure an unrelated authentication cookie neither converts public booking into an authenticated mutation nor bypasses its origin policy.
25. Allow credentialed CORS only for explicitly configured, startup-validated trusted web origins. Reflect only a matched origin, emit the required credentials/vary behavior, never combine credentials with wildcard origin, and reject untrusted origins. Document the local web origin.
26. Accept return paths only as parsed, same-origin relative application paths. Reject protocol-relative, absolute, encoded, backslash, credential-bearing, or otherwise ambiguous targets and fall back to the role-appropriate safe destination.

### Authorization policy

27. `/staff/**` pages and APIs require `STAFF`. Agent-owned pages and APIs require `AGENT`. Authentication, role, CSRF, and ownership rules are enforced by NestJS guards/policies and service/repository queries; navigation visibility is never authorization.
28. Unauthenticated protected APIs return `401`. Authenticated wrong-role or wrong-owner requests return `403`, except use a non-revealing `404` where revealing whether another Agent's specific resource exists would disclose private information. Document and test the endpoint-by-endpoint choice.
29. Agent identity always comes from the authenticated session. Browser-controlled route, body, or query `agentId` is not accepted for Agent-owned operations.
30. Replace the route-selected Agent dashboard with `/agent/dashboard` and prefer `GET /agent/appointments/upcoming` plus `POST /agent/appointments/:appointmentId/cancel`. Disable or protect every legacy Agent-ID route so direct calls cannot bypass policy.
31. An Agent may read or cancel only Appointments belonging to its linked Agent record. Ownership is included in the authoritative database predicate for reads and mutations to avoid check-then-use gaps.
32. Staff retain their protected queue and mutation API shapes where practical but never gain Agent ownership implicitly. Agents never access staff operations.
33. Public catalogs, therapy discovery, availability, booking, and safe appointment confirmation remain public. Their responses must not leak protected account, session, or Agent-owned information.

### Page and navigation behavior

34. Add an accessible sign-in page, sign-out action, expired-session recovery, and authenticated navigation. Signed-out users see **Sign in**; Agents see **My dashboard** and **Sign out**; Staff see **Staff appointments** and **Sign out**.
35. Server-rendered page protection must work without JavaScript. Unauthenticated page requests redirect to sign-in with a validated return path; wrong-role users receive a clear non-sensitive forbidden/not-found state as selected by policy.
36. Protected content must not be rendered into unauthorized HTML, metadata, streamed payloads, client state, or caches. Authenticated responses must not be publicly cached or shared across users.
37. Remove Phase 8/9 unauthenticated-demo access paths and warnings. Migrate Agent dashboard identity from a route-selected Agent to the signed-in account without changing appointment business rules.
38. Provide warm, non-enumerating loading, validation, authentication failure, forbidden/not-found, expired-session, success, sign-out, and retryable server-error states with correct focus and announcements.

## Quality requirements

- Use strict TypeScript, thin NestJS controllers, injectable application services, explicit repository and policy boundaries, strict DTOs, and the controlled server clock.
- Keep Prisma/SQLite access exclusively in NestJS and preserve every Phase 2–9 persistence and transaction guarantee.
- Meet WCAG 2.2 AA; support keyboard-only operation and JavaScript-disabled page protection; produce no serious or critical axe violations.
- Reflow from 320 CSS pixels/400%-zoom-equivalent through 1440px without horizontal overflow, hidden controls, or exposed protected content.
- Apply safe structured logging: credentials, password hashes, cookies, session/CSRF tokens and hashes, and unnecessary personal details never enter logs, errors, URLs, HTML, screenshots, traces, or seed output.
- Add focused migration, seed, cryptography, throttling, session-boundary, cookie, API-contract, policy-matrix, ownership, CSRF, CORS, redirect, privacy, concurrency, UI, and browser tests.
- Use Node 24.19.0 and the previously successful Playwright environment. Report environmental limitations as blocked; do not use `sudo` or silently skip checks.

## Out of scope

- Self-registration, password reset/change, email verification, MFA, SSO, OAuth, social login, visitor accounts, API keys, or production identity-provider integration.
- Account administration UI, role editing, multiple roles, impersonation, device management, remember-me, refresh tokens, or notification email.
- Full security audit logging, distributed throttling, production credential management, or a full security audit.
- Catalog editing, appointment rescheduling/reminders, analytics, or any later roadmap feature.

## Completion outcome

Agents and Staff can use seeded demonstration credentials to establish durable, opaque, expiring sessions and reach only their authorized workflows. Agent ownership is derived from the session and enforced in server queries, staff access is role-protected, public discovery and booking still work, security boundaries fail safely, and all required migration, regression, accessibility, browser, dependency, and privacy checks pass.
