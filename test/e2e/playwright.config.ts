import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  outputDir: './results/artifacts',
  reporter: [
    ['html', { outputFolder: './results/html-report', open: 'never' }],
    ['json', { outputFile: './results/test-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 30000,
  expect: { timeout: 10000 },
  workers: 1,
})
