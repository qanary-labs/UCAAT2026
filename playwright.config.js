// @ts-check
import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  timeout: 10_000,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ...(isCI ? [["json", { outputFile: "playwright-report/results.json" }]] : []),
  ],
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: isCI,
    launchOptions: {
      slowMo: isCI ? 0 : 1000,
    },
    trace: "on",
    screenshot: "on",
    video: "on",
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !isCI,
  },
});
