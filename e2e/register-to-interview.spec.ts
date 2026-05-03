import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:5173";

// Helper: fill the register form using stable IDs
async function fillRegisterForm(page: any, user: { username: string; email: string; password: string }) {
    await page.locator("#reg-username").fill(user.username);
    await page.locator("#reg-email").fill(user.email);
    await page.locator("#reg-password").fill(user.password);
    await page.locator("#reg-confirm").fill(user.password);
    await page.getByRole("button", { name: /create account|register|sign up/i }).click();
}

// Helper: register and wait for /home
async function registerAndLogin(page: any) {
    const ts = Date.now();
    const user = {
        username: `user_${ts}`,
        email: `user_${ts}@example.com`,
        password: "Password@123"
    };
    await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveTitle(/interview/i);
    await fillRegisterForm(page, user);
    await page.waitForURL(/\/home/, { timeout: 20_000 });
    return user;
}

test.describe("AI Interview Platform — E2E", () => {

    test("Register flow — user lands on /home after registration", async ({ page }) => {
        await registerAndLogin(page);
        await expect(page).toHaveURL(/\/home/);
        // Verify the interview form is present on home page
        await expect(page.locator("form, .home-form, .strategy-form, textarea").first()).toBeVisible({ timeout: 5_000 });
    });

    test("Strategy form is visible on home page after login", async ({ page }) => {
        await registerAndLogin(page);

        // Verify job description input or textarea is present
        const jobInput = page.locator("textarea, input[name='jobDescription']").first();
        await expect(jobInput).toBeVisible({ timeout: 5_000 });

        // Fill the form
        await jobInput.fill(
            "Senior Frontend Engineer with 5+ years React, TypeScript, and accessibility expertise."
        );

        // Generate button should be clickable
        const generateBtn = page.getByRole("button", { name: /generate|analyze/i }).first();
        await expect(generateBtn).toBeVisible();
        await expect(generateBtn).toBeEnabled();
    });

    test("Session History page is accessible after login", async ({ page }) => {
        await registerAndLogin(page);

        // Navigate directly to sessions
        await page.goto(`${BASE_URL}/sessions`);
        await expect(page).toHaveURL(/\/sessions/);

        // Use heading role — avoids strict mode violation with multiple matching elements
        await expect(page.getByRole("heading", { name: /interview history/i })).toBeVisible({ timeout: 10_000 });
    });

    test("Interview page is accessible after login", async ({ page }) => {
        await registerAndLogin(page);

        // Navigate directly to /interview
        await page.goto(`${BASE_URL}/interview`);

        // Should still be on /interview or redirect to home (protected route)
        await expect(page).toHaveURL(/\/interview|\/home/);
    });
});
