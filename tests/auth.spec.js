import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {

  test("I sign in, access the admin page, then sign out", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: /protected admin zone/i })).toBeVisible();
    await expect(page.getByText(/signed in as admin/i)).toBeVisible();

    await page.getByRole("button", { name: /sign out/i }).click();

    await expect(page).toHaveURL(/\/\?logged_out=1$/);
    await expect(page.getByText(/you have been signed out/i)).toBeVisible();
  });
});
