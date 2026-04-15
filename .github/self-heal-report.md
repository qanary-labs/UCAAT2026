# Self-Healing Report

**Commit:** e393e559503af4a37d9c6a9381a5b58f0a299f09
**Date:** 2026-04-15T15:20:00Z
**Status:** Fixed

## Summary

The commit renamed the login button text from "Sign in" to "Connect" in `public/index.html`. The Playwright test still searched for a button matching `/sign in/i`, causing a timeout. The selector was updated to match the new label.

## P(test outdated) Assessment

| Test name | P(test outdated) | Verdict | Reasoning |
|-----------|----------------:|---------|-----------|
| I sign in, access the admin page, then sign out | 0.95 | Self-heal | App diff is a pure cosmetic text rename (`Sign in` → `Connect`). The button element still exists with the same role and position; only its visible label changed. Commit message ("Change sign in button for connect") confirms intentional rename. No logic, route, or middleware changes. Timeout error is exactly what happens when a role+name selector can no longer match a renamed element. |

## Changes

### tests/auth.spec.js

| Test name | Status | Root cause | Fix applied |
|-----------|--------|------------|-------------|
| I sign in, access the admin page, then sign out | Fixed | `public/index.html` button text changed from `Sign in` to `Connect`; `getByRole('button', { name: /sign in/i })` timed out because no matching element was found | Updated selector regex from `/sign in/i` to `/connect/i` on line 10 |

**Diff:**
```diff
--- a/tests/auth.spec.js
+++ b/tests/auth.spec.js
@@ -7,7 +7,7 @@ test.describe("Auth flow", () => {
     await page.getByLabel("Username").fill("admin");
     await page.getByLabel("Password").fill("password");
-    await page.getByRole("button", { name: /sign in/i }).click();
+    await page.getByRole("button", { name: /connect/i }).click();
 
     await expect(page).toHaveURL(/\/admin$/);
```

## Verification
- Tests healed: 1
- Tests flagged (diagnostic only): 0
- Tests skipped (fixme): 0
- Playwright exit code: 0

## Notes

The "Sign out" button in `public/admin.html` was not modified in this commit and remains "Sign out" — the corresponding `getByRole('button', { name: /sign out/i })` selector on line 16 of the test file is still valid and does not require changes.
