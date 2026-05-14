import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toggleComplete, createTodo, updateTodo, deleteTodo } from '../../../api/todos.api'
import type { CreateTodoDto, UpdateTodoDto } from '../../../types/todo.types'

export function useTodoMutations() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const invalidateTodos = () => queryClient.invalidateQueries({ queryKey: ['todos'] })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleComplete(id),
    onSuccess: () => invalidateTodos(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateTodoDto) => createTodo(payload),
    onSuccess: () => {
      invalidateTodos()
      navigate('/todos')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTodoDto }) => updateTodo(id, payload),
    onSuccess: () => {
      invalidateTodos()
      navigate('/todos')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onSuccess: () => {
      invalidateTodos()
      navigate('/todos')
    },
  })

  return { toggleMutation, createMutation, updateMutation, deleteMutation }
}
