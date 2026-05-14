import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TodoFilter from './TodoFilter'
import type { Category } from '../../../types/category.types'

const categories: Category[] = [
  { id: 1, name: '업무', is_default: true },
  { id: 2, name: '개인', is_default: false },
]

describe('TodoFilter', () => {
  it('전체 버튼 및 카테고리 버튼 표시', () => {
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByText('업무')).toBeInTheDocument()
    expect(screen.getByText('개인')).toBeInTheDocument()
  })
  it('카테고리 클릭 시 category_id 필터 업데이트', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={onFiltersChange} />)
    fireEvent.click(screen.getByText('업무'))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ category_id: 1 }))
  })
  it('전체 클릭 시 category_id undefined', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{ category_id: 1 }} onFiltersChange={onFiltersChange} />)
    fireEvent.click(screen.getByRole('button', { name: '전체' }))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ category_id: undefined }))
  })
  it('완료 상태 select 변경', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={onFiltersChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'true' } })
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ is_completed: true }))
  })
  it('미완료 필터 선택', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={onFiltersChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'false' } })
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ is_completed: false }))
  })
  it('기한 초과 체크박스 표시', () => {
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={vi.fn()} />)
    expect(screen.getByLabelText('기한 초과')).toBeInTheDocument()
  })
  it('기한 초과 체크 시 overdue: true 전달', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={onFiltersChange} />)
    fireEvent.click(screen.getByLabelText('기한 초과'))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ overdue: true }))
  })
  it('기한 초과 체크 해제 시 overdue: undefined 전달', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{ overdue: true }} onFiltersChange={onFiltersChange} />)
    fireEvent.click(screen.getByLabelText('기한 초과'))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ overdue: undefined }))
  })
  it('완료 상태 레이블 표시', () => {
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={vi.fn()} />)
    expect(screen.getByText('완료 상태')).toBeInTheDocument()
  })
  it('종료예정일 범위 입력 표시', () => {
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={vi.fn()} />)
    expect(screen.getByText('종료예정일')).toBeInTheDocument()
    expect(screen.getByLabelText('종료예정일 시작')).toBeInTheDocument()
    expect(screen.getByLabelText('종료예정일 종료')).toBeInTheDocument()
  })
  it('종료예정일 시작 입력 시 due_date_from 업데이트', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={onFiltersChange} />)
    fireEvent.change(screen.getByLabelText('종료예정일 시작'), { target: { value: '2026-01-01' } })
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ due_date_from: '2026-01-01' }))
  })
  it('종료예정일 종료 입력 시 due_date_to 업데이트', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{}} onFiltersChange={onFiltersChange} />)
    fireEvent.change(screen.getByLabelText('종료예정일 종료'), { target: { value: '2026-12-31' } })
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ due_date_to: '2026-12-31' }))
  })
  it('종료예정일 시작 초기화 시 due_date_from undefined 전달', () => {
    const onFiltersChange = vi.fn()
    render(<TodoFilter categories={categories} filters={{ due_date_from: '2026-01-01' }} onFiltersChange={onFiltersChange} />)
    fireEvent.change(screen.getByLabelText('종료예정일 시작'), { target: { value: '' } })
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ due_date_from: undefined }))
  })
})
