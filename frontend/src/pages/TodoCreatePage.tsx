import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCategories } from '../features/categories/hooks/useCategories'
import { useTodoMutations } from '../features/todos/hooks/useTodoMutations'

export default function TodoCreatePage() {
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()
  const { createMutation } = useTodoMutations()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [titleError, setTitleError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [serverError, setServerError] = useState('')

  function validate() {
    let valid = true
    if (!title.trim()) { setTitleError('제목을 입력해주세요.'); valid = false } else setTitleError('')
    if (!categoryId) { setCategoryError('카테고리를 선택해주세요.'); valid = false } else setCategoryError('')
    return valid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setServerError('')
    createMutation.mutate(
      {
        title: title.trim(),
        category_id: Number(categoryId),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
      },
      {
        onError: (err: unknown) => {
          setServerError(err instanceof Error ? err.message : '서버 오류가 발생했습니다.')
        },
      }
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100" data-testid="todo-create-page">
      <header className="sticky top-0 z-50 bg-white shadow-sm h-[60px] flex items-center px-4 md:px-6">
        <div className="w-full max-w-[1200px] mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/todos')}
            className="text-neutral-500 hover:text-neutral-900 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <span className="text-base font-semibold text-neutral-900">새 할일</span>
        </div>
      </header>

      <main className="pt-6 pb-10 px-4 md:px-6">
        <div className="w-full max-w-[720px] mx-auto">
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="할일 제목을 입력하세요"
                  className={`w-full h-10 border rounded px-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary-500 transition-colors ${titleError ? 'border-red-500' : 'border-neutral-300'}`}
                />
                {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="상세 설명을 입력하세요 (선택)"
                  rows={3}
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`w-full h-10 border rounded px-3 text-sm text-neutral-900 focus:outline-none focus:border-primary-500 transition-colors bg-white ${categoryError ? 'border-red-500' : 'border-neutral-300'}`}
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {categoryError && <p className="text-xs text-red-500 mt-1">{categoryError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="due-date">종료예정일</label>
                <input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 border border-neutral-300 rounded px-3 text-sm text-neutral-900 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {serverError && <p className="text-sm text-red-500">{serverError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/todos')}
                  className="flex-1 h-10 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded text-sm font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createMutation.isPending && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
                  저장
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
