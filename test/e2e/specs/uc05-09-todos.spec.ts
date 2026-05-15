/**
 * UC-05~09: 할일 CRUD + 완료 처리
 * 3-user-scenario.md §2.11 ~ §2.35 기반
 */
import { test, expect } from '@playwright/test'
import { uniqueEmail, registerAndLogin } from './helpers'

const PASSWORD = 'TestPass123!'

test.describe('UC-05 할일 등록', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      email: uniqueEmail('uc05'),
      password: PASSWORD,
      name: '등록테스터',
    })
  })

  test('MC-05-01: 필수 정보(제목+카테고리)만 입력하여 할일 등록', async ({ page }) => {
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await expect(page).toHaveURL(/\/todos\/create/)

    await page.getByPlaceholder('할일 제목을 입력하세요').fill('마케팅 전략서 작성')
    await page.getByRole('combobox').selectOption({ label: '업무' })
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page).toHaveURL(/\/todos$/)
    await expect(page.getByText('마케팅 전략서 작성')).toBeVisible()
  })

  test('MC-05-02: 모든 정보 입력하여 할일 등록', async ({ page }) => {
    await page.getByRole('button', { name: '새 할일 추가' }).click()

    await page.getByPlaceholder('할일 제목을 입력하세요').fill('수학 과제 제출')
    await page.getByPlaceholder('상세 설명을 입력하세요 (선택)').fill('선형대수 Chapter 5 연습문제 1~20번')
    await page.getByRole('combobox').selectOption({ label: '개인' })
    await page.locator('input[type="date"]').fill('2030-05-20')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page).toHaveURL(/\/todos$/)
    await expect(page.getByText('수학 과제 제출')).toBeVisible()
  })

  test('EC-05-01: 제목 미입력 → 에러 메시지', async ({ page }) => {
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await page.getByRole('combobox').selectOption({ label: '업무' })
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.getByText('제목을 입력해주세요.')).toBeVisible()
    await expect(page).toHaveURL(/\/todos\/create/)
  })

  test('AC-05-01: FAB 버튼 클릭 → 할일 등록 화면 진입', async ({ page }) => {
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await expect(page).toHaveURL(/\/todos\/create/)
    await expect(page.getByTestId('todo-create-page')).toBeVisible()
  })

  test('취소 버튼 클릭 → 목록으로 복귀, 할일 미저장', async ({ page }) => {
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await page.getByPlaceholder('할일 제목을 입력하세요').fill('저장안할 할일')
    await page.getByRole('button', { name: '취소' }).click()

    await expect(page).toHaveURL(/\/todos$/)
    await expect(page.getByText('저장안할 할일')).not.toBeVisible()
  })
})

