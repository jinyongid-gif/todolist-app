import { LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/useAuthStore'

export default function Header() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  function handleLogout() {
    useAuthStore.getState().logout()
    queryClient.clear()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-800 shadow-sm h-[60px] flex items-center px-4 md:px-6">
      <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between">
        <Link to="/todos" className="text-xl font-bold text-primary-700">
          TodoList
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{user.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              aria-label="로그아웃"
            >
              <LogOut size={18} strokeWidth={1.5} />
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 transition-colors">
              로그인
            </Link>
            <Link to="/register" className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded transition-colors">
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
