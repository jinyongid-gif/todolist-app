import { Page } from '@playwright/test'

export const BASE = 'http://localhost:5173'
export const API = 'http://localhost:3000'

/** 테스트마다 고유한 이메일 생성 */
export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}@playwright.test`
}

/** 회원가입 + 로그인까지 완료하는 헬퍼 */
export async function registerAndLogin(
  page: Page,
  opts: { email: string; password: string; name: string }
) {
  await page.goto('/register')
  await page.getByLabel('이름').fill(opts.name)
  await page.getByLabel('이메일').fill(opts.email)
  await page.getByLabel('비밀번호').fill(opts.password)
  await page.getByRole('button', { name: '회원가입' }).click()
  // 로그인 화면으로 이동 대기
  await page.waitForURL('**/login')

  await page.getByLabel('이메일').fill(opts.email)
  await page.getByLabel('비밀번호').fill(opts.password)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('**/todos')
}

/** 이미 존재하는 계정으로 로그인 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('**/todos')
}
