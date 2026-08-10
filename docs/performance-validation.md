# Local production-build performance validation

Run `npm run performance:validate` on Node 24.19.0. The harness creates and removes a unique temporary migrated/seeded SQLite database, builds both applications, starts production processes, performs two warm-ups per route, and uses 10 samples at concurrency 2.

It measures public read API, authenticated Agent dashboard API, authenticated Staff queue API, home SSR, and Appointments SSR. Reports include environment, mode, sample size, concurrency, p50, p95, maximum, throughput, error rate, and budget. Blocking budgets are 300ms read API, 400ms protected API, 1000ms SSR, zero errors, and a 5000ms hard timeout. Run twice consecutively for the merge gate.

The committed `scripts/performance-baseline.json` records the slower p95 from two consecutive Phase 11 runs. The harness blocks a p95 over either the absolute route budget or the baseline regression ceiling. That ceiling is 120% of the measured baseline after a documented 25ms API/75ms SSR local scheduler noise floor; this prevents a two-millisecond fluctuation from being mislabeled as a material 20% regression while retaining a strict low-latency guard. These conservative local measurements detect regressions; they are not internet latency, capacity planning, or full load testing. Rebaseline only in a controlled environment with explanation and approval.
