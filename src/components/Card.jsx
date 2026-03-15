import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export default function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  hover = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden',
        hover && 'card-hover',
        className
      )}
      {...props}
    >
      {(title || Icon) && (
        <div className={clsx(
          'px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white',
          headerClassName
        )}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className={clsx('p-6', bodyClassName)}>
        {children}
      </div>
    </motion.div>
  )
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp = true,
  color = 'primary',
  className = '' 
}) {
  const colorClasses = {
    primary: {
      icon: 'gradient-primary',
      text: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    success: {
      icon: 'gradient-success',
      text: 'text-success-600',
      bg: 'bg-success-50',
    },
    accent: {
      icon: 'gradient-accent',
      text: 'text-accent-600',
      bg: 'bg-accent-50',
    },
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      className={clsx(
        'bg-white rounded-2xl shadow-lg border border-gray-100 p-6',
        'transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className={clsx('text-4xl font-bold font-mono', colors.text)}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={clsx(
                'text-sm font-semibold',
                trendUp ? 'text-success-600' : 'text-red-600'
              )}>
                {trendUp ? '↑' : '↓'} {trend}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={clsx(
            'w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg',
            colors.icon
          )}>
            <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
