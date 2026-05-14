import { useQuery } from '@tanstack/react-query'
import { getTodos } from '../../../api/todos.api'
import type { TodoFilters } from '../../../types/todo.types'

export function useTodos(filters?: TodoFilters) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => getTodos(filters),
    select: (res) => res.data,
  })
}
