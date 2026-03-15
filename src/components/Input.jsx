import { clsx } from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-3 rounded-xl border-2 font-medium',
            'transition-all duration-200',
            'focus:outline-none input-focus',
            Icon && 'pl-11',
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-200 focus:border-primary-600',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
