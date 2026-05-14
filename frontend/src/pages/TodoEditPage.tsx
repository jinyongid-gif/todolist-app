import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCategories } from '../features/categories/hooks/useCategories'
import { useTodoMutations } from '../features/todos/hooks/useTodoMutations'
import { useTodoById } from '../features/todos/hooks/useTodoById'

export default function TodoEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const todoId = Number(id)

  const { data: todo, isLoading: todoLoading, isError } = useTodoById(todoId)
  const { data: categories = [] } = useCategories()
  const { updateMutation, deleteMutation } = useTodoMutations()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [titleError, setTitleError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [serverError, setServerError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description ?? '')
      setDueDate(todo.due_date ?? '')
      setCategoryId(String(todo.category_id))
    }
  }, [todo])

  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center" data-testid="todo-edit-page">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">할일을 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/todos')} className="text-primary-600 hover:underline text-sm">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  function validate() {
    let valid = true
    if (!title.trim()) { setTitleError('제목을 입력해주세요.'); valid = false } else setTitleError('')
    if (!categoryId) { setCategoryError('카테고리를 선택해주세요.'); valid = false } else setCategoryError('')
    return valid
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setServerError('')
    updateMutation.mutate(
      {
        id: todoId,
        payload: {
          title: title.trim(),
          category_id: Number(categoryId),
          description: description.trim() || undefined,
          due_date: dueDate || undefined,
        },
      },
      {
        onError: (err: unknown) => {
          setServerError(err instanceof Error ? err.message : '서버 오류가 발생했습니다.')
        },
      }
    )
  }

  function handleDelete() {
    deleteMutation.mutate(todoId, {
      onError: (err: unknown) => {
        setShowDeleteModal(false)
        setServerError(err instanceof Error ? err.message : '서버 오류가 발생했습니다.')
      },
    })
  }

  return (
    <div className="min-h-screen bg-neutral-100" data-testid="todo-edit-page">
      <header className="sticky top-0 z-50 bg-white shadow-sm h-[60px] flex items-center px-4 md:px-6">
        <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/todos')}
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <span className="text-base font-semibold text-neutral-900">할일 수정</span>
          </div>
        </div>
      </header>

      <main className="pt-6 pb-10 px-4 md:px-6">
        <div className="w-full max-w-[720px] mx-auto">
          {todoLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loader2 size={40} className="animate-spin text-primary-500" strokeWidth={1.5} />
            </div>
          ) : (
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="edit-due-date">종료예정일</label>
                  <input
                    id="edit-due-date"
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
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleteMutation.isPending}
                    aria-label="삭제"
                    className="h-10 px-4 border border-red-300 text-red-500 hover:bg-red-50 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/todos')}
                    className="flex-1 h-10 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded text-sm font-medium transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updateMutation.isPending && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
                    저장
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">할일 삭제</h2>
            <p className="text-sm text-neutral-500 mb-6">이 할일을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded text-sm font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
