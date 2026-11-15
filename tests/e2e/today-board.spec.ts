import { expect, test } from "@playwright/test";

test("Today board filters posts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today in Butuan City" })).toBeVisible();
  await page.getByRole("button", { name: "Photos" }).click();
  await expect(page.getByRole("heading", { name: "Inside Paramount Coffee" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sustainability Week" })).not.toBeVisible();
});
