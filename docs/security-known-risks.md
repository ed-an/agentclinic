# Security known risks

## 2026-08-27 router advisory remediation

The production server now resolves `@nestjs/platform-fastify@11.2.1` → `fastify@5.11.3` / `find-my-way@9.7.0`. This supported framework update remediates `GHSA-c96f-x56v-gq3h`; the earlier acceptance for the 9.6.0 router is closed. PostCSS and Sharp remain accepted, currently unreachable runtime risks whose supported npm remediation requires the prohibited Next.js 16.3.0 major upgrade. Full evidence, owners, and triggers are in [dependency-risk-review.md](dependency-risk-review.md).

## 2026-08-10 Phase 11 reassessment (superseded router status)

At the time of this reassessment, supported npm update/dedupe retained `find-my-way@9.6.0` under `@nestjs/platform-fastify@11.1.28`; a direct 9.7.0 install left that runtime copy in place and was therefore removed. The HTTP/2-only advisory path was disabled and accepted pending a supported NestJS patch. The 2026-08-27 update above supersedes this router status.

## 2026-08-09 dependency advisory review

The following records preserve the Phase 10 assessment. The 2026-08-27 update supersedes the router status below while retaining the Next-bundled risk context.

### NestJS/Fastify router

**Historical record — remediated 2026-08-27.**

- **Advisory:** `GHSA-c96f-x56v-gq3h`
- **Affected installation:** `find-my-way@9.6.0`
- **Production path:** `@nestjs/platform-fastify@11.1.28` → `fastify@5.10.0` / `find-my-way@9.6.0`
- **Current reachability:** The router is part of the production server, but the advisory's HTTP/2 denial-of-service path is not currently reachable because the application does not enable HTTP/2 in its Fastify adapter.
- **Fixed version:** `find-my-way@9.7.0`
- **Priority:** Prompt separate non-breaking remediation.

### Next-bundled PostCSS

The Next.js dependency tree currently installs `postcss@8.4.31`. Its affected CSS and source-map processing is assessed as build-time-only in the current application; the application does not process attacker-controlled CSS at runtime.

- `GHSA-qx2v-qp2m-jg93` — fixed in `postcss@8.5.10`.
- `GHSA-6g55-p6wh-862q` — fixed in `postcss@8.5.12`.
- `GHSA-r28c-9q8g-f849` — fixed in `postcss@8.5.18`.
- `GHSA-fxqj-rqcc-2cmp` — fixed in `postcss@8.5.23`.

The npm-supported Next-bundled remediation currently requires evaluation of a breaking Next.js major upgrade to Next `16.3.0`. Do not force a transitive override without validating it against Next.js's supported dependency set.

### Next-bundled Sharp

- **Advisory:** `GHSA-f88m-g3jw-g9cj`
- **Affected installation:** `sharp@0.34.5`
- **Current reachability:** Sharp is present through Next.js, but no `next/image` or direct Sharp use currently exposes it through application functionality.
- **Fixed version:** `sharp@0.35.0`

Reassess this advisory before enabling Next.js image optimization or otherwise processing images with Sharp. The npm-supported Next-bundled remediation currently requires evaluation of the breaking Next.js `16.3.0` upgrade.
