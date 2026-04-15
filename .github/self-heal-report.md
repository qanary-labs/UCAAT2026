# Self-Healing Report

**Commit:** 414bb31b8efb349b9f586d8f64691d5dbfa136fc
**Date:** 2026-04-15T10:37:49Z
**Status:** Diagnostic only

## Summary

The E2E test failed because the sign-in button was renamed from "Sign in" to "blabla", but a deeper inspection of the app diff reveals a broken server route (`/login` → `/logiiiiin`) that the HTML form still targets. Fixing the test selector alone cannot restore a passing suite — the app itself is inconsistent.

## P(test outdated) Assessment

| Test name | P(test outdated) | Verdict | Reasoning |
|-----------|----------------:|---------|-----------|
| I sign in, access the admin page, then sign out | 0.20 | Probable app bug | The immediate timeout is caused by a button-text rename ("Sign in" → "blabla"), which alone would be a fixable selector drift. However, the same commit also changed the server login route from `POST /login` to `POST /logiiiiin` while the HTML form action still points to `/login`. Even with a corrected button selector the form submission would hit a non-existent route, the server would return 404, and the test would then fail at `toHaveURL(/\/admin$/)`. The failure is rooted in an app-level inconsistency, not in an outdated test. |

## Changes

### tests/auth.spec.js

| Test name | Status | Root cause | Fix applied |
|-----------|--------|------------|-------------|
| I sign in, access the admin page, then sign out | Not modified | Two concurrent app-side changes: (1) button label renamed "Sign in" → "blabla" causing `getByRole('button', { name: /sign in/i })` to time out; (2) server route renamed `POST /login` → `POST /logiiiiin` while `public/index.html` form action is still `action="/login"`, breaking the entire auth flow regardless of selector fix | N/A |

**Diff:**
```
No changes — diagnostic only
```

## Verification
- Tests healed: 0
- Tests flagged (diagnostic only): 0
- Tests skipped (fixme): 0
- Playwright exit code: N/A (no healing attempted)

## Notes

> **Warning: Probable application bug detected — manual investigation required**

Commit `414bb31` ("Change sign in button for blabla") introduced two changes that together break the login flow end-to-end:

1. **`public/index.html` line 175** — button text changed from `Sign in` to `blabla`.  
   Isolated, this would be a straightforward selector fix (p_test_outdated ≈ 0.9).

2. **`server.js`** — `app.post("/login", ...)` renamed to `app.post("/logiiiiin", ...)`.  
   The HTML form (`action="/login"`) was **not** updated to match. When a browser submits the login form it will POST to `/login`, which no longer has a handler; the server returns a non-auth response and the redirect to `/admin` never occurs.

**Recommended action:** A developer must decide which side is wrong —  
- If the route rename was intentional, update `public/index.html` to `action="/logiiiiin"` and rename the button back (or update the test to `/blabla/i`).  
- If the route rename was accidental, revert `server.js` to `app.post("/login", ...)` and decide separately whether the button rename is intentional.  

The healer will rerun automatically on the corrected commit.
