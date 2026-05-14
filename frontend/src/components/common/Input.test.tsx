import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Input from './Input'

describe('Input', () => {
  it('기본 렌더링', () => {
    render(<Input id="test" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
  it('label prop 표시', () => {
    render(<Input id="email" label="이메일" />)
    expect(screen.getByText('이메일')).toBeInTheDocument()
  })
  it('required prop 시 * 표시', () => {
    render(<Input id="email" label="이메일" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })
  it('error prop 시 에러 메시지 표시', () => {
    render(<Input id="email" error="이메일을 입력해주세요." />)
    expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
  })
  it('error prop 시 border-red-500 클래스 적용', () => {
    render(<Input id="email" error="에러" />)
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500')
  })
  it('error 없을 때 border-neutral-300 클래스 적용', () => {
    render(<Input id="email" />)
    expect(screen.getByRole('textbox')).toHaveClass('border-neutral-300')
  })
  it('label htmlFor 연결', () => {
    render(<Input id="email" label="이메일" />)
    const label = screen.getByText('이메일').closest('label')
    expect(label).toHaveAttribute('for', 'email')
  })
  it('placeholder 표시', () => {
    render(<Input id="name" placeholder="이름 입력" />)
    expect(screen.getByPlaceholderText('이름 입력')).toBeInTheDocument()
  })
})
