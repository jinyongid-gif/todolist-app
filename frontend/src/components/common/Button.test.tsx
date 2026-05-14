import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from './Button'

describe('Button', () => {
  it('children 텍스트 렌더링', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })
  it('primary variant 기본값', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600')
  })
  it('secondary variant', () => {
    render(<Button variant="secondary">취소</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-neutral-300')
  })
  it('danger variant', () => {
    render(<Button variant="danger">삭제</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-500')
  })
  it('sm size', () => {
    render(<Button size="sm">small</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')
  })
  it('lg size', () => {
    render(<Button size="lg">large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-12')
  })
  it('isLoading=true 시 버튼 비활성화', () => {
    render(<Button isLoading>저장</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
  it('isLoading=true 시 Loader2 아이콘(animate-spin) 표시', () => {
    render(<Button isLoading>저장</Button>)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
  it('disabled=true 시 버튼 비활성화', () => {
    render(<Button disabled>저장</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
  it('클릭 이벤트 호출', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  it('disabled 시 클릭 이벤트 미호출', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>클릭</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
