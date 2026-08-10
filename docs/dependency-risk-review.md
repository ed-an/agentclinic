# Phase 11 dependency risk review

The following known risks are explicitly accepted for the Phase 11 release. The current audit reports no critical advisory. This acceptance does not suppress advisories or claim that they are fixed.

## Blocked supported remediation

- `GHSA-c96f-x56v-gq3h`: production path `@nestjs/platform-fastify@11.1.28` → `find-my-way@9.6.0` and `fastify@5.10.0` → the same router. `npm update` and `npm dedupe` retain NestJS's 9.6.0 installation. Adding 9.7.0 directly leaves the vulnerable nested runtime copy, so that attempted change was removed and is not claimed as remediation. HTTP/2 remains disabled, making the advisory's documented path unreachable in this application. Owner: server maintainers. Trigger: a supported NestJS 11 patch that resolves 9.7.0, enabling HTTP/2, or changed advisory reachability. No override is used.

## Accepted pending supported framework remediation

- Next-bundled PostCSS advisories remain build-time-only: the application does not process attacker-controlled CSS or source maps at runtime. Installed Next.js bundles PostCSS 8.4.31. Owner: web maintainers. Trigger: supported non-major Next remediation, new runtime CSS ingestion, or changed advisory reachability.
- `GHSA-f88m-g3jw-g9cj` remains in Next-bundled Sharp 0.34.5. No `next/image`, direct Sharp call, or attacker-controlled image processing is present. Owner: web maintainers. Trigger: enabling image optimization/upload or supported Next remediation.

The npm-supported remediation currently proposes Next 16.3.0, a prohibited major upgrade without explicit approval. No transitive override or `npm audit fix` is used. Any new production-reachable high/critical finding blocks merge pending evidence-based review.

## Accepted operational limitations

- Sign-in throttling is bounded, in-memory, single-instance state. It resets on restart and is not coordinated across replicas. Reassess before adding multiple application instances or load-balanced authentication.
- SQLite and the current lifecycle boundary are not designed for horizontal scaling or multiple active writers. Reassess before introducing replicas, multiple writers, or horizontal scaling.
- Monitoring, alert delivery, centralized secret management, backup scheduling, remote retention, and encryption at rest remain deployment-infrastructure responsibilities.
