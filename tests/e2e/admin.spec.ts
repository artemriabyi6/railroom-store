import { expect, test, type Page } from "@playwright/test";

// The webServer in playwright.config.ts runs with ADMIN_PASSWORD=e2e-admin-password (test-only).
const PASSWORD = "e2e-admin-password";

test.describe.configure({ mode: "serial" });
test.skip(({ viewport }) => (viewport?.width ?? 1024) < 768, "admin flows run on desktop");

async function signIn(page: Page) {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByRole("textbox", { name: "Password" }).fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect password.")).toBeVisible();
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
}

test("admin creates, edits and deletes a product that appears in the store", async ({ page }) => {
  await signIn(page);
  await page.getByRole("link", { name: "+ New product" }).click();

  await page.getByRole("textbox", { name: "Name", exact: true }).fill("E2E Field Shorts");
  await page.getByRole("textbox", { name: "Colour name" }).fill("Sand");
  await page.getByRole("combobox", { name: "Category", exact: true }).selectOption("bottoms");
  await page.getByRole("textbox", { name: "Price (EUR)" }).fill("88.00");
  await page.getByRole("combobox", { name: "Garment type" }).selectOption("shorts");
  await page.getByRole("spinbutton", { name: "M", exact: true }).fill("4");
  await page.getByRole("checkbox", { name: "Cargo pockets" }).check();
  await expect(page.getByRole("textbox", { name: "URL slug" })).toHaveValue("e2e-field-shorts");
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page).toHaveURL(/saved=e2e-field-shorts/);
  await expect(page.getByRole("link", { name: "E2E Field Shorts" })).toBeVisible();

  // The storefront refreshes stale-while-revalidate: reload until the change shows (seconds).
  const eventually = (url: string, check: () => Promise<void>) =>
    expect(async () => {
      await page.goto(url);
      await check();
    }).toPass({ timeout: 20_000, intervals: [500, 1000, 2000] });

  await eventually("/shop?category=bottoms", () => expect(page.getByRole("link", { name: /E2E Field Shorts/ })).toBeVisible({ timeout: 1500 }));
  await eventually("/products/e2e-field-shorts", () =>
    expect(page.getByRole("article").getByRole("heading", { name: "E2E Field Shorts" })).toBeVisible({ timeout: 1500 }),
  );
  await expect(page.getByRole("article").getByText("€88.00")).toBeVisible();

  // Edit the price.
  await page.goto("/admin/products/e2e-field-shorts");
  await page.getByRole("textbox", { name: "Price (EUR)" }).fill("92.50");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/saved=e2e-field-shorts/);
  await eventually("/products/e2e-field-shorts", () => expect(page.getByRole("article").getByText("€92.50")).toBeVisible({ timeout: 1500 }));

  // Delete it.
  await page.goto("/admin/products/e2e-field-shorts");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/admin\/products\?deleted=e2e-field-shorts$/);
  await expect(page.getByText(/Deleted e2e-field-shorts/)).toBeVisible();
  await eventually("/products/e2e-field-shorts", () => expect(page.getByRole("heading", { name: "No longer on the rail" })).toBeVisible({ timeout: 1500 }));
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("admin validates product input", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/products/new");
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
  await expect(page.getByText("Name must be 2–80 characters.")).toBeVisible();
});

test("admin sees orders and cancelling returns stock", async ({ page }) => {
  // Place an order through the storefront.
  await page.goto("/products/plain-heavy-tee");
  await page.getByRole("article").locator("label", { hasText: "XL" }).first().click();
  await page.getByRole("article").getByRole("button", { name: "Add to bag" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("admin.e2e@example.test");
  await page.getByRole("textbox", { name: "Full name" }).fill("Admin E2E");
  await page.getByRole("textbox", { name: "Address", exact: true }).fill("2 Test Street");
  await page.getByRole("textbox", { name: "City" }).fill("Kyiv");
  await page.getByRole("textbox", { name: "Postal code" }).fill("01001");
  await page.getByRole("combobox", { name: "Country" }).selectOption("Ireland");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/checkout\/pay\/(RR-[A-Z0-9]{8})/);
  const orderId = page.url().split("/").pop()!;

  await signIn(page);
  const stockBefore = await page.getByRole("row", { name: /Plain Heavy Tee/ }).first().locator("td").nth(4).innerText();

  await page.goto("/admin/orders");
  const row = page.getByRole("row", { name: new RegExp(orderId) });
  await expect(row).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await row.getByRole("combobox").selectOption("cancelled");
  await expect(page.getByText(`${orderId}: Cancelled`)).toBeVisible();

  await page.goto("/admin/products");
  const stockAfter = await page.getByRole("row", { name: /Plain Heavy Tee/ }).first().locator("td").nth(4).innerText();
  expect(parseInt(stockAfter, 10)).toBe(parseInt(stockBefore, 10) + 1);
});
