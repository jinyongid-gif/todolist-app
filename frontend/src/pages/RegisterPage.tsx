import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useRegisterMutation } from '../features/auth/hooks/useAuthMutation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{
    email?: string; password?: string; name?: string; form?: string
  }>({})
  const registerMutation = useRegisterMutation()

  function validate() {
    const newErrors: typeof errors = {}
    if (!name.trim()) newErrors.name = '이름을 입력해주세요.'
    if (!email.trim()) newErrors.email = '이메일을 입력해주세요.'
    if (!password) newErrors.password = '비밀번호를 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setErrors({})
    registerMutation.mutate(
      { email: email.trim(), password, name: name.trim() },
      {
        onError: (err: any) => {
          setErrors({ form: err.message || '회원가입 중 오류가 발생했습니다.' })
        },
      }
    )
  }

  return (
    <div data-testid="register-page" className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">TodoList</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">새 계정을 만들어 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className={`w-full h-10 px-3 py-2 text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 border rounded-lg outline-none transition-colors
                placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'}
                focus:shadow-focus`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`w-full h-10 px-3 py-2 text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 border rounded-lg outline-none transition-colors
                placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'}
                focus:shadow-focus`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500" role="alert">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className={`w-full h-10 px-3 py-2 text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 border rounded-lg outline-none transition-colors
                placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'}
                focus:shadow-focus`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500" role="alert">{errors.password}</p>
            )}
          </div>

          {errors.form && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600" role="alert">{errors.form}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full h-10 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-medium rounded-lg transition-colors mt-2"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden />
                처리 중...
              </>
            ) : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
