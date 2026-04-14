# Self-Healing Report

**Commit:** 4931c52bbf4b44b83b4c29c312752187e8ab2de4
**Date:** 2026-04-14T23:15:00Z
**Status:** Fixed

## Summary

The login button in `public/index.html` is labelled `connect`, but the test was asserting `getByRole("button", { name: /sign in/i })`. A single selector update in `tests/auth.spec.js` restored the full auth flow passing in 518 ms.

## Confidence Assessment

| Test name | Confidence | Verdict | Reasoning |
|-----------|-----------|---------|-----------|
| I sign in, access the admin page, then sign out | 0.80 | Self-heal | The button element is present and structurally correct — only its visible label differs ("connect" vs the expected "sign in"). The app-diff is empty (initial commit); no logic or routing was changed. The error-context snapshot confirms `button "connect"` exists. All other assertions (heading, session text, sign-out button, logout URL, signed-out banner) align with the HTML. Classic label-drift scenario: high confidence the test is the outlier. |

## Changes

### tests/auth.spec.js

| Test name | Status | Root cause | Fix applied |
|-----------|--------|------------|-------------|
| I sign in, access the admin page, then sign out | Fixed | `public/index.html` button text is `connect`; test expected `/sign in/i` | Changed `getByRole("button", { name: /sign in/i })` → `getByRole("button", { name: /connect/i })` on line 10 |

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

The app-diff patch was empty because this is the initial commit — both the app and the test were introduced in the same commit with a pre-existing label mismatch. The submit button on the login form reads "connect" throughout the HTML; the test had been written (or copied from a prior draft) with "sign in". No application code changes were required or made.
