import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations, failOnPageErrors, LISTING } from "./helpers";

test.beforeEach(({ page }) => failOnPageErrors(page));

test("navigation menu works on a phone", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog");
  await expect(menu).toBeVisible();
  await menu
    .getByRole("link", { name: /Properties|Residences|Buy/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/properties/);
});

test("pages fit the screen without horizontal scrolling", async ({ page }) => {
  for (const path of [
    "/",
    "/properties",
    `/properties/${LISTING.slug}`,
    "/locations/dhaka",
    "/insights",
    "/contact",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("property page is accessible on a phone", async ({ page }) => {
  await page.goto(`/properties/${LISTING.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: LISTING.title })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});
