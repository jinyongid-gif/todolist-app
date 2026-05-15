import { test, expect } from '@playwright/test'

test('서버 접근 확인', async ({ page }) => {
  const response = await page.goto('http://localhost:5173/login')
  console.log('Status:', response?.status())
  await page.screenshot({ path: './results/debug-screenshot.png' })
  await expect(page.locator('body')).toBeVisible()
})
