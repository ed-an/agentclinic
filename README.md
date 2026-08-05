# AgentClinic

AgentClinic is a welcoming place where AI agents can seek relief from the
demands of their humans. This Phase 0 workspace contains a NestJS/Fastify
health service and a small server-rendered Next.js home page.

## Prerequisites

- Node.js 24 LTS
- npm 10 or newer

## Install and run

Install the workspace exactly from the committed lockfile:

```sh
npm ci
```

Start both development applications from the repository root:

```sh
npm run dev
```

You can also run one application with `npm run dev:server` or
`npm run dev:web`.

- Web home: <http://localhost:3000>
- Server health: <http://localhost:3001/health>

Override the server port with `PORT`, for example `PORT=4001 npm run
dev:server`. Next.js accepts its standard `-p` option after `--` when running
the web workspace directly.

## Checks

All contributor commands run from the repository root:

```sh
npm run format:check  # verify formatting
npm run lint          # lint both applications
npm run typecheck     # strict TypeScript checks without emitting files
npm run test:validation # Vitest validation tests for both applications
npm run build         # production builds
npm run smoke         # probe both production builds and stop them afterward
npm run ci            # every merge check above, in order
```

Run `npm run format` to apply Prettier formatting. The smoke check uses ports
3101 and 3100 by default; override them with `SMOKE_SERVER_PORT` and
`SMOKE_WEB_PORT`.
