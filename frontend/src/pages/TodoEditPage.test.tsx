import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TodoEditPage from './TodoEditPage'

vi.mock('../features/categories/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}))
vi.mock('../features/todos/hooks/useTodoMutations', () => ({
  useTodoMutations: vi.fn(),
}))
vi.mock('../features/todos/hooks/useTodoById', () => ({
  useTodoById: vi.fn(),
}))

import { useCategories } from '../features/categories/hooks/useCategories'
import { useTodoMutations } from '../features/todos/hooks/useTodoMutations'
import { useTodoById } from '../features/todos/hooks/useTodoById'

const mockUseCategories = vi.mocked(useCategories)
const mockUseTodoMutations = vi.mocked(useTodoMutations)
const mockUseTodoById = vi.mocked(useTodoById)

const mockUpdateMutate = vi.fn()
const mockDeleteMutate = vi.fn()

const baseTodo = {
  id: 1, user_id: 1, category_id: 1, title: '기존 할일',
  description: '기존 설명', due_date: '2026-06-01', is_completed: false,
  created_at: '', updated_at: '',
}

function renderPage(todoId = '1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/todos/${todoId}/edit`]}>
        <Routes>
          <Route path="/todos/:id/edit" element={<TodoEditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('TodoEditPage', () => {
  beforeEach(() => {
    mockUseCategories.mockReturnValue({ data: [{ id: 1, name: '업무', is_default: true }] } as any)
    mockUseTodoById.mockReturnValue({ data: baseTodo, isLoading: false, isError: false } as any)
    mockUseTodoMutations.mockReturnValue({
      toggleMutation: { mutate: vi.fn() },
      createMutation: { mutate: vi.fn() },
      updateMutation: { mutate: mockUpdateMutate, isPending: false },
      deleteMutation: { mutate: mockDeleteMutate, isPending: false },
    } as any)
    mockUpdateMutate.mockReset()
    mockDeleteMutate.mockReset()
  })

  it('기존 할일 데이터가 폼에 미리 채워짐', async () => {
    renderPage()
    await waitFor(() => {
      expect((screen.getByPlaceholderText('할일 제목을 입력하세요') as HTMLInputElement).value).toBe('기존 할일')
    })
    expect((screen.getByPlaceholderText('상세 설명을 입력하세요 (선택)') as HTMLTextAreaElement).value).toBe('기존 설명')
  })
  it('수정 후 저장 시 updateMutation.mutate 호출', async () => {
    renderPage()
    await waitFor(() => {
      expect((screen.getByPlaceholderText('할일 제목을 입력하세요') as HTMLInputElement).value).toBe('기존 할일')
    })
    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '수정된 할일' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, payload: expect.objectContaining({ title: '수정된 할일' }) }),
        expect.any(Object)
      )
    })
  })
  it('삭제 버튼 클릭 시 확인 모달 표시', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    expect(await screen.findByText('할일 삭제')).toBeInTheDocument()
    expect(screen.getByText(/삭제 후 복구할 수 없습니다/)).toBeInTheDocument()
  })
  it('모달에서 삭제 확인 시 deleteMutation.mutate 호출', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    await screen.findByText('할일 삭제')
    const deleteButtons = screen.getAllByRole('button', { name: /삭제/ })
    fireEvent.click(deleteButtons[deleteButtons.length - 1])
    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith(1, expect.any(Object))
    })
  })
  it('모달에서 취소 클릭 시 모달 닫힘', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    await screen.findByText('할일 삭제')
    const cancelButtons = screen.getAllByRole('button', { name: '취소' })
    fireEvent.click(cancelButtons[cancelButtons.length - 1])
    await waitFor(() => {
      expect(screen.queryByText('할일 삭제')).not.toBeInTheDocument()
    })
  })
  it('로딩 중 스피너 표시', () => {
    mockUseTodoById.mockReturnValue({ data: undefined, isLoading: true, isError: false } as any)
    renderPage()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
  it('에러 시 에러 메시지와 목록으로 돌아가기 링크 표시', () => {
    mockUseTodoById.mockReturnValue({ data: undefined, isLoading: false, isError: true } as any)
    renderPage()
    expect(screen.getByText('할일을 찾을 수 없습니다.')).toBeInTheDocument()
    expect(screen.getByText('목록으로 돌아가기')).toBeInTheDocument()
  })
  it('제목 미입력 시 에러 메시지', async () => {
    renderPage()
    await waitFor(() => {
      expect((screen.getByPlaceholderText('할일 제목을 입력하세요') as HTMLInputElement).value).toBe('기존 할일')
    })
    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByText('제목을 입력해주세요.')).toBeInTheDocument()
  })
})
