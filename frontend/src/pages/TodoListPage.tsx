import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, ClipboardList, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/useAuthStore'
import { useTodos } from '../features/todos/hooks/useTodos'
import { useTodoMutations } from '../features/todos/hooks/useTodoMutations'
import { useCategories } from '../features/categories/hooks/useCategories'
import TodoCard from '../features/todos/components/TodoCard'
import TodoFilter from '../features/todos/components/TodoFilter'
import type { TodoFilters } from '../types/todo.types'

export default function TodoListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [filters, setFilters] = useState<TodoFilters>(() => {
    const today = new Date()
    const pad = (d: Date) => d.toISOString().slice(0, 10)
    const from = new Date(today); from.setDate(today.getDate() - 20)
    const to = new Date(today); to.setDate(today.getDate() + 20)
    return { due_date_from: pad(from), due_date_to: pad(to) }
  })

  const { data: rawTodos = [], isLoading: todosLoading } = useTodos(filters)
  const { data: categories = [] } = useCategories()
  const { toggleMutation } = useTodoMutations()

  const todos = rawTodos.filter((t) => {
    if (t.due_date) {
      if (filters.due_date_from && t.due_date < filters.due_date_from) return false
      if (filters.due_date_to && t.due_date > filters.due_date_to) return false
    }
    return true
  })

  function handleLogout() {
    useAuthStore.getState().logout()
    queryClient.clear()
    navigate('/login')
  }

  return (
    <div data-testid="todo-list-page" className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-50 bg-white shadow-sm h-[60px] flex items-center px-4 md:px-6">
        <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-primary-700">TodoList</span>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-neutral-700">{user.name}</span>}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              aria-label="로그아웃"
            >
              <LogOut size={18} strokeWidth={1.5} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="pt-6 pb-24 px-4 md:px-6">
        <div className="w-full max-w-[720px] mx-auto flex flex-col gap-4">
          <TodoFilter
            categories={categories}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {todosLoading ? (
            <div className="flex justify-center items-center min-h-[240px]">
              <Loader2 size={40} className="animate-spin text-primary-500" strokeWidth={1.5} />
            </div>
          ) : todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[240px] gap-3">
              <ClipboardList size={64} className="text-neutral-300" strokeWidth={1.5} />
              <p className="text-lg text-neutral-500">할일이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {todos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  category={categories.find((c) => c.id === todo.category_id)}
                  onToggle={(id) => toggleMutation.mutate(id)}
                  onEdit={(id) => navigate(`/todos/${id}/edit`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <button
        onClick={() => navigate('/todos/create')}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-colors"
        aria-label="새 할일 추가"
      >
        <Plus size={24} strokeWidth={1.5} />
      </button>
    </div>
  )
}
