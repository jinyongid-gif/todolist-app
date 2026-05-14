import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTodos, toggleComplete, getTodoById, createTodo, updateTodo, deleteTodo } from './todos.api'

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from './client'
const mockApiFetch = vi.mocked(apiFetch)

beforeEach(() => { mockApiFetch.mockReset() })

describe('getTodos', () => {
  it('필터 없이 /api/todos 호출', async () => {
    mockApiFetch.mockResolvedValue({ data: [] })
    await getTodos()
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos')
  })
  it('category_id 필터 포함하여 호출', async () => {
    mockApiFetch.mockResolvedValue({ data: [] })
    await getTodos({ category_id: 1 })
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos?category_id=1')
  })
  it('is_completed 필터 포함하여 호출', async () => {
    mockApiFetch.mockResolvedValue({ data: [] })
    await getTodos({ is_completed: false })
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos?is_completed=false')
  })
  it('overdue 필터 포함하여 호출', async () => {
    mockApiFetch.mockResolvedValue({ data: [] })
    await getTodos({ overdue: true })
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos?overdue=true')
  })
  it('여러 필터 동시 적용', async () => {
    mockApiFetch.mockResolvedValue({ data: [] })
    await getTodos({ category_id: 2, is_completed: true })
    const call = mockApiFetch.mock.calls[0][0] as string
    expect(call).toContain('category_id=2')
    expect(call).toContain('is_completed=true')
  })
})

describe('toggleComplete', () => {
  it('PATCH /api/todos/:id/complete 호출', async () => {
    mockApiFetch.mockResolvedValue({ id: 1, is_completed: true })
    await toggleComplete(1)
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos/1/complete', { method: 'PATCH' })
  })
})

describe('getTodoById', () => {
  it('/api/todos/:id GET 호출', async () => {
    mockApiFetch.mockResolvedValue({ id: 1, title: '테스트' })
    await getTodoById(1)
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos/1')
  })
})

describe('createTodo', () => {
  it('/api/todos POST 호출', async () => {
    const payload = { title: '청소', category_id: 1 }
    mockApiFetch.mockResolvedValue({ id: 1, ...payload })
    await createTodo(payload)
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos', { method: 'POST', body: JSON.stringify(payload) })
  })
})

describe('updateTodo', () => {
  it('/api/todos/:id PUT 호출', async () => {
    const payload = { title: '청소2', category_id: 1 }
    mockApiFetch.mockResolvedValue({ id: 1, ...payload })
    await updateTodo(1, payload)
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos/1', { method: 'PUT', body: JSON.stringify(payload) })
  })
})

describe('deleteTodo', () => {
  it('/api/todos/:id DELETE 호출', async () => {
    mockApiFetch.mockResolvedValue(undefined)
    await deleteTodo(1)
    expect(mockApiFetch).toHaveBeenCalledWith('/api/todos/1', { method: 'DELETE' })
  })
})
