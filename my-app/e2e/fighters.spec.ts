import { test, expect } from "@playwright/test";

const SUPER_ADMIN_EMAIL = "admin@sfa-tournament.local";
const SUPER_ADMIN_PASSWORD = "YUneBllTqugrP_sVPandVPT2";

test("a super admin can add a fighter and toggle its availability", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(SUPER_ADMIN_EMAIL);
  await page.getByLabel("Password").fill(SUPER_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/admin/fighters");
  const fighterName = `TestFighter${Date.now()}`;

  await page.getByRole("button", { name: "Add fighter" }).click();
  await page.getByLabel("Name").fill(fighterName);
  await page.getByRole("button", { name: "Add fighter" }).last().click();

  const row = page.getByRole("row", { name: new RegExp(fighterName) });
  await expect(row).toBeVisible();

  const toggle = row.getByRole("switch");
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
});
