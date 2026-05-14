import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Select from './Select'

const options = [
  { value: '', label: '선택하세요' },
  { value: '1', label: '업무' },
  { value: '2', label: '개인' },
]

describe('Select', () => {
  it('options 렌더링', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '업무' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '개인' })).toBeInTheDocument()
  })
  it('label 표시', () => {
    render(<Select id="cat" label="카테고리" options={options} />)
    expect(screen.getByText('카테고리')).toBeInTheDocument()
  })
  it('required 시 * 표시', () => {
    render(<Select id="cat" label="카테고리" options={options} required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })
  it('error prop 시 에러 메시지', () => {
    render(<Select options={options} error="선택해주세요." />)
    expect(screen.getByText('선택해주세요.')).toBeInTheDocument()
  })
  it('error prop 시 border-red-500', () => {
    render(<Select options={options} error="에러" />)
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500')
  })
  it('error 없을 때 border-neutral-300', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('combobox')).toHaveClass('border-neutral-300')
  })
})
