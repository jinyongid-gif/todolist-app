interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
}

export default function Input({
  label,
  error,
  required,
  id,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`h-10 border rounded px-3 py-2.5 text-base text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors ${
          error ? 'border-red-500' : 'border-neutral-300 focus:border-primary-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