test.describe('UC-06 할일 목록 조회 및 필터링', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      email: uniqueEmail('uc06'),
      password: PASSWORD,
      name: '조회테스터',
    })
    // 테스트 데이터 생성
    const todos = [
      { title: '업무 할일 A', category: '업무' },
      { title: '업무 할일 B', category: '업무' },
      { title: '개인 할일 C', category: '개인' },
    ]
    for (const todo of todos) {
      await page.getByRole('button', { name: '새 할일 추가' }).click()
      await page.getByPlaceholder('할일 제목을 입력하세요').fill(todo.title)
      await page.getByRole('combobox').selectOption({ label: todo.category })
      await page.getByRole('button', { name: '저장' }).click()
      await page.waitForURL(/\/todos$/)
    }
  })

  test('MC-06-01: 필터 없이 전체 할일 목록 조회', async ({ page }) => {
    await expect(page.getByText('업무 할일 A')).toBeVisible()
    await expect(page.getByText('업무 할일 B')).toBeVisible()
    await expect(page.getByText('개인 할일 C')).toBeVisible()
  })

  test('MC-06-02: 카테고리 필터 → 해당 카테고리만 표시', async ({ page }) => {
    await page.getByRole('button', { name: '업무' }).click()

    await expect(page.getByText('업무 할일 A')).toBeVisible()
    await expect(page.getByText('업무 할일 B')).toBeVisible()
    await expect(page.getByText('개인 할일 C')).not.toBeVisible()
  })

  test('MC-06-03: 완료 여부 필터 → 미완료만 표시', async ({ page }) => {
    // ORDER BY created_at DESC 이므로 화면 순서: 개인C, 업무B, 업무A
    // 마지막 체크박스(업무A)를 완료 처리하여 B·C만 미완료 필터에 표시되게 함
    const lastCheckbox = page.getByRole('checkbox', { name: '완료 표시' }).last()
    await lastCheckbox.click()
    // 완료 처리 반영 대기
    await expect(page.getByRole('checkbox', { name: '완료 취소' })).toBeVisible()

    // 미완료만 필터
    await page.getByRole('combobox').selectOption('false')
    await expect(page.getByText('업무 할일 B')).toBeVisible()
    await expect(page.getByText('개인 할일 C')).toBeVisible()
  })

  test('MC-06-03: 완료 여부 필터 → 완료만 표시', async ({ page }) => {
    // 마지막 체크박스(업무A)를 완료 처리
    const lastCheckbox = page.getByRole('checkbox', { name: '완료 표시' }).last()
    await lastCheckbox.click()
    await expect(page.getByRole('checkbox', { name: '완료 취소' })).toBeVisible()

    await page.getByRole('combobox').selectOption('true')
    await expect(page.getByText('업무 할일 A')).toBeVisible()
    await expect(page.getByText('업무 할일 B')).not.toBeVisible()
  })

  test('AC-06-01: 할일이 없을 때 빈 상태 메시지 표시', async ({ page }) => {
    // 신규 유저 → 할일 없음
    await page.context().clearCookies()
    await registerAndLogin(page, {
      email: uniqueEmail('uc06-empty'),
      password: PASSWORD,
      name: '빈상태테스터',
    })
    await expect(page.getByText('할일이 없습니다')).toBeVisible()
  })
})

test.describe('UC-07 할일 수정', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      email: uniqueEmail('uc07'),
      password: PASSWORD,
      name: '수정테스터',
    })
    // 수정할 할일 생성
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await page.getByPlaceholder('할일 제목을 입력하세요').fill('수정될 할일')
    await page.getByRole('combobox').selectOption({ label: '업무' })
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForURL(/\/todos$/)
  })

  test('MC-07-01: 할일 카드 클릭 → 수정 화면 진입 + 데이터 프리필', async ({ page }) => {
    await page.getByText('수정될 할일').click()
    await expect(page).toHaveURL(/\/todos\/\d+\/edit/)
    await expect(page.getByTestId('todo-edit-page')).toBeVisible()

    const titleInput = page.getByPlaceholder('할일 제목을 입력하세요')
    await expect(titleInput).toHaveValue('수정될 할일')
  })

  test('MC-07-01: 제목 수정 후 저장 → 목록에 반영', async ({ page }) => {
    await page.getByText('수정될 할일').click()
    await expect(page).toHaveURL(/\/todos\/\d+\/edit/)

    const titleInput = page.getByPlaceholder('할일 제목을 입력하세요')
    await titleInput.clear()
    await titleInput.fill('수정된 할일 제목')
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page).toHaveURL(/\/todos$/)
    await expect(page.getByText('수정된 할일 제목')).toBeVisible()
    await expect(page.getByText('수정될 할일')).not.toBeVisible()
  })

  test('EC-07-03: 제목 공란으로 수정 시도 → 에러 메시지', async ({ page }) => {
    await page.getByText('수정될 할일').click()
    await expect(page).toHaveURL(/\/todos\/\d+\/edit/)

    const titleInput = page.getByPlaceholder('할일 제목을 입력하세요')
    await titleInput.clear()
    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.getByText('제목을 입력해주세요.')).toBeVisible()
    await expect(page).toHaveURL(/\/edit/)
  })

  test('AC-07-01: 수정 취소 → 목록으로 복귀, 변경 미반영', async ({ page }) => {
    await page.getByText('수정될 할일').click()
    const titleInput = page.getByPlaceholder('할일 제목을 입력하세요')
    await titleInput.clear()
    await titleInput.fill('취소될 변경사항')
    await page.getByRole('button', { name: '취소' }).click()

    await expect(page).toHaveURL(/\/todos$/)
    await expect(page.getByText('수정될 할일')).toBeVisible()
    await expect(page.getByText('취소될 변경사항')).not.toBeVisible()
  })
})

