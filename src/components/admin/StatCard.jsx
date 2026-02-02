import { motion } from 'framer-motion'
import Card from '@components/Card'

export default function StatCard({ icon: Icon, label, value, color, delay, badge }) {
  const colors = {
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600',
    amber: 'from-amber-500 to-amber-600',
    blue: 'from-blue-500 to-blue-600',
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
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-bold">
                {badge}
              </span>
            )}
          </div>
          
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </Card>
    </motion.div>
  )
}