# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Demo repo for UCAAT 2026 showing **two contrasting ways to apply AI to E2E test self-healing**: a passive CI workflow (single agent, opinion-free) and an active local concertation between three specialist subagents. The app itself — a login page and a protected `/admin` page — is intentionally minimal; the interesting surfaces are `.github/workflows/qa-self-healing.yml` (CI path) and `.claude/commands/heal.md` + `.claude/agents/qa-*.md` (active path).

## Commands

- `npm run dev` — start server with nodemon hot reload
- `npm start` — start server (port 3000)
- `npm run test:e2e` — run Playwright tests headless
- `npm run test:e2e:headed` — run with visible browser
- `npm run test:e2e:ui` — Playwright UI mode
- Run a single test: `npx playwright test tests/auth.spec.js -g "sign in"`
- First-time setup after `npm install`: `npx playwright install` (add `--with-deps` on Linux)

Playwright's `webServer` config auto-starts the app via `npm start` and reuses an existing server on `http://127.0.0.1:3000` locally. In CI (`CI=true`), it always spawns a fresh server.

## Architecture

- `server.js` — ESM Express app. All state lives in a single in-memory `sessions` Map keyed by an opaque cookie (`ucaat_session`). Sessions are lost on restart; this is intentional for the demo. Auth is hardcoded: `admin` / `password`. `/admin/*` is behind a `requireAuth` router-level middleware that redirects unauthenticated users to `/?error=auth`.
- `public/` — static HTML served by `express.static`. `index.html` reads `?error=` / `?logged_out=` query params to render status banners. `admin.html` is the post-login page.
- `tests/auth.spec.js` — single Playwright spec covering the full login → admin → logout flow. Uses role/label-based selectors (`getByLabel`, `getByRole`) intentionally, so self-healing has meaningful signals to reason about when HTML labels/roles drift.
- `playwright.config.js` — `trace`, `screenshot`, and `video` are all `"on"` (not `on-first-retry`) so CI always has rich artifacts for the healing agent. In CI, an additional JSON reporter writes `playwright-report/results.json`, which the healer parses first.

## Self-healing CI workflow

`.github/workflows/qa-self-healing.yml` is the centerpiece. Flow:

1. `qa` job runs Playwright on push to `main` (only when `tests/`, `server.js`, `public/`, `playwright.config.js`, or `package*.json` change) and uploads `playwright-report/` + `test-results/` as artifacts.
2. `self-heal` job runs only `if: failure()` from the `qa` job, skips if the commit came from `github-actions[bot]` or contains `[skip-heal]` (to avoid heal loops), and downloads the artifacts.
3. It computes `git diff HEAD~1 HEAD -- server.js public/ > /tmp/app-diff.patch` and passes that plus the artifacts to the Claude Code CLI (installed globally from `@anthropic-ai/claude-code`).
4. The agent prompt is embedded inline in the workflow (not a separate file). It references `.github/agents/playwright-test-healer.agent.md` — note that file does not currently exist in the repo; the workflow relies on the inline instructions.
5. Agent tool allowlist is tight: `Read,Edit,Write,Glob,Grep,Bash(npx playwright test:*),Bash(cat:*),Bash(git diff:*)`. Application code (`server.js`, `public/**`, `package.json`) is forbidden by prompt — only `tests/**` and `playwright.config.js` (timeouts only) are editable.
6. Fixes require a confidence score > 0.7 that the failure is an outdated test vs. an app bug. Scores 0.4–0.7 produce diagnostic-only reports; < 0.4 is flagged as a probable app bug. The agent writes `.github/self-heal-report.md`, and `peter-evans/create-pull-request@v6` opens a PR from branch `self-heal/<sha>` with that file as the PR body. The commit message includes `[skip-heal]` so the PR merge doesn't retrigger healing.

When editing the workflow, keep the `[skip-heal]` guard and the `github.actor != 'github-actions[bot]'` check — removing either can cause infinite heal loops. If you change selectors in `public/*.html`, expect the next push to trigger a self-heal PR against `tests/auth.spec.js`; that is the intended demo path.

## Active demo — three-QA concertation

The repo also ships an **interactive** self-healing path as a counterpoint to the CI workflow. Triggered locally by the user typing `/heal` in Claude Code:

- `.claude/commands/heal.md` — orchestrator / arbiter prompt.
- `.claude/agents/qa-functional.md` — argues user-intent perspective.
- `.claude/agents/qa-technical.md` — argues selector/locator perspective.
- `.claude/agents/qa-dev-advocate.md` — deliberately skeptical; defends the app.

Flow: `/heal` reads `playwright-report/results.json`, builds a self-contained brief per failing test, spawns the three panelists **in parallel** (single round, no cross-talk), collects their YAML verdicts, and arbitrates via a fixed decision table (all-heal + all-confidence > 0.7 → APPLY; any app-bug or any confidence < 0.4 → BLOCK; mixed → DEFER to the user). On APPLY, the arbiter writes the Technical panelist's diff, re-runs Playwright, and auto-reverts if the re-run fails. Editing boundary is identical to CI: `tests/**` only.

The demo contrast is intentional — CI is passive, opinion-free, single-model; `/heal` is a multi-agent deliberation whose split verdicts are themselves a signal ("the panel disagreed" = human attention needed).

## Setup

**CI path (`qa-self-healing.yml`)**
1. `claude setup-token` and add the result as repo secret `CLAUDE_CODE_OAUTH_TOKEN`.
2. Repo Settings → Actions → General → Workflow permissions → enable "Allow GitHub Actions to create and approve pull requests" (needed by `peter-evans/create-pull-request`).

**Active path (`/heal`)**
Claude Code loads `.claude/commands/` and `.claude/agents/` at session startup. After adding or editing any of those files, **exit and relaunch** Claude Code for `/heal` and the three `qa-*` subagent_types to become available. No other setup.
