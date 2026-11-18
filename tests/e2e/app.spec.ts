import { expect, test, type Page } from "@playwright/test";

// Console errors and page errors, minus map tiles that could not be
// fetched (the tests do not depend on the network being up)
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/tile\.openstreetmap\.org/.test(text) || /Failed to load resource.*(tile|openstreetmap)/i.test(text)) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test.describe("every page", () => {
  for (const path of ["/", "/map", "/cafe/1", "/cafe/11", "/saved", "/owner"]) {
    test(`${path} loads without console errors (CSP, hydration)`, async ({ page }) => {
      const errors = watchErrors(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'");
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }

  test("old addresses redirect to Today", async ({ page }) => {
    for (const path of ["/findit", "/findit.html", "/index.html"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/$/);
    }
  });
});

test.describe("Today board", () => {
  test("filters, sips and keeps the sip after a reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Today in Butuan City" })).toBeVisible();
    await page.getByRole("button", { name: "Hiring", exact: true }).click();
    await expect(page.getByRole("article", { name: /^Hiring: Brewer/ })).toBeVisible();
    await page.getByRole("button", { name: /Sip, 38 sips/ }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: /Sip, 39 sips/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("reads data the old app saved (place, sips, theme)", async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("findit.place", JSON.stringify("San Francisco"));
      localStorage.setItem("findit.sips", JSON.stringify(["p12"]));
      localStorage.setItem("findit.theme", "dark");
    });
    await page.goto("/");
    // The saved place is adopted (no cookie yet), then the server renders it
    await expect(page.getByRole("heading", { name: "Today in San Francisco" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sip, 1 sips/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("applies the saved dark theme before the page is hydrated", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("findit.theme", "dark"));
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForSelector("html[data-theme]", { state: "attached" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("owner", () => {
  test("signs in, publishes a new item and sees it on the board", async ({ page }) => {
    await page.goto("/owner");
    await page.getByLabel("Business email").fill("owner@paramount.ph");
    await page.getByLabel("Password").fill("demo");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("link", { name: /Post an update/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Post an update" })).toBeFocused();
    await page.getByLabel(/Item name/).fill("Ube cheesecake");
    await page.getByLabel(/Caption/).fill("Fresh today, while it lasts.");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("On the board. People with alerts on were notified.")).toBeVisible();
    await expect(page.getByRole("button", { name: "More options for Ube cheesecake" })).toBeFocused();
    await page.getByRole("button", { name: "View" }).click();
    await expect(page.getByRole("article").first()).toHaveAccessibleName("New: Ube cheesecake, Paramount Coffee");
  });

  test("the ... menu works with the keyboard and returns focus", async ({ page }) => {
    await page.goto("/owner");
    await page.getByLabel("Business email").fill("owner@paramount.ph");
    await page.getByLabel("Password").fill("demo");
    await page.getByRole("button", { name: "Sign in" }).click();
    const button = page.getByRole("button", { name: "More options for Latte Art Workshop" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Pin to top" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(button).toBeFocused();
  });
});

test.describe("overlays in a real browser (inert page)", () => {
  test("the place picker returns focus to the place button", async ({ page }) => {
    await page.goto("/");
    const pill = page.getByRole("button", { name: /^Place: / });
    await pill.click();
    await expect(page.getByRole("dialog", { name: "Choose a place" })).toBeVisible();
    await expect(page.locator("[data-app-root]")).toHaveAttribute("inert", "");
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-app-root]")).not.toHaveAttribute("inert", "");
    await expect(pill).toBeFocused();
  });

  test("a menu that opens a dialog returns focus to the ... button", async ({ page }) => {
    await page.goto("/owner");
    await page.getByLabel("Business email").fill("owner@paramount.ph");
    await page.getByLabel("Password").fill("demo");
    await page.getByRole("button", { name: "Sign in" }).click();
    const button = page.getByRole("button", { name: "More options for highlight 2" });
    await button.click();
    await page.getByRole("menuitem", { name: "Edit label" }).click();
    const field = page.getByRole("dialog", { name: "Edit label" }).getByLabel("Label (optional)");
    await expect(field).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
  });
});

test.describe("map", () => {
  test("puts every café on the map and opens Directions' café", async ({ page }) => {
    await page.goto("/map?cafe=11");
    const map = page.getByRole("region", { name: /Map of cafés/ });
    await expect(map.locator(".leaflet-marker-icon")).toHaveCount(11);
    await expect(map.locator(".leaflet-popup-content")).toContainText("Kold Coffee");
    await map.locator(".leaflet-popup-content").getByRole("link", { name: "View café" }).click();
    await expect(page).toHaveURL(/\/cafe\/11$/);
    await expect(page.getByRole("heading", { level: 1, name: "Kold Coffee" })).toBeVisible();
  });
});

test.describe("layout", () => {
  test("no page scrolls sideways", async ({ page }) => {
    for (const path of ["/", "/map", "/cafe/1", "/saved", "/owner"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
