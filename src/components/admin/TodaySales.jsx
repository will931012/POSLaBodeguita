import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import Card from '@components/Card'

export default function TodaySales({ todaySales }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ventas de Hoy</h2>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">Total Ventas</p>
            <p className="text-3xl font-bold text-blue-600">{todaySales.count}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">Ingresos</p>
            <p className="text-3xl font-bold text-green-600">
              ${(todaySales.revenue || 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">Perfumes</p>
            <p className="text-3xl font-bold text-purple-600">{todaySales.perfumeCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">Rev. Perfumes</p>
            <p className="text-3xl font-bold text-pink-600">
              ${(todaySales.perfumeRevenue || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}