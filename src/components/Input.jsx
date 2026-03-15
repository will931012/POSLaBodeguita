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
        <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-primary-600">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300">
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
              ? 'border-accent-600 focus:border-accent-600 focus:ring-accent-600/20'
              : 'border-primary-200 bg-[#F4F4F4] text-primary-600 focus:border-accent-600',
            'disabled:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm font-medium text-accent-600">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
