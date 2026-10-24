import { test, expect } from "@playwright/test";

test("unauthenticated users are redirected away from protected routes", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("a player can register, complete onboarding, and reach the dashboard", async ({ page }) => {
  const unique = Date.now();
  const email = `e2e-${unique}@example.com`;
  const username = `e2e${unique}`;
  const password = "correct-horse-battery-staple";

  await page.goto("/register");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByLabel("Shadow Fight Arena in-game name").fill("ShadowFist");
  await page.getByLabel("Shadow Fight Arena player ID").fill(`SFA-${unique}`);
  await page.getByLabel("Discord ID").fill("shadowfist#0001");
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Playing as ShadowFist/)).toBeVisible();
});

test("a registered player can log out and log back in", async ({ page }) => {
  const unique = Date.now() + 1;
  const email = `e2e-${unique}@example.com`;
  const username = `e2e${unique}`;
  const password = "correct-horse-battery-staple";

  await page.goto("/register");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/dashboard|\/onboarding/);
});
