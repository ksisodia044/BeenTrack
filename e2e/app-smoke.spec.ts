import { expect, test, type Page } from "@playwright/test";

function makeUser(tag: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `${tag}.${stamp}@example.com`,
    password: "Smoke123!",
    name: `User ${stamp}`,
  };
}

function getSeededUser(prefix: "ADMIN" | "STAFF") {
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`];

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

async function signUp(page: Page, user: ReturnType<typeof makeUser>) {
  await page.goto("/signup");
  await page.locator("#name").fill(user.name);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
}

async function logIn(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("app smoke", () => {
  test("staff navigation, route protection, and dashboard buttons work", async ({ page }) => {
    const user = makeUser("app-smoke");

    await signUp(page, user);
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "POS (New Sale)" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sales History" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Low Stock" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Suppliers" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Reports" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add Supplier" })).toHaveCount(0);

    await page.getByRole("link", { name: "POS (New Sale)" }).click();
    await page.waitForURL("**/sales");
    await expect(page.getByRole("heading", { name: "Point of Sale" })).toBeVisible();

    await page.getByRole("link", { name: "Sales History" }).click();
    await page.waitForURL("**/sales/history");
    await expect(page.getByRole("heading", { name: "Sales History" })).toBeVisible();

    await page.getByRole("link", { name: "Products" }).click();
    await page.waitForURL("**/products");
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

    await page.getByRole("link", { name: "Low Stock" }).click();
    await page.waitForURL("**/alerts/low-stock");
    await expect(page.getByRole("heading", { name: "Low Stock Alerts" })).toBeVisible();

    await page.getByRole("link", { name: "Settings" }).click();
    await page.waitForURL("**/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    await page.goto("/dashboard");
    await page.getByRole("button", { name: /^New Sale$/ }).first().click();
    await page.waitForURL("**/sales");
    await expect(page.getByRole("heading", { name: "Point of Sale" })).toBeVisible();

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Add Product" }).click();
    await page.waitForURL("**/products");
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "View all" }).click();
    await page.waitForURL("**/alerts/low-stock");
    await expect(page.getByRole("heading", { name: "Low Stock Alerts" })).toBeVisible();

    await page.goto("/suppliers");
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.goto("/reports");
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("seeded admin can access admin pages", async ({ page }) => {
    const admin = getSeededUser("ADMIN");

    test.skip(!admin, "requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    await logIn(page, admin!);

    await expect(page.getByRole("link", { name: "Suppliers" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Supplier" })).toBeVisible();

    await page.getByRole("link", { name: "Suppliers" }).click();
    await page.waitForURL("**/suppliers");
    await expect(page.getByRole("heading", { name: "Suppliers" })).toBeVisible();

    await page.getByRole("link", { name: "Reports" }).click();
    await page.waitForURL("**/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  });

  test("seeded staff can complete a sale with sample data", async ({ page }) => {
    const staff = getSeededUser("STAFF");
    const sampleProductName = process.env.E2E_SAMPLE_PRODUCT_NAME;

    test.skip(!staff || !sampleProductName, "requires seeded staff credentials and E2E_SAMPLE_PRODUCT_NAME");

    await logIn(page, staff!);
    await page.goto("/sales");
    await expect(page.getByRole("heading", { name: "Point of Sale" })).toBeVisible();

    await page.getByPlaceholder("Search by product name or SKU...").fill(sampleProductName!);
    await page.getByRole("button", { name: new RegExp(sampleProductName!, "i") }).first().click();
    await page.getByRole("button", { name: /Checkout/i }).click();

    await expect(page.getByRole("heading", { name: "Sale Complete!" })).toBeVisible();
    await expect(page.getByText(/Receipt #/i)).toBeVisible();
  });
});
