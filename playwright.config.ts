import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    timeout: 90_000,
    retries: 1,
    reporter: "html",
    use: {
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:5173",
        trace: "on-first-retry",
        screenshot: "only-on-failure"
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] }
        }
    ],
    webServer: process.env.CI ? undefined : [
        {
            command: "cd backend && npm run dev",
            port: 3000,
            reuseExistingServer: true,
            timeout: 30_000
        },
        {
            command: "cd frontend && npm run dev",
            port: 5173,
            reuseExistingServer: true,
            timeout: 30_000
        }
    ]
});
