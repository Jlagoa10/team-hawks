import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: 'launch.spec.js',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: process.env.LAUNCH_URL || 'http://127.0.0.1:5173',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
    trace: 'retain-on-failure',
  },
  webServer: process.env.LAUNCH_URL ? undefined : {
    command: 'npm run preview -- --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
});
