import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const LISTING = { slug: "banani-garden-duplex", title: "Banani Garden Duplex" };
export const SECOND_LISTING = {
  slug: "gulshan-lakefront-penthouse",
  title: "Gulshan Lakefront Penthouse",
};

/** Fails the test on uncaught page errors (hydration failures, runtime exceptions). */
export function failOnPageErrors(page: Page): void {
  page.on("pageerror", (error) => {
    throw new Error(`Uncaught page error: ${error.message}`);
  });
}

/** Runs axe against WCAG 2.2 A/AA rules and fails on serious or critical violations. */
export async function expectNoSeriousA11yViolations(page: Page) {
  // Entrance animations fade content in; measure contrast on the settled page, not mid-fade.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // Third-party map canvases are tested for their own controls; their tiles are decorative.
    .exclude(".maplibregl-canvas")
    .analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes
          .map((node) => node.target.join(" "))
          .slice(0, 3)
          .join(", ")})`,
    );
  expect(serious, serious.join("\n")).toEqual([]);
}

export function isoDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}
