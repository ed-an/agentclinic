# Workspace and Project Checks — Validation

## Merge standard

This feature can be merged only when all required evidence below passes on the feature branch and in CI. A manual observation may supplement automation but cannot replace a required automated check.

## 1. Clean installation

From a fresh checkout with no dependency or build directories:

1. Install using the lockfile-preserving clean-install command.
2. Confirm npm discovers `apps/server` and `apps/web` as workspaces.
3. Confirm the installation does not change tracked files.

**Success:** installation exits successfully, both workspaces are present, and `git status` remains clean.

## 2. Static quality checks

Run the documented root commands for:

1. formatting verification;
2. linting; and
3. strict TypeScript checking.

**Success:** every command exits with status zero and covers both workspaces. Type checking must not emit build artifacts or silently skip an application.

## 3. Automated tests

Run the root test command.

Verify that it includes, at minimum:

- an HTTP-level server test proving `GET /health` returns `200` and the documented healthy JSON contract; and
- a web render test proving the home page contains an `AgentClinic` primary heading and mission-aligned introductory content for AI agents.

**Success:** all tests pass without external services, shared state, or an already-running application.

## 4. Production builds

Run the root production-build command.

**Success:** NestJS and Next.js production builds both complete, expected build outputs are produced, and no build output becomes an untracked source file intended for commit.

## 5. Runtime smoke checks

Run the automated root smoke command against production builds on documented test ports.

It must prove that:

1. the NestJS process starts with Fastify;
2. `GET /health` returns HTTP `200` and the expected JSON body;
3. the Next.js process starts;
4. the web root returns HTTP `200` and contains the AgentClinic home-page identifier and introduction; and
5. all spawned processes terminate whether the check passes or fails.

**Success:** the smoke command exits zero, reports both probes clearly, and leaves no server process listening afterward.

## 6. Contributor experience

Follow the README from the perspective of a first-time course student:

1. verify that prerequisites and installation are stated;
2. start both development applications using documented root commands;
3. open the documented server and web URLs; and
4. locate the commands for every required check without inspecting package internals.

**Success:** the documented path works without undocumented setup, database installation, or external service credentials.

## 7. Minimal home-page review

Open the web root in a modern browser and inspect the rendered document.

Confirm that:

1. the document title identifies AgentClinic;
2. there is exactly one `AgentClinic` primary heading;
3. the introduction clearly presents the clinic as a place where AI agents can seek relief from their humans;
4. the initial content has semantic structure and can be reached and read using keyboard and assistive-technology navigation; and
5. the page has no dashboard data, booking controls, full navigation system, or other later-phase behavior.

**Success:** the page is recognizable, warm, and accessible as a minimal AgentClinic home page while remaining within Phase 0.

## 8. Continuous integration

Inspect the branch CI run and its configuration.

**Success:** CI uses an active Node.js LTS release, installs with the committed lockfile, runs the same root CI command used locally, includes static checks, tests, production builds, and both runtime smoke probes, and completes successfully.

## 9. Scope and constitutional review

Confirm that:

- the implementation meets every requirement in [requirements.md](requirements.md);
- the copy is warm, clear, and appropriate for the educational and demo audiences in [the mission](../mission.md);
- the server is NestJS with Fastify and the web application is Next.js as required by [the technical constitution](../tech-stack.md);
- no database, domain workflow, authentication, polished shell, microservice, or unrelated infrastructure work was introduced; and
- no secrets, dependency directories, generated builds, logs, or local environment files are tracked.

**Success:** there are no unexplained deviations and no out-of-scope additions that increase the teaching or demonstration burden.

## Merge checklist

- [ ] Clean locked installation passes and leaves the tree clean.
- [ ] Formatting verification passes for both workspaces.
- [ ] Linting passes for both workspaces.
- [ ] Strict type checking passes for both workspaces.
- [ ] All focused automated tests pass.
- [ ] Both production builds pass.
- [ ] Server and web runtime smoke checks pass and clean up their processes.
- [ ] The minimal AgentClinic home page passes its content and accessibility review.
- [ ] README setup and commands work as written.
- [ ] Branch CI passes the same complete check sequence.
- [ ] Requirements, mission, stack, and scope reviews pass.
