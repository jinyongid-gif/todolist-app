import { apiFetch } from './client'
import type { Todo, TodoFilters, CreateTodoDto, UpdateTodoDto } from '../types/todo.types'

export async function getTodos(filters?: TodoFilters): Promise<{ data: Todo[] }> {
  const params = new URLSearchParams()
  if (filters?.category_id !== undefined) params.set('category_id', String(filters.category_id))
  if (filters?.is_completed !== undefined) params.set('is_completed', String(filters.is_completed))
  if (filters?.overdue) params.set('overdue', 'true')
  const qs = params.toString()
  return apiFetch(`/api/todos${qs ? `?${qs}` : ''}`)
}

export async function toggleComplete(id: number): Promise<Todo> {
  return apiFetch(`/api/todos/${id}/complete`, { method: 'PATCH' })
}

export async function getTodoById(id: number): Promise<Todo> {
  return apiFetch(`/api/todos/${id}`)
}

export async function createTodo(payload: CreateTodoDto): Promise<Todo> {
  return apiFetch('/api/todos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTodo(id: number, payload: UpdateTodoDto): Promise<Todo> {
  return apiFetch(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteTodo(id: number): Promise<void> {
  return apiFetch(`/api/todos/${id}`, { method: 'DELETE' })
}
