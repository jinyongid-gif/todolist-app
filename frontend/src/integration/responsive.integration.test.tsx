import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}

describe('Responsive Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isLoading: false })
  })

  afterEach(() => {
    setViewport(1024)
  })

  describe('375px 뷰포트', () => {
    beforeEach(() => {
      setViewport(375)
    })

    it('로그인 페이지 렌더링', () => {
      renderApp('/login')
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('회원가입 페이지 렌더링', () => {
      renderApp('/register')
      expect(screen.getByTestId('register-page')).toBeInTheDocument()
    })

    it('할일 목록 페이지 렌더링', async () => {
      renderAppAuthenticated('/todos')
      await waitFor(() => {
        expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('할일 생성 페이지 렌더링', async () => {
      renderAppAuthenticated('/todos/create')
      await waitFor(() => {
        expect(screen.getByTestId('todo-create-page')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('할일 수정 페이지 렌더링', async () => {
      renderAppAuthenticated('/todos/1/edit')
      await waitFor(() => {
        expect(screen.getByTestId('todo-edit-page')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('1280px 뷰포트', () => {
    beforeEach(() => {
      setViewport(1280)
    })

    it('로그인 페이지 렌더링', () => {
      renderApp('/login')
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('회원가입 페이지 렌더링', () => {
      renderApp('/register')
      expect(screen.getByTestId('register-page')).toBeInTheDocument()
    })

    it('할일 목록 페이지 렌더링', async () => {
      renderAppAuthenticated('/todos')
      await waitFor(() => {
        expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('할일 생성 페이지 렌더링', async () => {
      renderAppAuthenticated('/todos/create')
      await waitFor(() => {
        expect(screen.getByTestId('todo-create-page')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('할일 수정 페이지 렌더링', async () => {
      renderAppAuthenticated('/todos/1/edit')
      await waitFor(() => {
        expect(screen.getByTestId('todo-edit-page')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })
})
