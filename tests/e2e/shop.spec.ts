import { expect, test, type Page } from "@playwright/test";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1024) < 768;

async function openProduct(page: Page, name: RegExp) {
  const garment = page.getByRole("link", { name });
  if (!isMobile(page)) await garment.hover();
  await garment.click();
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (err) => {
    throw err;
  });
});

test("home shows the rail with every garment", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Official Clothing/);
  await expect(page.getByRole("list", { name: "Garments on the rail" }).getByRole("link")).toHaveCount(9);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("select a product, choose a size and add it to the bag", async ({ page }) => {
  await page.goto("/");
  await openProduct(page, /Plain Heavy Tee/);
  await expect(page).toHaveURL(/\/products\/plain-heavy-tee$/);
  const panel = page.getByRole("article");
  await expect(panel.getByRole("heading", { name: "Plain Heavy Tee" })).toBeVisible();

  const cta = panel.getByRole("button", { name: "Select a size" });
  await expect(cta).toBeDisabled();

  await panel.getByRole("button", { name: "back" }).click();
  await expect(panel.getByRole("img", { name: /back view/ })).toBeVisible();

  await panel.locator("label", { hasText: "L" }).first().click();
  await panel.getByRole("button", { name: "Add to bag" }).click();

  const bag = page.getByRole("dialog", { name: /Your bag \(1\)/ });
  await expect(bag).toBeVisible();
  await expect(bag.getByText("Size L")).toBeVisible();
  await bag.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("dialog", { name: /Your bag \(2\)/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Open bag, 2 items/ })).toBeVisible();

  // Browser back closes the panel and returns to the rail.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("sold-out sizes cannot be selected", async ({ page }) => {
  await page.goto("/products/current-split-shirt");
  const panel = page.getByRole("article");
  await expect(panel.getByRole("radio", { name: "M, sold out" })).toBeDisabled();
  await panel.getByRole("button", { name: "See availability" }).click();
  await expect(page.getByRole("dialog", { name: "Size availability" }).getByText("Sold out")).toBeVisible();
});

test("search filters products and opens the result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search products" }).click();
  const dialog = page.getByRole("dialog", { name: "Search" });
  await dialog.getByRole("searchbox").fill("zip hoodie");
  await expect(dialog.getByText("3 results")).toBeVisible();
  await dialog.getByRole("button", { name: "Tops" }).click();
  await expect(dialog.getByText("0 results")).toBeVisible();
  await dialog.getByRole("button", { name: "Clear search" }).click();
  await dialog.getByRole("link", { name: /Shadow Zip Hoodie/ }).click();
  await expect(page).toHaveURL(/\/products\/shadow-zip-hoodie$/);
});

test("checkout validates input and places an order", async ({ page }) => {
  await page.goto("/products/plain-heavy-tee");
  await page.getByRole("article").locator("label", { hasText: "M" }).first().click();
  await page.getByRole("article").getByRole("button", { name: "Add to bag" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.getByText("Enter your email address.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();

  await page.getByRole("textbox", { name: "Email" }).fill("e2e.buyer@example.test");
  await page.getByRole("textbox", { name: "Full name" }).fill("E2E Buyer");
  await page.getByRole("textbox", { name: "Address", exact: true }).fill("1 Test Street");
  await page.getByRole("textbox", { name: "City" }).fill("Dublin");
  await page.getByRole("textbox", { name: "Postal code" }).fill("D02 X285");
  await page.getByRole("combobox", { name: "Country" }).selectOption("Ireland");
  await page.getByRole("button", { name: /Place order/ }).click();

  // No payment provider in tests: the demo payment page simulates the result.
  await expect(page).toHaveURL(/\/checkout\/pay\/RR-/);
  await expect(page.getByText(/Demo mode/)).toBeVisible();
  await page.getByRole("button", { name: "Simulate successful payment" }).click();
  await expect(page).toHaveURL(/\/checkout\/success\?order=RR-/);
  const orderId = (await page.getByText(/^RR-[A-Z0-9]{8}$/).filter({ visible: true }).textContent())!.trim();
  await expect(page.getByRole("button", { name: "Open bag, empty" })).toBeVisible();

  await page.getByRole("link", { name: "Track this order" }).click();
  await expect(page.getByRole("textbox", { name: "Order number" })).toHaveValue(orderId);
  await page.getByRole("textbox", { name: "Email" }).fill("e2e.buyer@example.test");
  await page.getByRole("button", { name: "Find my order" }).click();
  await expect(page.getByText(/Paid/)).toBeVisible();
});

test("contact form validates and sends", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Contact us" }).click();
  const dialog = page.getByRole("dialog", { name: "Talk to us" });
  await dialog.getByRole("button", { name: "Send message" }).click();
  await expect(dialog.getByText("Enter your name.")).toBeVisible();
  await dialog.getByLabel("Name").fill("E2E Tester");
  await dialog.getByLabel("Email").fill("e2e@example.test");
  await dialog.getByLabel("Message").fill("Is the canvas jacket restocking in 2XL?");
  await dialog.getByRole("button", { name: "Send message" }).click();
  await expect(dialog.getByText("Message sent")).toBeVisible();
});

test("unknown routes show the 404 page", async ({ page }) => {
  const res = await page.goto("/definitely-not-here");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Not on the rail" })).toBeVisible();
});
