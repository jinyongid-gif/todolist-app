/**
 * UC-01: 회원가입
 * 3-user-scenario.md §2.3 ~ §2.5 기반
 */
import { test, expect } from '@playwright/test'
import { uniqueEmail } from './helpers'

test.describe('UC-01 회원가입', () => {
  test('MC-01-01: 신규 사용자 회원가입 완료', async ({ page }) => {
    const email = uniqueEmail('uc01')
    await page.goto('/register')

    await page.getByLabel('이름').fill('김지우')
    await page.getByLabel('이메일').fill(email)
    await page.getByLabel('비밀번호').fill('TestPass123!')
    await page.getByRole('button', { name: '회원가입' }).click()

    // 로그인 화면으로 자동 이동
    await expect(page).toHaveURL(/\/login/)
  })

  test('EC-01-01: 이미 가입된 이메일로 재가입 시도 → 에러 메시지', async ({ page }) => {
    const email = uniqueEmail('uc01-dup')
    // 먼저 한 번 가입
    await page.goto('/register')
    await page.getByLabel('이름').fill('첫번째')
    await page.getByLabel('이메일').fill(email)
    await page.getByLabel('비밀번호').fill('TestPass123!')
    await page.getByRole('button', { name: '회원가입' }).click()
    await page.waitForURL(/\/login/)

    // 동일 이메일로 재가입 시도
    await page.goto('/register')
    await page.getByLabel('이름').fill('두번째')
    await page.getByLabel('이메일').fill(email)
    await page.getByLabel('비밀번호').fill('TestPass123!')
    await page.getByRole('button', { name: '회원가입' }).click()

    // 에러 메시지 표시 (409 응답)
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('EC-01-02: 잘못된 이메일 형식 → 에러 메시지', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('이름').fill('테스터')
    await page.getByLabel('이메일').fill('invalid-email')
    await page.getByLabel('비밀번호').fill('TestPass123!')
    await page.getByRole('button', { name: '회원가입' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('EC-01-03: 필수 필드 미입력 → 에러 메시지', async ({ page }) => {
    await page.goto('/register')
    // 이메일 공란
    await page.getByLabel('이름').fill('테스터')
    await page.getByLabel('비밀번호').fill('TestPass123!')
    await page.getByRole('button', { name: '회원가입' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('AC-01-01: 로그인 화면의 회원가입 링크 → 회원가입 화면 진입', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: '회원가입' }).click()
    await expect(page).toHaveURL(/\/register/)
  })
})
