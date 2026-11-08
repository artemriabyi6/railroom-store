import { expect, test, type Page } from "@playwright/test";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1024) < 768;

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (err) => {
    throw err;
  });
});

test("homepage sections render below the hero rail", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Why shop with us" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New in" })).toBeVisible();
  await expect(page.getByRole("list", { name: "New arrivals" }).getByRole("link")).not.toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Cut through/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shop by category" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("new-in rail opens a product in the hero panel", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("list", { name: "New arrivals" }).getByRole("link", { name: /Forest Track Top/ });
  await link.scrollIntoViewIfNeeded();
  if (!isMobile(page)) await link.hover();
  await link.click();
  await expect(page).toHaveURL(/\/products\/forest-track-top$/);
  await expect(page.getByRole("article").getByRole("heading", { name: "Forest Track Top" })).toBeVisible();
});

test("featured drop switches colourway", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: /Cut through/ });
  await section.scrollIntoViewIfNeeded();
  await section.getByRole("radio", { name: "Ink Check / Orange" }).check();
  await expect(section.getByText("Colourway: Ink Check / Orange")).toBeVisible();
  await section.getByRole("button", { name: /Shop the shirt/ }).click();
  await expect(page).toHaveURL(/\/products\/ink-split-shirt$/);
});

test("category tile leads to a filtered catalogue", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /^Bottoms \d+ pieces/ }).click();
  await expect(page).toHaveURL(/\/shop\?category=bottoms$/);
  await expect(page.getByRole("heading", { level: 1, name: "Bottoms" })).toBeVisible();
});

test("catalogue filters, sorts, paginates and returns from a product", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByRole("heading", { level: 1, name: "Shop all" })).toBeVisible();
  const initialCount = parseInt(await page.getByText(/^\d+ pieces$/).innerText(), 10);
  expect(initialCount).toBeGreaterThanOrEqual(24);
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(12);
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(cards).toHaveCount(24);

  await page.getByRole("group", { name: "Category" }).getByRole("button", { name: /^Shirts/ }).click();
  await expect(page).toHaveURL(/category=shirts/);
  await page.getByRole("group", { name: "Size in stock" }).getByRole("button", { name: "M", exact: true }).click();
  await expect(page).toHaveURL(/size=M/);
  await expect(page.getByText("Current Split Shirt")).toHaveCount(0);

  await page.getByLabel("Sort by").selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);

  await page.getByRole("searchbox", { name: "Search the catalogue" }).fill("nothing-matches-this");
  await expect(page.getByText("Nothing on the rail matches")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).last().click();
  // The admin e2e test may add/remove products concurrently; compare with the count seen at the start.
  await expect
    .poll(async () => Math.abs(parseInt(await page.getByText(/^\d+ pieces$/).innerText(), 10) - initialCount))
    .toBeLessThanOrEqual(1);

  await page.goto("/shop?category=bottoms");
  await page.getByRole("link", { name: /Night Pleat Trousers/ }).click();
  await expect(page).toHaveURL(/\/products\/night-pleat-trousers$/);
  const panel = page.getByRole("article").first();
  await expect(panel.getByRole("heading", { name: "Night Pleat Trousers" })).toBeVisible();
  await panel.getByRole("button", { name: "Close product" }).click();
  await expect(page).toHaveURL(/\/shop\?category=bottoms$/);
});

test("newsletter validates and subscribes", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "First pick of the next drop" });
  await section.scrollIntoViewIfNeeded();
  await section.getByRole("button", { name: "Join the list" }).click();
  await expect(section.getByText("Enter a valid email address.")).toBeVisible();
  await section.getByLabel("Email address").fill("e2e.news@example.test");
  await section.getByRole("button", { name: "Join the list" }).click();
  await expect(section.getByText(/You're on the list/)).toBeVisible();
});

test("mobile menu navigates to a category", async ({ page }) => {
  test.skip(!isMobile(page), "mobile-only navigation");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await menu.getByRole("link", { name: /Outerwear/ }).click();
  await expect(page).toHaveURL(/\/shop\?category=outerwear$/);
  await expect(menu).toBeHidden();
});
