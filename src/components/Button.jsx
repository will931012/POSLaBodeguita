import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-primary-950 text-white shadow-lg shadow-black/20 hover:bg-primary-800 hover:shadow-xl hover:shadow-black/25',
  secondary: 'bg-accent-600 text-white shadow-lg shadow-accent-600/30 hover:bg-accent-700 hover:shadow-xl hover:shadow-accent-700/30',
  danger: 'bg-accent-600 text-white shadow-lg shadow-accent-600/30 hover:bg-accent-700 hover:shadow-xl hover:shadow-accent-700/30',
  outline: 'border-2 border-primary-200 text-primary-600 hover:border-accent-600 hover:bg-accent-50 hover:text-accent-700',
  ghost: 'text-primary-600 hover:bg-primary-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-4 focus:ring-primary-500/20',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </motion.button>
  )
}
