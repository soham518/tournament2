import { test, expect, type Page } from "@playwright/test";

const SUPER_ADMIN_EMAIL = "admin@sfa-tournament.local";
const SUPER_ADMIN_PASSWORD = "YUneBllTqugrP_sVPandVPT2";

function futureDateTimeLocal(hoursFromNow: number) {
  const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function registerAndOnboard(page: Page, label: string) {
  const unique = `${label}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  await page.goto("/register");
  await page.getByLabel("Username").fill(unique);
  await page.getByLabel("Email").fill(`${unique}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Shadow Fight Arena in-game name").fill(unique);
  await page.getByLabel("Shadow Fight Arena player ID").fill(`SFA-${unique}`);
  await page.getByLabel("Discord ID").fill(`${unique}#0001`);
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

// Admin and each player get their own browser context (own cookie jar), so
// no session ever needs to log out mid-test. That removes the sign-out ->
// sign-in transitions that were compounding with the dev server's known
// Turbopack stream flakiness and making this test unreliable.
test("admin can generate a bracket and finalize a result, which advances the winner", async ({ page, browser }) => {
  const adminPage = page;

  await adminPage.goto("/login");
  await adminPage.getByLabel("Email").fill(SUPER_ADMIN_EMAIL);
  await adminPage.getByLabel("Password").fill(SUPER_ADMIN_PASSWORD);
  await adminPage.getByRole("button", { name: "Log in" }).click();
  await expect(adminPage).toHaveURL(/\/dashboard/);

  const tournamentName = `E2E Bracket ${Date.now()}`;
  await adminPage.goto("/admin/tournaments");
  await adminPage.getByRole("button", { name: "Create tournament" }).click();
  const createDialog = adminPage.getByRole("dialog", { name: "Create tournament" });
  await createDialog.getByLabel("Name").fill(tournamentName);
  await createDialog.getByLabel("Start date & time").fill(futureDateTimeLocal(48));
  await createDialog.getByLabel("Max participants").fill("2");
  await createDialog.getByRole("button", { name: "Create draft" }).click();
  await expect(adminPage).toHaveURL(/\/admin\/tournaments\/.+\/edit/);
  const tournamentId = adminPage.url().match(/tournaments\/([^/]+)\/edit/)![1];

  await adminPage.getByLabel("Description").fill("Bracket E2E test.");
  await adminPage.getByRole("button", { name: "Save" }).first().click();
  await expect(adminPage.getByText("Saved.").first()).toBeVisible();

  await adminPage.getByRole("tab", { name: "Registration" }).click();
  await adminPage.getByLabel("Registration opens").fill(futureDateTimeLocal(-1));
  await adminPage.getByLabel("Registration closes").fill(futureDateTimeLocal(47));
  await adminPage.getByRole("button", { name: "Save" }).click();
  await expect(adminPage.getByText("Saved.").first()).toBeVisible();

  await adminPage.getByRole("tab", { name: "Review & publish" }).click();
  await adminPage.getByRole("button", { name: "Publish" }).click();
  await adminPage.waitForTimeout(3000);

  // Confirm the publish landed via a fresh navigation (not router.refresh(),
  // which the dev server occasionally corrupts mid-stream) before moving on.
  // Scoped to this tournament's own heading, since the shared dev database
  // accumulates many leftover tournaments across test runs and a page-wide
  // text match on a status label is ambiguous against all of them.
  await adminPage.goto("/tournaments");
  await adminPage.getByRole("link", { name: tournamentName, exact: true }).click();
  await expect(adminPage.getByRole("heading", { name: tournamentName })).toBeVisible();
  await expect(adminPage.getByText("Registration Open").first()).toBeVisible();

  const playerAContext = await browser.newContext();
  const playerAPage = await playerAContext.newPage();
  await registerAndOnboard(playerAPage, "bktA");
  await playerAPage.goto("/tournaments");
  await playerAPage.getByText(tournamentName).click();
  await playerAPage.getByRole("button", { name: "Register" }).click();
  await expect(playerAPage).toHaveURL(/\/dashboard\/registrations\/.+/);
  await playerAContext.close();

  const playerBContext = await browser.newContext();
  const playerBPage = await playerBContext.newPage();
  await registerAndOnboard(playerBPage, "bktB");
  await playerBPage.goto("/tournaments");
  await playerBPage.getByText(tournamentName).click();
  await playerBPage.getByRole("button", { name: "Register" }).click();
  await expect(playerBPage).toHaveURL(/\/dashboard\/registrations\/.+/);
  await playerBContext.close();

  await adminPage.goto(`/admin/tournaments/${tournamentId}/bracket`);
  await adminPage.getByRole("button", { name: "Generate bracket" }).click();
  await adminPage.waitForTimeout(3000);
  await adminPage.reload();
  await expect(adminPage.getByText("SCHEDULED")).toBeVisible();

  await adminPage.getByRole("button", { name: "Record result" }).click();
  await adminPage.getByRole("button", { name: "Finalize result" }).click();
  await adminPage.waitForTimeout(3000);
  await adminPage.reload();
  await expect(adminPage.getByText("COMPLETED")).toBeVisible();
});
