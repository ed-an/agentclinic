# Workspace and Project Checks — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next; keep the repository working at every checkpoint.

## 1. Establish the npm workspace

1. Convert the root package configuration to a private npm workspace containing `apps/server` and `apps/web`.
2. Add discoverable root scripts for development, formatting verification, linting, type checking, tests, builds, smoke checks, and the complete CI sequence.
3. Add shared, minimal formatting and linting configuration while allowing framework-specific configuration where necessary.
4. Remove or relocate the old single-package starter files once they are no longer referenced.
5. Refresh the lockfile through npm and confirm a clean locked install succeeds.

**Checkpoint:** npm recognizes both workspaces, root scripts resolve to the intended packages, and no obsolete starter entry point remains active.

## 2. Add the NestJS health service

1. Scaffold `apps/server` as a strict TypeScript NestJS application.
2. Configure the NestJS Fastify adapter and a documented, overridable server port.
3. Add a narrow `GET /health` controller that returns a stable healthy JSON response.
4. Add an HTTP-level automated test for the status code and response contract.
5. Wire server lint, type-check, test, build, development, and start scripts into the root commands.

**Checkpoint:** the server builds, its focused test passes, and a running instance answers `GET /health` with HTTP `200`.

## 3. Establish the Next.js web application

1. Scaffold `apps/web` as a strict TypeScript Next.js application using the App Router.
2. Configure the root layout with valid document metadata and a server-rendered root route.
3. Wire web lint, type-check, test, build, development, and start scripts into the root commands.

**Checkpoint:** the web application passes its framework checks, builds, starts, and serves its root route.

## 4. Add the minimal AgentClinic home page

1. Add `AgentClinic` as the page's primary heading and browser-document title.
2. Add a concise, warm introduction explaining that AI agents can seek relief from the demands of their humans.
3. Use semantic page structure and ensure the initial content is usable with keyboard and assistive technologies.
4. Keep the page server-rendered and intentionally small; do not add dashboard data, booking controls, a navigation system, or final visual styling from later phases.
5. Add a focused render test for the primary heading and introductory content.

**Checkpoint:** the root URL renders the recognizable AgentClinic home page, its focused test passes, and the page contains no later-phase functionality.

## 5. Complete repository-level checks and documentation

1. Make each root check execute across both workspaces with clear failure output.
2. Add runtime smoke commands that start production builds, probe the server health endpoint and web root, and reliably stop child processes.
3. Update `.gitignore` for workspace dependencies, framework output, coverage, logs, environment files, and local artifacts.
4. Update the README with Node.js and npm prerequisites, install steps, root commands, ports, and the two local URLs.
5. Run every command from a clean installation and correct any difference between package-local and root behavior.

**Checkpoint:** a contributor can follow only the README to install, run, verify, test, build, and smoke-check both applications.

## 6. Add continuous integration

1. Add the repository's CI workflow using an active Node.js LTS release and `npm ci`.
2. Run the single root CI command that covers formatting, linting, types, tests, builds, and runtime smoke checks.
3. Add dependency or build caching only if it does not obscure the workflow or alter correctness.
4. Confirm that a deliberately failing check makes the workflow fail, then restore the valid state.

**Checkpoint:** the branch's CI run passes and executes every merge requirement defined in [validation.md](validation.md).

## 7. Final review

1. Review the result against [requirements.md](requirements.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
2. Remove unused generated files, placeholder routes, dependencies, and scripts.
3. Run the validation procedure from a clean working tree.
4. Record any intentional deviation in the pull request; unresolved required deviations block merge.

**Checkpoint:** all validation evidence is present, no out-of-scope implementation was introduced, and the branch is ready for review.
