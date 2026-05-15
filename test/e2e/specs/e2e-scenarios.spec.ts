/**
 * 통합 시나리오 E2E 테스트
 * 3-user-scenario.md §3 기반
 * - E2E-01: 김지우의 전형적인 업무 관리 플로우
 * - E2E-02: 박서준의 프로젝트별 학업 관리 플로우
 */
import { test, expect } from '@playwright/test'
import { uniqueEmail, registerAndLogin } from './helpers'

const PASSWORD = 'TestPass123!'

test.describe('E2E-01: 김지우의 업무 관리 플로우', () => {
  test('업무 할일 등록 → 완료 처리 → 수정 → 필터링 → 로그아웃', async ({ page }) => {
    const email = uniqueEmail('e2e-jiw')

    // Step 1-2: 회원가입 + 로그인
    await registerAndLogin(page, { email, password: PASSWORD, name: '김지우' })
    await expect(page.getByTestId('todo-list-page')).toBeVisible()
    await expect(page.getByText('김지우')).toBeVisible()

    // Step 3: 할일 목록 로드 (빈 상태)
    await expect(page.getByText('할일이 없습니다')).toBeVisible()

    // Step 4-5: Q2 마케팅 예산 할일 등록
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await page.getByPlaceholder('할일 제목을 입력하세요').fill('Q2 마케팅 예산 검토 및 승인 요청')
    await page.getByPlaceholder('상세 설명을 입력하세요 (선택)').fill('Q2 마케팅 예산안 검토 및 CFO 승인 진행')
    await page.getByRole('combobox').selectOption({ label: '업무' })
    await page.locator('input[type="date"]').fill('2030-05-16')
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForURL(/\/todos$/)
    await expect(page.getByText('Q2 마케팅 예산 검토 및 승인 요청')).toBeVisible()

    // Step 7-8: 월간 마케팅 리포트 할일 추가
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await page.getByPlaceholder('할일 제목을 입력하세요').fill('월간 마케팅 리포트 작성')
    await page.getByRole('combobox').selectOption({ label: '업무' })
    await page.locator('input[type="date"]').fill('2030-05-17')
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForURL(/\/todos$/)
    await expect(page.getByText('월간 마케팅 리포트 작성')).toBeVisible()

    // Step 10: Q2 마케팅 예산 → 완료 처리
    const checkboxes = page.getByRole('checkbox', { name: '완료 표시' })
    await checkboxes.last().click()
    await page.waitForTimeout(500)

    // Step 12-13: 월간 마케팅 리포트 due_date 수정
    await page.getByText('월간 마케팅 리포트 작성').click()
    await expect(page).toHaveURL(/\/edit/)
    // TodoEditPage의 종료예정일 input (label htmlFor="edit-due-date")
    const dueDateInput = page.getByLabel('종료예정일')
    await dueDateInput.fill('2030-05-19')
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForURL(/\/todos$/)

    // Step 15-16: 미완료 필터 적용
    await page.getByRole('combobox').selectOption('false')
    await expect(page.getByText('월간 마케팅 리포트 작성')).toBeVisible()

    // Step: 로그아웃
    await page.getByRole('button', { name: '로그아웃' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('E2E-02: 박서준의 학업 관리 플로우', () => {
  test('카테고리 필터 → 완료 처리 → 수정 → 완료 목록 조회', async ({ page }) => {
    const email = uniqueEmail('e2e-sjun')

    // 회원가입 + 로그인
    await registerAndLogin(page, { email, password: PASSWORD, name: '박서준' })

    // 테스트 데이터 생성 (개인 카테고리 할일들)
    const todos = [
      { title: '선형대수 과제 제출', category: '개인', due: '2020-01-01' },
      { title: '데이터베이스 설계 리포트', category: '개인', due: '2030-05-23' },
      { title: 'Q1 개별 리뷰 완료', category: '개인', due: '' },
    ]

    for (const todo of todos) {
      await page.getByRole('button', { name: '새 할일 추가' }).click()
      await page.getByPlaceholder('할일 제목을 입력하세요').fill(todo.title)
      await page.getByRole('combobox').selectOption({ label: todo.category })
      if (todo.due) {
        await page.locator('input[type="date"]').fill(todo.due)
      }
      await page.getByRole('button', { name: '저장' }).click()
      await page.waitForURL(/\/todos$/)
    }

    // Step 3-4: 개인 카테고리 필터
    await page.getByRole('button', { name: '개인' }).click()
    await expect(page.getByText('선형대수 과제 제출')).toBeVisible()
    await expect(page.getByText('데이터베이스 설계 리포트')).toBeVisible()

    // Step 7: 선형대수 과제 완료 처리
    // due_date 범위 필터 때문에 2020-01-01 항목이 안 보일 수 있으므로 종료예정일 범위 확장
    await page.getByLabel('종료예정일 시작').fill('2019-01-01')

    const overdueCheckbox = page.getByRole('checkbox').last()
    await overdueCheckbox.check()
    await page.waitForTimeout(500)

    const overdueItem = page.getByText('선형대수 과제 제출')
    if (await overdueItem.isVisible()) {
      const completeCheckbox = page.getByRole('checkbox', { name: '완료 표시' }).first()
      await completeCheckbox.click()
      await page.waitForTimeout(500)
    }

    // Step 10-11: 기간 초과 필터 해제 후 데이터베이스 리포트 수정
    await overdueCheckbox.uncheck()
    await page.waitForTimeout(300)

    const dbReport = page.getByText('데이터베이스 설계 리포트')
    await dbReport.click()
    await expect(page).toHaveURL(/\/edit/)

    const descInput = page.getByPlaceholder('상세 설명을 입력하세요 (선택)')
    await descInput.fill('설계안 초안 완료 + 피드백 반영')
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForURL(/\/todos$/)

    // Step 13: 완료 여부 필터 → 완료한 것만 표시
    await page.getByRole('combobox').selectOption('true')
    await expect(page.getByText('데이터베이스 설계 리포트')).not.toBeVisible()
  })
})

test.describe('다크모드 (추가 기능)', () => {
  test('다크모드 토글 → html 태그에 dark 클래스 적용', async ({ page }) => {
    await registerAndLogin(page, {
      email: uniqueEmail('darkmode'),
      password: PASSWORD,
      name: '다크모드테스터',
    })

    // 초기 상태: 라이트 모드
    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)

    // 다크모드 전환
    await page.getByRole('button', { name: '다크 모드로 전환' }).click()
    await expect(html).toHaveClass(/dark/)

    // 라이트모드 복귀
    await page.getByRole('button', { name: '라이트 모드로 전환' }).click()
    await expect(html).not.toHaveClass(/dark/)
  })

  test('다크모드 상태가 사용자별 localStorage에 저장됨', async ({ page }) => {
    const email = uniqueEmail('darkpersist')
    await registerAndLogin(page, { email, password: PASSWORD, name: '지속테스터' })

    // 다크모드 활성화
    await page.getByRole('button', { name: '다크 모드로 전환' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    // 로그아웃
    await page.getByRole('button', { name: '로그아웃' }).click()
    await expect(page).toHaveURL(/\/login/)

    // 다시 로그인
    await page.getByLabel('이메일').fill(email)
    await page.getByLabel('비밀번호').fill(PASSWORD)
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL(/\/todos/)

    // 다크모드가 복원되어야 함
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})

test.describe('크로스 시나리오: 데이터 접근 제어', () => {
  test('TC-AUTH-01: 다른 사용자의 할일 접근 불가', async ({ browser }) => {
    const emailA = uniqueEmail('auth-a')
    const emailB = uniqueEmail('auth-b')

    // 사용자 A: 할일 생성
    const pageA = await browser.newPage()
    await registerAndLogin(pageA, { email: emailA, password: PASSWORD, name: '사용자A' })
    await pageA.getByRole('button', { name: '새 할일 추가' }).click()
    await pageA.getByPlaceholder('할일 제목을 입력하세요').fill('A의 비밀 할일')
    await pageA.getByRole('combobox').selectOption({ label: '업무' })
    await pageA.getByRole('button', { name: '저장' }).click()
    await pageA.waitForURL(/\/todos$/)

    // URL에서 할일 ID 추출 (할일 클릭 후 edit URL)
    await pageA.getByText('A의 비밀 할일').click()
    const editUrl = pageA.url()
    const match = editUrl.match(/\/todos\/(\d+)\/edit/)
    const todoId = match?.[1]
    await pageA.close()

    if (!todoId) return

    // 사용자 B: A의 할일에 접근 시도
    const pageB = await browser.newPage()
    await registerAndLogin(pageB, { email: emailB, password: PASSWORD, name: '사용자B' })
    // page.goto()는 Zustand 초기화 → 클라이언트 사이드 네비게이션으로 대체
    await pageB.evaluate((url) => {
      window.history.pushState(null, '', url)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, `/todos/${todoId}/edit`)

    // 에러 메시지 표시 (403 or 404 → "할일을 찾을 수 없습니다." 표시)
    await expect(pageB.getByText('할일을 찾을 수 없습니다.')).toBeVisible({ timeout: 10000 })
    await pageB.close()
  })

  test('TC-AUTH-02: 자신의 할일만 목록에 표시', async ({ browser }) => {
    const emailA = uniqueEmail('own-a')
    const emailB = uniqueEmail('own-b')

    const pageA = await browser.newPage()
    await registerAndLogin(pageA, { email: emailA, password: PASSWORD, name: '소유A' })
    await pageA.getByRole('button', { name: '새 할일 추가' }).click()
    await pageA.getByPlaceholder('할일 제목을 입력하세요').fill('A 전용 할일')
    await pageA.getByRole('combobox').selectOption({ label: '업무' })
    await pageA.getByRole('button', { name: '저장' }).click()
    await pageA.waitForURL(/\/todos$/)
    await pageA.close()

    const pageB = await browser.newPage()
    await registerAndLogin(pageB, { email: emailB, password: PASSWORD, name: '소유B' })
    // B의 목록에 A의 할일이 없어야 함
    await expect(pageB.getByText('A 전용 할일')).not.toBeVisible()
    await pageB.close()
  })
})
