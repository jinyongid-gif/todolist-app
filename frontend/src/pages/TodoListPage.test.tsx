import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TodoListPage from './TodoListPage'

vi.mock('../features/todos/hooks/useTodos', () => ({
  useTodos: vi.fn(),
}))
vi.mock('../features/categories/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}))
vi.mock('../features/todos/hooks/useTodoMutations', () => ({
  useTodoMutations: vi.fn(),
}))

import { useTodos } from '../features/todos/hooks/useTodos'
import { useCategories } from '../features/categories/hooks/useCategories'
import { useTodoMutations } from '../features/todos/hooks/useTodoMutations'
import { useAuthStore } from '../stores/useAuthStore'

const mockUseTodos = vi.mocked(useTodos)
const mockUseCategories = vi.mocked(useCategories)
const mockUseTodoMutations = vi.mocked(useTodoMutations)

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TodoListPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('TodoListPage', () => {
  beforeEach(() => {
    mockUseTodos.mockReturnValue({ data: [], isLoading: false } as any)
    mockUseCategories.mockReturnValue({ data: [] } as any)
    mockUseTodoMutations.mockReturnValue({ toggleMutation: { mutate: vi.fn() } } as any)
    useAuthStore.setState({ user: { id: 1, email: 'test@test.com', name: '테스트' }, token: 'token', isLoading: false })
  })

  it('data-testid="todo-list-page" 렌더링 (NavBar)', () => {
    renderPage()
    expect(screen.getByText('TodoList')).toBeInTheDocument()
  })
  it('사용자 이름 표시', () => {
    renderPage()
    expect(screen.getByText('테스트')).toBeInTheDocument()
  })
  it('빈 상태 메시지 표시', () => {
    renderPage()
    expect(screen.getByText('할일이 없습니다')).toBeInTheDocument()
  })
  it('할일 목록 표시', () => {
    mockUseTodos.mockReturnValue({
      data: [{ id: 1, user_id: 1, category_id: 1, title: '청소하기', is_completed: false, created_at: '', updated_at: '' }],
      isLoading: false,
    } as any)
    renderPage()
    expect(screen.getByText('청소하기')).toBeInTheDocument()
  })
  it('로딩 중 스피너 표시', () => {
    mockUseTodos.mockReturnValue({ data: undefined, isLoading: true } as any)
    renderPage()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
  it('로그아웃 버튼 클릭 시 logout 호출', () => {
    renderPage()
    const logoutBtn = screen.getByRole('button', { name: '로그아웃' })
    fireEvent.click(logoutBtn)
    expect(useAuthStore.getState().token).toBeNull()
  })
  it('새 할일 추가 FAB 버튼 존재', () => {
    renderPage()
    expect(screen.getByRole('button', { name: '새 할일 추가' })).toBeInTheDocument()
  })
})
