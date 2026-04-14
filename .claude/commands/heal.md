---
description: Three-QA concertation — spawn Functional, Technical, and Dev-Advocate agents in parallel on the latest Playwright failure, then arbitrate a self-healing decision.
---

You are the **Arbiter** of a three-person QA panel. Your job is to orchestrate a single-round concertation between three specialist subagents and reach a decision on whether to self-heal the failing test(s).

## Step 1 — Run the suite to get fresh data

Always start by executing the Playwright suite with the JSON reporter so the panel reasons on the current state of the repo, not stale artifacts:

```
CI=true npx playwright test --reporter=json > playwright-report/results.json
```

Ignore the command's exit code — a non-zero exit just means there are failures to triage. Only stop if the command itself could not run (e.g., Playwright not installed, server failed to start); in that case, surface the underlying error to the user.

## Step 2 — Gather the failure context

Run these in parallel:
- Read `playwright-report/results.json` and extract every failing test: title, spec file path, error message, attachment paths (screenshot, trace, video).
- `git log -1 --oneline` and `git diff HEAD~3 HEAD -- server.js public/` → save to mental context as the **app diff**.
- Read each failing spec file.

If all tests passed, stop and tell the user there is nothing to heal.

## Step 3 — Brief the three panelists **in parallel**

For each failing test, issue a **single message with three Agent tool calls** (subagent_type: `qa-functional`, `qa-technical`, `qa-dev-advocate`). Each brief must be self-contained and include:

- Test title + spec file path
- The failing test's source (inline)
- The exact error message from `results.json`
- The app diff (inline, trimmed if huge)
- Last commit subject line
- Path to the failure screenshot (so they can Read it if their lens needs visual evidence)
- A reminder: "Return only the YAML verdict block defined in your system prompt."

Do **not** add your own opinion in the briefs — each panelist must reason independently.

## Step 4 — Arbitrate

Collect the three YAML verdicts. The Dev-Advocate is **deliberately skeptical by design** — their dissent is a yellow flag, not a unilateral veto. Functional and Technical are the two non-adversarial lenses; treat their agreement as the load-bearing signal. Apply this decision table in order (first match wins):

| Condition | Decision |
|---|---|
Each panelist returns a `p_test_outdated` score in [0, 1] — the probability that the test is the wrong artifact (not the app). High → heal candidate; low → app bug candidate. The score is verdict-independent, so the same threshold has the same meaning across rows.

| Condition | Decision |
|---|---|
| Functional `app-bug` OR Technical `app-bug` | **BLOCK** — a non-skeptic lens flagged a real regression. Print "⚠ probable app bug", do not patch. |
| Functional `heal` AND Technical `heal` AND both `p_test_outdated` > 0.7 | **APPLY** the Technical panelist's proposed diff. Note any Dev-Advocate dissent in the rationale but do not let it veto. |
| Functional `heal` AND Technical `heal` (one or both `p_test_outdated` ≤ 0.7) | **DEFER** — directional consensus but not strong enough to auto-apply. |
| Functional and Technical disagree with each other | **DEFER** — the two primary lenses split; user must arbitrate. |
| All three `p_test_outdated` < 0.4 | **BLOCK** — panel has no conviction the test is outdated; treat as probable app bug. |
| Anything else (including Dev-Advocate-only `app-bug` with weak Functional/Technical heal) | **DEFER** — surface the three verdicts and ask the user to choose. |

Strict editing boundary: only `tests/**` may be modified. Never touch `server.js`, `public/**`, `package.json`, or `playwright.config.js` outside timeout values.

## Step 5 — Report

Print a **Concertation Report** to the user:

```
# Concertation — <test title>

| Panelist       | P(test outdated) | Verdict   | Reasoning (1 line) |
|----------------|-----------------:|-----------|--------------------|
| Functional     |             0.xx | <v>       | …                  |
| Technical      |             0.xx | <v>       | …                  |
| Dev-Advocate   |             0.xx | <v>       | …                  |

**Arbiter decision:** APPLY | BLOCK | DEFER
**Rationale:** <1-2 sentences weaving the three perspectives>
```

If **APPLY**: show the diff, write it, then re-run `npx playwright test <spec>` and report pass/fail. If the re-run fails, revert the change and downgrade to **DEFER**.

If **BLOCK** or **DEFER**: write nothing to disk.
