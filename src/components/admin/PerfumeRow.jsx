import { motion } from 'framer-motion'

export default function PerfumeRow({ product, rank, maxRevenue }) {
  const revenue = parseFloat(product.revenue) || 0
  const percentage = Math.min((revenue / maxRevenue) * 100, 100)

  return (
    <div className="rounded-xl border border-primary-100 bg-white p-4 transition-all hover:border-accent-200">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            rank <= 3 ? 'bg-accent-600 text-white' : 'bg-[#F4F4F4] text-primary-600'
          }`}>
            {rank}
          </span>
          <div>
            <p className="font-semibold text-primary-950">{product.name}</p>
            <p className="text-xs text-primary-400">Stock: {product.current_stock || 0}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-accent-600">${revenue.toFixed(2)}</p>
          <p className="text-xs text-primary-400">{product.units_sold || 0} vendidas</p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: rank * 0.1 }}
          className="h-full bg-gradient-to-r from-primary-950 to-accent-600"
        />
      </div>
    </div>
  )
}
