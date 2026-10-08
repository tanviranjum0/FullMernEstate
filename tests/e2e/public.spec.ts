import { expect, test } from "@playwright/test";
import {
  expectNoSeriousA11yViolations,
  failOnPageErrors,
  LISTING,
  SECOND_LISTING,
} from "./helpers";

test.beforeEach(({ page }) => failOnPageErrors(page));

test("homepage presents the brand, search and featured residences", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("search", { name: "Find a residence" })).toBeVisible();
  await expect(page.locator('main a[href^="/properties/"]').first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeAttached();
  await expectNoSeriousA11yViolations(page);
});

test("search filters live in the URL and narrow the results", async ({ page }) => {
  await page.goto("/properties");
  // Results stream in behind a Suspense boundary.
  await expect(page.locator("main article").first()).toBeVisible();
  const allCount = await page.locator("main article").count();
  expect(allCount).toBeGreaterThan(1);

  await page.goto("/properties?listing=rent&city=dhaka");
  const rentals = page.locator("main article");
  await expect(rentals.first()).toBeVisible();
  for (const text of await rentals.allInnerTexts()) expect(text.toLowerCase()).toContain("dhaka");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/properties\?listing=rent$/,
  );

  await page.getByRole("link", { name: /Remove filter: .*Dhaka/i }).click();
  await expect(page).toHaveURL(/\/properties\?listing=rent$/);
  await expectNoSeriousA11yViolations(page);
});

test("property page shows details, gallery, calculator and structured data", async ({ page }) => {
  const response = await page.goto(`/properties/${LISTING.slug}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: LISTING.title })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    new RegExp(`/properties/${LISTING.slug}$`),
  );
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /.+/);
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join("")).toContain('"BreadcrumbList"');

  await page.getByRole("button", { name: /^Open photo 1 of/ }).click();
  const gallery = page.getByRole("dialog");
  await expect(gallery).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(gallery).toBeHidden();

  const payment = page.locator("p[aria-live=polite]").first();
  const before = await payment.textContent();
  await page.getByLabel("Deposit").fill("50");
  await expect(payment).not.toHaveText(before ?? "");
  await expectNoSeriousA11yViolations(page);
});

test("unknown listings return a real 404", async ({ page }) => {
  const response = await page.goto("/properties/this-listing-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("unknown guides, advisors and articles return a real 404", async ({ request }) => {
  for (const path of [
    "/locations/atlantis",
    "/locations/dhaka/atlantis",
    "/agents/nobody-here",
    "/insights/no-such-article",
    "/insights/category/no-such-category",
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("residences can be compared side by side", async ({ page }) => {
  await page.goto("/compare");
  await page.evaluate(() => localStorage.clear());
  for (const listing of [LISTING, SECOND_LISTING]) {
    await page.goto(`/properties/${listing.slug}`);
    await page.getByRole("button", { name: `Add ${listing.title} to comparison` }).click();
  }
  const tray = page.getByRole("region", { name: "Comparison" });
  await expect(tray).toContainText("2");
  await tray.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/compare/);
  await expect(page.getByText(LISTING.title).first()).toBeVisible();
  await expect(page.getByText(SECOND_LISTING.title).first()).toBeVisible();
});

test("location guides, advisors and insights are reachable", async ({ page }) => {
  for (const path of [
    "/locations",
    "/locations/dhaka",
    "/locations/dhaka/gulshan",
    "/agents",
    "/insights",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("crawlers get robots rules and a sitemap of public pages only", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Sitemap:");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`/properties/${LISTING.slug}</loc>`);
  expect(sitemap).toContain("/locations/dhaka</loc>");
  expect(sitemap).not.toContain("/admin");
  expect(sitemap).not.toContain("/account");
});

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBeTruthy();
  expect(headers["x-powered-by"]).toBeUndefined();
});
