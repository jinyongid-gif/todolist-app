import { Calendar } from 'lucide-react'
import { isOverdue } from '../../../utils/date.utils'
import type { Todo } from '../../../types/todo.types'
import type { Category } from '../../../types/category.types'

interface TodoCardProps {
  todo: Todo
  category?: Category
  onToggle: (id: number) => void
  onEdit: (id: number) => void
}

export default function TodoCard({ todo, category, onToggle, onEdit }: TodoCardProps) {
  const overdue = isOverdue(todo.due_date, todo.is_completed)
  return (
    <div
      className="bg-white rounded-xl shadow-sm px-6 py-5 hover:shadow hover:-translate-y-px transition-all duration-200 cursor-pointer"
      onClick={() => onEdit(todo.id)}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.is_completed}
          onChange={() => onToggle(todo.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 h-[18px] w-[18px] rounded border-2 border-neutral-300 accent-primary-600 cursor-pointer flex-shrink-0"
          aria-label={todo.is_completed ? '완료 취소' : '완료 표시'}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-base font-medium ${todo.is_completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
            {todo.title}
          </p>
          {todo.description && (
            <p className="text-sm text-neutral-500 mt-0.5 truncate">{todo.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {category && (
              <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {category.name}
              </span>
            )}
            {todo.due_date && (
              <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500' : todo.is_completed ? 'text-neutral-400 line-through' : 'text-neutral-500'}`}>
                <Calendar size={14} strokeWidth={1.5} />
                {todo.due_date}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
