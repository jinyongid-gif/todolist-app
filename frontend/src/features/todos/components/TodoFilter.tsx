import type { Category } from '../../../types/category.types'
import type { TodoFilters } from '../../../types/todo.types'
import { COMPLETION_FILTER_OPTIONS } from '../../../constants/filter.constants'

interface TodoFilterProps {
  categories: Category[]
  filters: TodoFilters
  onFiltersChange: (filters: TodoFilters) => void
}

export default function TodoFilter({ categories, filters, onFiltersChange }: TodoFilterProps) {
  const handleCategoryClick = (id: number | undefined) => {
    onFiltersChange({ ...filters, category_id: id })
  }
  const handleCompletionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    onFiltersChange({
      ...filters,
      is_completed: val === '' ? undefined : val === 'true',
    })
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => handleCategoryClick(undefined)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.category_id === undefined ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.category_id === cat.id ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">완료 상태</span>
          <select
            value={filters.is_completed === undefined ? '' : String(filters.is_completed)}
            onChange={handleCompletionChange}
            className="h-10 rounded border border-neutral-300 dark:border-neutral-600 px-3 text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 focus:outline-none focus:border-primary-500"
          >
            {COMPLETION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">종료예정일</span>
          <div className="flex items-center gap-1">
            <input
              id="filter-due-date-from"
              type="date"
              aria-label="종료예정일 시작"
              value={filters.due_date_from ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, due_date_from: e.target.value || undefined })}
              className="h-10 rounded border border-neutral-300 dark:border-neutral-600 px-3 text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 focus:outline-none focus:border-primary-500"
            />
            <span className="text-sm text-neutral-400 dark:text-neutral-500">~</span>
            <input
              id="filter-due-date-to"
              type="date"
              aria-label="종료예정일 종료"
              value={filters.due_date_to ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, due_date_to: e.target.value || undefined })}
              className="h-10 rounded border border-neutral-300 dark:border-neutral-600 px-3 text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none mt-4">
          <input
            type="checkbox"
            checked={filters.overdue === true}
            onChange={(e) => onFiltersChange({ ...filters, overdue: e.target.checked || undefined })}
            className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 accent-primary-600 cursor-pointer"
          />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">기한 초과</span>
        </label>
      </div>
    </div>
  )
}