test.describe('UC-08 할일 완료 처리', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      email: uniqueEmail('uc08'),
      password: PASSWORD,
      name: '완료테스터',
    })
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await page.getByPlaceholder('할일 제목을 입력하세요').fill('완료할 할일')
    await page.getByRole('combobox').selectOption({ label: '업무' })
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForURL(/\/todos$/)
  })

  test('MC-08-01: 체크박스 클릭 → 완료 처리 (취소선 적용)', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: '완료 표시' })
    await checkbox.click()
    await page.waitForTimeout(500)

    // 완료된 할일은 취소선 적용
    await expect(page.getByText('완료할 할일')).toHaveClass(/line-through/)
  })

  test('MC-08-02: 완료 상태 재클릭 → 완료 취소 (취소선 제거)', async ({ page }) => {
    // 먼저 완료 처리
    const checkbox = page.getByRole('checkbox', { name: '완료 표시' })
    await checkbox.click()
    await page.waitForTimeout(500)

    // 다시 클릭하여 완료 취소
    const undoCheckbox = page.getByRole('checkbox', { name: '완료 취소' })
    await undoCheckbox.click()
    await page.waitForTimeout(500)

    await expect(page.getByText('완료할 할일')).not.toHaveClass(/line-through/)
  })
})

test.describe('UC-09 할일 삭제', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      email: uniqueEmail('uc09'),
      password: PASSWORD,
      name: '삭제테스터',
    })
    await page.getByRole('button', { name: '새 할일 추가' }).click()
    await page.getByPlaceholder('할일 제목을 입력하세요').fill('삭제될 할일')
    await page.getByRole('combobox').selectOption({ label: '업무' })
    await page.getByRole('button', { name: '저장' }).click()
    await page.waitForURL(/\/todos$/)
  })

  test('MC-09-01: 삭제 버튼 → 확인 모달 → 삭제 → 목록에서 제거', async ({ page }) => {
    await page.getByText('삭제될 할일').click()
    await expect(page).toHaveURL(/\/edit/)

    // 삭제 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).first().click()

    // 확인 모달 표시
    await expect(page.getByText('이 할일을 삭제하시겠습니까?')).toBeVisible()

    // 모달의 삭제 버튼 클릭
    const deleteButtons = page.getByRole('button', { name: '삭제' })
    await deleteButtons.last().click()

    // 목록으로 이동, 할일 제거 확인
    await expect(page).toHaveURL(/\/todos$/)
    await expect(page.getByText('삭제될 할일')).not.toBeVisible()
  })

  test('AC-09-01: 삭제 확인 모달에서 취소 → 할일 유지', async ({ page }) => {
    await page.getByText('삭제될 할일').click()
    await page.getByRole('button', { name: '삭제' }).first().click()
    await expect(page.getByText('이 할일을 삭제하시겠습니까?')).toBeVisible()

    // 모달에서 취소 (모달 내 취소 버튼 클릭)
    await page.getByRole('button', { name: '취소' }).last().click()
    await expect(page.getByText('이 할일을 삭제하시겠습니까?')).not.toBeVisible()
    await expect(page).toHaveURL(/\/edit/)
  })

  test('EC-07-02: 존재하지 않는 할일 수정 → 에러 메시지', async ({ page }) => {
    // page.goto()는 Zustand 초기화 → 클라이언트 사이드 네비게이션으로 대체
    await page.evaluate(() => {
      window.history.pushState(null, '', '/todos/99999/edit')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.getByText('할일을 찾을 수 없습니다.')).toBeVisible()
  })
})
