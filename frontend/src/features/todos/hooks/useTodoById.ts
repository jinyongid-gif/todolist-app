import { useQuery } from '@tanstack/react-query'
import { getTodoById } from '../../../api/todos.api'

export function useTodoById(id: number) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => getTodoById(id),
    enabled: !!id,
  })
}
