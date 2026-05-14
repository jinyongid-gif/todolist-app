import { render } from '@testing-library/react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import AppRouter from '../router/AppRouter'
import { useAuthStore } from '../stores/useAuthStore'

function renderApp(initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  useAuthStore.setState({ user: null, token: null, isLoading: false })
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

describe('Auth Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isLoading: false })
  })

  it('회원가입 성공 후 /login으로 이동', async () => {
    renderApp('/register')

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'new@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('이메일 중복 시 에러 메시지 표시', async () => {
    renderApp('/register')

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'duplicate@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('로그인 성공 후 /todos로 이동 + token 저장', async () => {
    renderApp('/login')

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(useAuthStore.getState().token).toBe('mock-access-token')
  })

  it('잘못된 비밀번호 시 에러 메시지 표시', async () => {
    renderApp('/login')

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('로그인 없이 /todos 접근 시 /login으로 리다이렉트', () => {
    renderApp('/todos')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('로그인 상태에서 /login 접근 시 /todos로 리다이렉트', async () => {
    renderAppAuthenticated('/login')

    await waitFor(() => {
      expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('로그아웃 시 token null + /login 이동', async () => {
    renderAppAuthenticated('/todos')

    await waitFor(() => {
      expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
    }, { timeout: 3000 })

    fireEvent.click(screen.getByLabelText('로그아웃'))

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(useAuthStore.getState().token).toBeNull()
  })
})
