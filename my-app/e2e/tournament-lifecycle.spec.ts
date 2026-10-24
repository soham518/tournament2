import { test, expect } from "@playwright/test";

const SUPER_ADMIN_EMAIL = "admin@sfa-tournament.local";
const SUPER_ADMIN_PASSWORD = "YUneBllTqugrP_sVPandVPT2";

function futureDateTimeLocal(hoursFromNow: number) {
  const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

test("admin can create, configure, and publish a free tournament; a player can register", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(SUPER_ADMIN_EMAIL);
  await page.getByLabel("Password").fill(SUPER_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const tournamentName = `E2E Knockout ${Date.now()}`;
  await page.goto("/admin/tournaments");
  await page.getByRole("button", { name: "Create tournament" }).click();
  const createDialog = page.getByRole("dialog", { name: "Create tournament" });
  await createDialog.getByLabel("Name").fill(tournamentName);
  await createDialog.getByLabel("Start date & time").fill(futureDateTimeLocal(48));
  await createDialog.getByLabel("Max participants").fill("4");
  await createDialog.getByRole("button", { name: "Create draft" }).click();

  await expect(page).toHaveURL(/\/admin\/tournaments\/.+\/edit/);
  const tournamentId = page.url().match(/tournaments\/([^/]+)\/edit/)?.[1];
  expect(tournamentId).toBeTruthy();

  // Basics: description is required to publish.
  await page.getByLabel("Description").fill("An end-to-end test tournament.");
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Saved.").first()).toBeVisible();

  // Registration: open now, close in the future, so the player can register immediately.
  await page.getByRole("tab", { name: "Registration" }).click();
  await page.getByLabel("Registration opens").fill(futureDateTimeLocal(-1));
  await page.getByLabel("Registration closes").fill(futureDateTimeLocal(47));
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.").first()).toBeVisible();

  // Publish.
  await page.getByRole("tab", { name: "Review & publish" }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  // Publishing moves straight to a derived display status (registration
  // window is open in this test), not a literal "Published" label.
  await expect(page.getByText("Registration Open")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();

  // Register a fresh player and complete onboarding.
  const unique = Date.now();
  const email = `lifecycle-${unique}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Username").fill(`lifecycle${unique}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Shadow Fight Arena in-game name").fill("E2EPlayer");
  await page.getByLabel("Shadow Fight Arena player ID").fill(`SFA-${unique}`);
  await page.getByLabel("Discord ID").fill("e2eplayer#0001");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto(`/tournaments`);
  await page.getByText(tournamentName).click();
  await expect(page).toHaveURL(/\/tournaments\/.+/);
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page).toHaveURL(/\/dashboard\/registrations\/.+/);
  await expect(page.getByText(/Registration: APPROVED/)).toBeVisible();
});
