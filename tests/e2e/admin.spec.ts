import path from "node:path";
import { expect, test } from "@playwright/test";
import { AUTH_STATE } from "./environment";
import { expectNoSeriousA11yViolations, failOnPageErrors } from "./helpers";

test.beforeEach(({ page }) => failOnPageErrors(page));

test("anonymous visitors are sent to sign in", async ({ page }) => {
  await page.goto("/admin/properties");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fadmin/);
});

test.describe("clients", () => {
  test.use({ storageState: AUTH_STATE.client });

  test("cannot open the administration area", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "No access to administration" })).toBeVisible();
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "No access to administration" })).toBeVisible();
  });
});

test.describe("administrators", () => {
  test.use({ storageState: AUTH_STATE.admin });

  test("see the dashboard and every management area", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    for (const [href, heading] of [
      ["/admin/properties", "Listings"],
      ["/admin/inquiries", "Enquiries"],
      ["/admin/agents", "Advisors"],
      ["/admin/locations", "Locations"],
      ["/admin/insights", "Insights"],
      ["/admin/users", "Users"],
      ["/admin/settings", "Site settings"],
      ["/admin/audit-log", "Audit log"],
    ] as const) {
      await page.goto(href);
      await expect(page.getByRole("heading", { level: 1, name: heading }), href).toBeVisible();
    }
    await expectNoSeriousA11yViolations(page);
  });

  test("create, publish and delete a listing with an uploaded photograph", async ({ page }) => {
    const title = `E2E Lake Terrace ${Date.now()}`;
    await page.goto("/admin/properties/new");

    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Add a title")).toBeVisible();

    await page.getByLabel("Title", { exact: true }).fill(title);
    await page
      .getByLabel("Description", { exact: true })
      .fill(
        "A bright apartment with a deep terrace facing the lake, created by the end-to-end suite.",
      );
    await page.getByLabel("Price", { exact: true }).fill("45000000");
    await page.locator("select#neighbourhood").selectOption("gulshan");

    const upload = page.locator('input[type="file"]').first();
    await upload.setInputFiles(
      path.join(process.cwd(), "public/images/residences/garden-villa/w1280.webp"),
    );
    await expect(page.getByRole("textbox", { name: "Image 1 alternative text" })).toBeVisible({
      timeout: 20_000,
    });
    await page
      .getByRole("textbox", { name: "Image 1 alternative text" })
      .fill("White villa beside a pool");

    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page).toHaveURL(/\/admin\/properties\/[a-f0-9]{24}$/, { timeout: 20_000 });
    await expect(page.getByRole("status").filter({ hasText: "All changes saved" })).toBeVisible();

    const publicLink = page.getByRole("status").getByRole("link", { name: "View" });
    const href = await publicLink.getAttribute("href");
    expect(href).toMatch(/^\/properties\/e2e-lake-terrace-/);
    const publicPage = await page.request.get(href!);
    expect(publicPage.status()).toBe(200);
    expect(await publicPage.text()).toContain(title);

    await page.goto(`/admin/properties?q=${encodeURIComponent(title)}`);
    await page.getByRole("button", { name: `Actions for ${title}` }).click();
    await page.getByRole("menuitem", { name: /Delete permanently/ }).click();
    await page.getByRole("button", { name: "Delete listing" }).click();
    await expect(page.getByText("No listings match these filters.")).toBeVisible();
    expect((await page.request.get(href!)).status()).toBe(404);
  });

  test("see client enquiries and update their status", async ({ page }) => {
    await page.goto("/admin/inquiries");
    const firstEnquiry = page.locator("main tbody a").first();
    await expect(firstEnquiry).toBeVisible();
    await firstEnquiry.click();
    await expect(page).toHaveURL(/\/admin\/inquiries\/[a-f0-9]{24}$/);
    // The list page stays mounted (hidden) after client navigation, so target the detail control.
    await page.locator("#inquiry-status").selectOption("contacted");
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(page.getByText(/status → Contacted/)).toBeVisible();
  });
});
