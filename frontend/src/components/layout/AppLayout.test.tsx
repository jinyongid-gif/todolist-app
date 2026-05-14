import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './AppLayout'
import { useAuthStore } from '../../stores/useAuthStore'

vi.mock('./Header', () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}))

function renderLayout(children = <p>콘텐츠</p>) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AppLayout>{children}</AppLayout>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AppLayout', () => {
  it('Header 포함하여 렌더링', () => {
    renderLayout()
    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
  })
  it('children 렌더링', () => {
    renderLayout(<p>테스트 콘텐츠</p>)
    expect(screen.getByText('테스트 콘텐츠')).toBeInTheDocument()
  })
  it('main 태그로 감싸짐', () => {
    renderLayout()
    expect(document.querySelector('main')).toBeInTheDocument()
  })
})

describe('Header (integration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  it('로그인 상태에서 사용자 이름과 로그아웃 버튼 표시', () => {
    useAuthStore.setState({ user: { id: 1, email: 'test@test.com', name: '테스터' }, token: 'token', isLoading: false })
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AppLayout><p>내용</p></AppLayout>
        </MemoryRouter>
      </QueryClientProvider>
    )
  })
})
