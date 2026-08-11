# First release dependency-risk reassessment

Date: 2026-08-11

Runtime: Node 24.19.0

Commands: `npm audit --omit=dev --json` and targeted `npm ls`

The audit reports 5 high, 0 critical production-tree findings. No package was changed, no override was introduced, `npm audit fix` was not used, and no major framework upgrade was attempted.

| Risk                                     | Release tree and reachability                                                                                                             | Disposition, owner, trigger                                                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `find-my-way` `GHSA-c96f-x56v-gq3h`      | NestJS/Fastify resolves `find-my-way@9.6.0`; HTTP/2 remains disabled, so the documented HTTP/2 denial-of-service path remains unreachable | Accepted high risk, not resolved. Server maintainers. Reassess on supported NestJS patch resolving 9.7.0, HTTP/2 enablement, or advisory change.                             |
| Next-bundled PostCSS                     | Next 15.5.22 bundles PostCSS 8.4.31; the application still processes no attacker-controlled CSS or source maps at runtime                 | Accepted high aggregate risk, build-time-only under current behavior. Web maintainers. Reassess on supported non-major Next remediation or runtime CSS/source-map ingestion. |
| Next-bundled Sharp `GHSA-f88m-g3jw-g9cj` | Next bundles Sharp 0.34.5; the application has no `next/image`, direct Sharp call, upload, or attacker-controlled image processing        | Accepted high risk, currently unreachable. Web maintainers. Reassess on supported Next remediation or any image-processing feature.                                          |

The npm-supported Next remediation proposes the prohibited Next 16.3.0 major upgrade. These findings may remain accepted only while the stated reachability assumptions remain true and the release owner/Technical reviewer explicitly accept them. Any critical advisory or changed production reachability is NO-GO.
