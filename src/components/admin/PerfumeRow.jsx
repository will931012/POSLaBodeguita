import { motion } from 'framer-motion'

export default function PerfumeRow({ product, rank }) {
  const maxRevenue = 1000
  const revenue = parseFloat(product.revenue) || 0
  const percentage = Math.min((revenue / maxRevenue) * 100, 100)

  return (
    <div className="p-4 rounded-xl bg-white border border-purple-100 hover:border-purple-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
            rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {rank}
          </span>
          <div>
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500">Stock: {product.current_stock || 0}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-purple-600">${revenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{product.units_sold || 0} vendidas</p>
        </div>
      </div>
      
      {/* Revenue bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: rank * 0.1 }}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
        />
      </div>
    </div>
  )
}