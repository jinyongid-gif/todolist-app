interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  required?: boolean
}

export default function Select({
  label,
  options,
  error,
  required,
  id,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`h-10 border rounded px-3 text-base text-neutral-900 bg-white focus:outline-none transition-colors ${
          error ? 'border-red-500' : 'border-neutral-300 focus:border-primary-500'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
