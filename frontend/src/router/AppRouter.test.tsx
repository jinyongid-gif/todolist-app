import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../stores/useAuthStore'
import AppRouter from './AppRouter'

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ user: null, token: null, isLoading: false })
  })
})

function renderWithRouter(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AppRouter - PrivateRoute', () => {
  it('비인증 사용자가 /todos 접근 시 login 페이지로 리다이렉트된다', () => {
    renderWithRouter('/todos')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('비인증 사용자가 /todos/create 접근 시 login 페이지로 리다이렉트된다', () => {
    renderWithRouter('/todos/create')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('비인증 사용자가 /todos/1/edit 접근 시 login 페이지로 리다이렉트된다', () => {
    renderWithRouter('/todos/1/edit')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('인증된 사용자는 /todos에 접근 가능하다', () => {
    act(() => { useAuthStore.getState().setToken('valid-token') })
    renderWithRouter('/todos')
    expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
  })

  it('인증된 사용자는 /todos/create에 접근 가능하다', () => {
    act(() => { useAuthStore.getState().setToken('valid-token') })
    renderWithRouter('/todos/create')
    expect(screen.getByTestId('todo-create-page')).toBeInTheDocument()
  })
})

describe('AppRouter - PublicOnlyRoute', () => {
  it('비인증 사용자는 /login에 접근 가능하다', () => {
    renderWithRouter('/login')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('비인증 사용자는 /register에 접근 가능하다', () => {
    renderWithRouter('/register')
    expect(screen.getByTestId('register-page')).toBeInTheDocument()
  })

  it('인증된 사용자가 /login 접근 시 /todos로 리다이렉트된다', () => {
    act(() => { useAuthStore.getState().setToken('valid-token') })
    renderWithRouter('/login')
    expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
  })

  it('인증된 사용자가 /register 접근 시 /todos로 리다이렉트된다', () => {
    act(() => { useAuthStore.getState().setToken('valid-token') })
    renderWithRouter('/register')
    expect(screen.getByTestId('todo-list-page')).toBeInTheDocument()
  })
})

describe('AppRouter - 기본 경로', () => {
  it('/ 접근 시 /login으로 리다이렉트된다', () => {
    renderWithRouter('/')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })
})
