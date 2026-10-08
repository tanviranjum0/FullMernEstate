import { expect, test } from "@playwright/test";
import { AUTH_STATE } from "./environment";
import { failOnPageErrors, isoDate, LISTING } from "./helpers";

test.beforeEach(({ page }) => failOnPageErrors(page));

test.describe("visitors", () => {
  test("are asked to sign in before saving a home, then returned", async ({ page }) => {
    await page.goto(`/properties/${LISTING.slug}`);
    await page
      .getByRole("button", { name: `Save ${LISTING.title}` })
      .first()
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/sign-in\\?next=${encodeURIComponent(`/properties/${LISTING.slug}`)}`),
    );
  });

  test("can create an account and sign out", async ({ page }) => {
    const email = `e2e-signup-${Date.now()}@example.test`;
    await page.goto("/sign-up?next=/account");
    await page.getByLabel("Full name").fill("E2E New Client");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("e2e-new-client-password");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/account$/);

    await page.getByRole("button", { name: /Account menu for E2E New Client/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await page.goto("/account");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("are told when sign-in details are wrong", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("nobody@example.test");
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("signed-in clients", () => {
  test.use({ storageState: AUTH_STATE.client });

  test("save a home to their shortlist and remove it", async ({ page }) => {
    await page.goto(`/properties/${LISTING.slug}`);
    await page
      .getByRole("button", { name: `Save ${LISTING.title}` })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: `Save ${LISTING.title}`, pressed: true }).first(),
    ).toBeVisible();
    // The pressed state is optimistic; the toast confirms the server saved it.
    await expect(page.getByText("Saved to your shortlist")).toBeVisible();

    await page.goto("/account/saved");
    await expect(page.getByRole("heading", { level: 1, name: "Saved homes" })).toBeVisible();
    await expect(page.getByText(LISTING.title).first()).toBeVisible();

    await page
      .getByRole("button", { name: `Save ${LISTING.title}`, pressed: true })
      .first()
      .click();
    await expect(page.getByText("Removed from your shortlist")).toBeVisible();
    await page.reload();
    // Role queries skip the hidden container React streams content into before swapping it in.
    await expect(page.getByRole("heading", { name: "Your shortlist is empty" })).toBeVisible();
  });

  test("save a search and see it in their account", async ({ page }) => {
    await page.goto("/properties?listing=rent&city=dhaka");
    await page.getByRole("button", { name: "Save search" }).first().click();
    await page.getByLabel("Name").fill("Dhaka rentals");
    await page.getByRole("dialog").getByRole("button", { name: "Save search" }).click();

    await page.goto("/account/searches");
    await expect(page.getByRole("listitem").filter({ hasText: "Dhaka rentals" })).toBeVisible();
  });

  test("request a viewing and receive a reference", async ({ page }) => {
    await page.goto(`/properties/${LISTING.slug}`);
    const form = page
      .locator("form")
      .filter({ has: page.getByRole("radiogroup", { name: "Enquiry type" }) })
      .first();
    await form.getByRole("radio", { name: "Viewing" }).click();
    await expect(form.getByLabel("Full name")).toHaveValue("E2E Client");
    await form.getByLabel("Preferred date").fill(isoDate(7));
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Request viewing" }).click();
    await expect(page.getByText("Viewing request received")).toBeVisible();
    await expect(page.getByText(/reference is/i)).toContainText(/[A-F0-9]{6}/);

    await page.goto("/account/enquiries");
    await expect(page.getByText(LISTING.title).first()).toBeVisible();
  });
});
