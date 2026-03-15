import { motion } from 'framer-motion'
import Card from '@components/Card'

export default function StatCard({ icon: Icon, label, value, color, delay, badge }) {
  const colors = {
    purple: 'from-primary-900 to-primary-950',
    green: 'from-primary-700 to-primary-900',
    pink: 'from-accent-500 to-accent-700',
    amber: 'from-primary-800 to-accent-600',
    blue: 'from-primary-600 to-primary-900',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color]} opacity-10 rounded-full -mr-16 -mt-16`} />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {badge && (
              <span className="px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-sm font-bold">
                {badge}
              </span>
            )}
          </div>
          
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-primary-950">{value}</p>
        </div>
      </Card>
    </motion.div>
  )
}
