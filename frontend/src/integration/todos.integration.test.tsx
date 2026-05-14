import { render } from '@testing-library/react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import AppRouter from '../router/AppRouter'
import { useAuthStore } from '../stores/useAuthStore'
import { server } from '../test/server'

function renderAppAuthenticated(initialPath = '/todos') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  useAuthStore.setState({
    user: { id: 1, email: 'test@test.com', name: '테스트유저' },
    token: 'mock-access-token',
    isLoading: false,
  })
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRouter />
        </MemoryRouter>
      </QueryClientProvider>
    ),
    queryClient,
  }
}

describe('Todos Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 1, email: 'test@test.com', name: '테스트유저' },
      token: 'mock-access-token',
      isLoading: false,
    })
  })

  it('할일 목록 조회 (3개 표시)', async () => {
    renderAppAuthenticated('/todos')

    await waitFor(() => {
      expect(screen.getByText('업무 할일')).toBeInTheDocument()
      expect(screen.getByText('개인 할일')).toBeInTheDocument()
      expect(screen.getByText('기한 초과 할일')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('카테고리 필터 선택 시 해당 카테고리만 표시', async () => {
    renderAppAuthenticated('/todos')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '업무' })).toBeInTheDocument()
    }, { timeout: 3000 })

    fireEvent.click(screen.getByRole('button', { name: '업무' }))

    await waitFor(() => {
      expect(screen.getByText('업무 할일')).toBeInTheDocument()
      expect(screen.queryByText('개인 할일')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('완료 여부 필터 - 완료 항목만 표시', async () => {
    renderAppAuthenticated('/todos')

    await waitFor(() => {
      expect(screen.getByText('업무 할일')).toBeInTheDocument()
    }, { timeout: 3000 })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'true' } })

    await waitFor(() => {
      expect(screen.getByText('개인 할일')).toBeInTheDocument()
      expect(screen.queryByText('업무 할일')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('완료 여부 필터 - 미완료 항목만 표시', async () => {
    renderAppAuthenticated('/todos')

    await waitFor(() => {
      expect(screen.getByText('업무 할일')).toBeInTheDocument()
    }, { timeout: 3000 })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'false' } })

    await waitFor(() => {
      expect(screen.getByText('업무 할일')).toBeInTheDocument()
      expect(screen.queryByText('개인 할일')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('기간 초과 필터', async () => {
    const pad = (d: Date) => d.toISOString().slice(0, 10)
    const today = new Date()
    const future = new Date(today); future.setDate(today.getDate() + 5)
    const past = new Date(today); past.setDate(today.getDate() - 5)

    server.use(
      http.get('/api/todos', ({ request }) => {
        const url = new URL(request.url)
        const overdue = url.searchParams.get('overdue')
        if (overdue === 'true') {
          return HttpResponse.json({
            data: [
              { id: 3, user_id: 1, category_id: 1, title: '기한 초과 할일', description: null, due_date: pad(past), is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ],
          })
        }
        return HttpResponse.json({
          data: [
            { id: 1, user_id: 1, category_id: 1, title: '업무 할일', description: null, due_date: pad(future), is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 2, user_id: 1, category_id: 2, title: '개인 할일', description: null, due_date: null, is_completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 3, user_id: 1, category_id: 1, title: '기한 초과 할일', description: null, due_date: pad(past), is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          ],
        })
      })
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/todos']}>
          <AppRouter />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('기한 초과 할일')).toBeInTheDocument()
    }, { timeout: 3000 })

    queryClient.setQueryData(['todos', expect.objectContaining({ overdue: true })], {
      data: [
        { id: 3, user_id: 1, category_id: 1, title: '기한 초과 할일', description: null, due_date: pad(past), is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ],
    })

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/todos']}>
          <AppRouter />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('기한 초과 할일')).toBeInTheDocument()
  })

  it('완료 체크박스 클릭 시 목록 갱신', async () => {
    renderAppAuthenticated('/todos')

    await waitFor(() => {
      expect(screen.getByText('업무 할일')).toBeInTheDocument()
    }, { timeout: 3000 })

    const checkboxes = screen.getAllByRole('checkbox', { name: /완료/ })
    const firstUnchecked = checkboxes.find(cb => !(cb as HTMLInputElement).checked)
    expect(firstUnchecked).toBeDefined()

    fireEvent.click(firstUnchecked!)

    await waitFor(() => {
      expect(screen.getByText('업무 할일')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('빈 목록 시 빈 상태 메시지', async () => {
    server.use(
      http.get('/api/todos', () => {
        return HttpResponse.json({ data: [] })
      })
    )

    renderAppAuthenticated('/todos')

    await waitFor(() => {
      expect(screen.getByText('할일이 없습니다')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('할일 등록 폼 제출 후 /todos로 이동', async () => {
    renderAppAuthenticated('/todos/create')

    await waitFor(() => {
      expect(screen.getByTestId('todo-create-page')).toBeInTheDocument()
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    }, { timeout: 3000 })

    const titleInput = screen.getByPlaceholderText('할일 제목을 입력하세요')
    fireEvent.change(titleInput, { target: { value: '새로운 할일' } })

    const categorySelect = screen.getByRole('combobox')
    fireEvent.change(categorySelect, { target: { value: '1' } })

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('할일 수정 폼 데이터 프리필 + 저장 후 /todos로 이동', async () => {
    renderAppAuthenticated('/todos/1/edit')

    await waitFor(() => {
      expect(screen.getByTestId('todo-edit-page')).toBeInTheDocument()
    }, { timeout: 3000 })

    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('할일 제목을 입력하세요') as HTMLInputElement
      expect(titleInput.value).toBe('수정할 할일')
    }, { timeout: 3000 })

    const titleInput = screen.getByPlaceholderText('할일 제목을 입력하세요')
    fireEvent.change(titleInput, { target: { value: '수정된 할일 제목' } })

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('할일 삭제 모달 확인 후 /todos로 이동', async () => {
    renderAppAuthenticated('/todos/1/edit')

    await waitFor(() => {
      expect(screen.getByTestId('todo-edit-page')).toBeInTheDocument()
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(screen.getByLabelText('삭제')).toBeInTheDocument()
    }, { timeout: 3000 })

    fireEvent.click(screen.getByLabelText('삭제'))

    await waitFor(() => {
      expect(screen.getByText('이 할일을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')).toBeInTheDocument()
    }, { timeout: 3000 })

    const deleteButtons = screen.getAllByRole('button', { name: '삭제' })
    fireEvent.click(deleteButtons[deleteButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('존재하지 않는 할일 수정 시 에러 표시', async () => {
    renderAppAuthenticated('/todos/999/edit')

    await waitFor(() => {
      expect(screen.getByText('할일을 찾을 수 없습니다.')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
