import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from '@testing-library/react'
import RegisterPage from './RegisterPage'
import { useAuthStore } from '../stores/useAuthStore'

vi.mock('../api/auth.api', () => ({
  register: vi.fn(),
  login: vi.fn(),
}))

import { register } from '../api/auth.api'

function renderRegisterPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  act(() => { useAuthStore.setState({ user: null, token: null, isLoading: false }) })
  vi.clearAllMocks()
})

describe('RegisterPage', () => {
  it('이름·이메일·비밀번호 입력 필드와 회원가입 버튼이 존재한다', () => {
    renderRegisterPage()
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument()
  })

  it('로그인 링크가 존재한다', () => {
    renderRegisterPage()
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument()
  })

  it('이름 미입력 시 에러 메시지가 표시된다', async () => {
    renderRegisterPage()
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))
    await waitFor(() => {
      expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('이메일 미입력 시 에러 메시지가 표시된다', async () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.click(screen.getByRole('button', { name: '회원가입' } ))
    await waitFor(() => {
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('비밀번호 미입력 시 에러 메시지가 표시된다', async () => {
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))
    await waitFor(() => {
      expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('이미 사용 중인 이메일(409) 에러 메시지가 표시된다', async () => {
    const err = new Error('이미 사용 중인 이메일입니다.')
    ;(err as any).status = 409
    vi.mocked(register).mockRejectedValueOnce(err)
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'dup@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))
    await waitFor(() => {
      expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument()
    })
  })

  it('회원가입 성공 시 register API가 올바른 payload로 호출된다', async () => {
    vi.mocked(register).mockResolvedValueOnce({ id: 1, email: 'test@example.com', name: '홍길동' })
    renderRegisterPage()
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: '홍길동',
      })
    })
  })
})
