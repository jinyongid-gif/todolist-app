/**
 * UC-02: 로그인
 * 3-user-scenario.md §2.6 ~ §2.10 기반
 */
import { test, expect } from '@playwright/test'
import { uniqueEmail, registerAndLogin } from './helpers'

test.describe('UC-02 로그인', () => {
  let testEmail: string
  const testPassword = 'TestPass123!'

  test.beforeAll(async ({ browser }) => {
    testEmail = uniqueEmail('uc02')
    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel('이름').fill('로그인테스터')
    await page.getByLabel('이메일').fill(testEmail)
    await page.getByLabel('비밀번호').fill(testPassword)
    await page.getByRole('button', { name: '회원가입' }).click()
    await page.waitForURL(/\/login/)
    await page.close()
  })

  test('MC-02-01: 유효한 이메일·비밀번호로 로그인 성공 → 할일 목록 화면 이동', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(testEmail)
    await page.getByLabel('비밀번호').fill(testPassword)
    await page.getByRole('button', { name: '로그인' }).click()

    // 할일 목록 화면(SCR-03)으로 이동
    await expect(page).toHaveURL(/\/todos/)
    await expect(page.getByTestId('todo-list-page')).toBeVisible()
    // 사용자 이름 표시 확인
    await expect(page.getByText('로그인테스터')).toBeVisible()
  })

  test('EC-02-01: 존재하지 않는 이메일 로그인 → 에러 메시지', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill('nonexistent@playwright.test')
    await page.getByLabel('비밀번호').fill(testPassword)
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).not.toHaveURL(/\/todos/)
  })

  test('EC-02-02: 잘못된 비밀번호 로그인 → 에러 메시지', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(testEmail)
    await page.getByLabel('비밀번호').fill('WrongPassword')
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).not.toHaveURL(/\/todos/)
  })

  test('EC-02-03: 비밀번호 필드 공란 → 에러 메시지', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(testEmail)
    // 비밀번호 미입력
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).not.toHaveURL(/\/todos/)
  })

  test('보안: 비인증 상태에서 /todos 접근 → /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/todos')
    await expect(page).toHaveURL(/\/login/)
  })

  test('보안: 로그인 상태에서 /todos 유지 확인', async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('uc02-auth'), password: testPassword, name: '보안테스터' })
    await expect(page).toHaveURL(/\/todos/)
    await expect(page.getByTestId('todo-list-page')).toBeVisible()
  })

  test('AC-02-01: 회원가입 화면의 로그인 링크 → 로그인 화면 진입', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: '로그인' }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('로그아웃 후 /login으로 이동 및 토큰 초기화 확인', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(testEmail)
    await page.getByLabel('비밀번호').fill(testPassword)
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL(/\/todos/)

    await page.getByRole('button', { name: '로그아웃' }).click()
    await expect(page).toHaveURL(/\/login/)

    // 다시 /todos 접근 시 리다이렉트
    await page.goto('/todos')
    await expect(page).toHaveURL(/\/login/)
  })
})
