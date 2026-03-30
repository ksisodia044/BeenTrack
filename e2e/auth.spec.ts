import { expect, test, type Page } from "@playwright/test";

function makeUser(tag: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `${tag}.${stamp}@example.com`,
    password: "Smoke123!",
    name: `User ${stamp}`,
  };
}

async function signUp(page: Page, user: ReturnType<typeof makeUser>) {
  await page.goto("/signup");
  await page.locator("#name").fill(user.name);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
}

async function logIn(page: Page, user: ReturnType<typeof makeUser>) {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function logOut(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("**/login");
}

test.describe("auth end-to-end", () => {
  test("signup lands a new user in the app", async ({ page }) => {
    const user = makeUser("signup");

    await signUp(page, user);

    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("login and logout work for an existing user", async ({ page }) => {
    const user = makeUser("login");

    await signUp(page, user);
    await page.waitForURL("**/dashboard");
    await logOut(page);

    await logIn(page, user);

    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await logOut(page);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("session persists after reload", async ({ page }) => {
    const user = makeUser("persist");

    await signUp(page, user);
    await page.waitForURL("**/dashboard");

    await page.reload();

    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("invalid credentials show an error and keep the user on login", async ({ page }) => {
    const user = makeUser("invalid");

    await page.goto("/login");
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("**/login");
    await expect(page.getByText(/invalid login credentials|login failed/i).first()).toBeVisible();
  });

  test("duplicate email signup shows an error and does not authenticate", async ({ page, browser }) => {
    const user = makeUser("duplicate");

    await signUp(page, user);
    await page.waitForURL("**/dashboard");

    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();

    await signUp(freshPage, user);

    await freshPage.waitForURL("**/signup");
    await expect(freshPage.getByText(/already registered|already been registered|user already registered/i).first()).toBeVisible();
    await expect(freshPage.getByRole("heading", { name: "Create account" })).toBeVisible();

    await freshContext.close();
  });
});
