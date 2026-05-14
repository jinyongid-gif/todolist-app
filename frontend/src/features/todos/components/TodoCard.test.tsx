import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TodoCard from './TodoCard'
import type { Todo } from '../../../types/todo.types'
import type { Category } from '../../../types/category.types'

const baseTodo: Todo = {
  id: 1, user_id: 1, category_id: 1,
  title: '테스트 할일', description: undefined,
  due_date: undefined, is_completed: false,
  created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
}
const category: Category = { id: 1, name: '업무', is_default: true }

describe('TodoCard', () => {
  it('제목 표시', () => {
    render(<TodoCard todo={baseTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('테스트 할일')).toBeInTheDocument()
  })
  it('카테고리 태그 표시', () => {
    render(<TodoCard todo={baseTodo} category={category} onToggle={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('업무')).toBeInTheDocument()
  })
  it('완료된 할일은 제목에 line-through 스타일', () => {
    const completedTodo = { ...baseTodo, is_completed: true }
    render(<TodoCard todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('테스트 할일')).toHaveClass('line-through')
  })
  it('체크박스 클릭 시 onToggle 호출', () => {
    const onToggle = vi.fn()
    render(<TodoCard todo={baseTodo} onToggle={onToggle} onEdit={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(1)
  })
  it('카드 클릭 시 onEdit 호출', () => {
    const onEdit = vi.fn()
    render(<TodoCard todo={baseTodo} onToggle={vi.fn()} onEdit={onEdit} />)
    fireEvent.click(screen.getByText('테스트 할일'))
    expect(onEdit).toHaveBeenCalledWith(1)
  })
  it('체크박스 클릭 시 onEdit 미호출 (전파 방지)', () => {
    const onEdit = vi.fn()
    render(<TodoCard todo={baseTodo} onToggle={vi.fn()} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onEdit).not.toHaveBeenCalled()
  })
  it('기한 날짜 표시', () => {
    const todoWithDate = { ...baseTodo, due_date: '2026-05-20' }
    render(<TodoCard todo={todoWithDate} onToggle={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('2026-05-20')).toBeInTheDocument()
  })
  it('기한 초과 시 red-500 클래스', () => {
    const overdueTodo = { ...baseTodo, due_date: '2020-01-01' }
    render(<TodoCard todo={overdueTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    const dateSpan = screen.getByText('2020-01-01').closest('span')
    expect(dateSpan).toHaveClass('text-red-500')
  })
  it('설명 표시', () => {
    const todoWithDesc = { ...baseTodo, description: '상세 설명' }
    render(<TodoCard todo={todoWithDesc} onToggle={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('상세 설명')).toBeInTheDocument()
  })
})
