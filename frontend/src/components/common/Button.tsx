import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

const variantClasses = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  secondary: 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
      {children}
    </button>
  )
}
