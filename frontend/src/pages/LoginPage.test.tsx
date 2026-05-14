import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from '@testing-library/react'
import LoginPage from './LoginPage'
import { useAuthStore } from '../stores/useAuthStore'

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
}))

import { login } from '../api/auth.api'

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  act(() => { useAuthStore.setState({ user: null, token: null, isLoading: false }) })
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  it('이메일·비밀번호 입력 필드와 로그인 버튼이 존재한다', () => {
    renderLoginPage()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('회원가입 링크가 존재한다', () => {
    renderLoginPage()
    expect(screen.getByRole('link', { name: '회원가입' })).toBeInTheDocument()
  })

  it('이메일 미입력 시 에러 메시지가 표시된다', async () => {
    renderLoginPage()
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => {
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('비밀번호 미입력 시 에러 메시지가 표시된다', async () => {
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => {
      expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('로그인 실패 시 에러 메시지가 표시된다', async () => {
    vi.mocked(login).mockRejectedValueOnce(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'))
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => {
      expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument()
    })
  })

  it('로그인 성공 시 token과 user가 스토어에 저장된다', async () => {
    vi.mocked(login).mockResolvedValueOnce({
      access_token: 'test-token',
      user: { id: 1, email: 'test@example.com', name: '홍길동' },
    })
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('test-token')
      expect(useAuthStore.getState().user?.email).toBe('test@example.com')
    })
  })
})
