import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TodoCreatePage from './TodoCreatePage'

vi.mock('../features/categories/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}))
vi.mock('../features/todos/hooks/useTodoMutations', () => ({
  useTodoMutations: vi.fn(),
}))

import { useCategories } from '../features/categories/hooks/useCategories'
import { useTodoMutations } from '../features/todos/hooks/useTodoMutations'

const mockUseCategories = vi.mocked(useCategories)
const mockUseTodoMutations = vi.mocked(useTodoMutations)

const mockCreateMutate = vi.fn()

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TodoCreatePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('TodoCreatePage', () => {
  beforeEach(() => {
    mockUseCategories.mockReturnValue({ data: [{ id: 1, name: '업무', is_default: true }] } as any)
    mockUseTodoMutations.mockReturnValue({
      createMutation: { mutate: mockCreateMutate, isPending: false },
      toggleMutation: { mutate: vi.fn() },
      updateMutation: { mutate: vi.fn() },
      deleteMutation: { mutate: vi.fn() },
    } as any)
    mockCreateMutate.mockReset()
  })

  it('data-testid="todo-create-page" 없이 NavBar에 새 할일 텍스트 표시', () => {
    renderPage()
    expect(screen.getByText('새 할일')).toBeInTheDocument()
  })
  it('제목, 설명, 카테고리, 종료예정일 입력 필드 존재', () => {
    renderPage()
    expect(screen.getByPlaceholderText('할일 제목을 입력하세요')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('상세 설명을 입력하세요 (선택)')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByLabelText(/종료예정일/)).toBeInTheDocument()
  })
  it('카테고리 드롭다운에 기본 카테고리 표시', () => {
    renderPage()
    expect(screen.getByRole('option', { name: '업무' })).toBeInTheDocument()
  })
  it('제목 미입력 시 제출하면 에러 메시지 표시', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByText('제목을 입력해주세요.')).toBeInTheDocument()
  })
  it('카테고리 미선택 시 제출하면 에러 메시지 표시', async () => {
    renderPage()
    fireEvent.input(screen.getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '할일' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByText('카테고리를 선택해주세요.')).toBeInTheDocument()
  })
  it('유효한 데이터 제출 시 createMutation.mutate 호출', async () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '청소하기' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ title: '청소하기', category_id: 1 }),
        expect.any(Object)
      )
    })
  })
  it('취소 버튼 클릭 시 /todos로 이동', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
  })
  it('로딩 중 저장 버튼 비활성화', () => {
    mockUseTodoMutations.mockReturnValue({
      createMutation: { mutate: mockCreateMutate, isPending: true },
      toggleMutation: { mutate: vi.fn() },
      updateMutation: { mutate: vi.fn() },
      deleteMutation: { mutate: vi.fn() },
    } as any)
    renderPage()
    expect(screen.getByRole('button', { name: /저장/ })).toBeDisabled()
  })
})
