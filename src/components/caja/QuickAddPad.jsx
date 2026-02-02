import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import Card from '@components/Card'

const QUICK_PRICES = [0.10, 0.25, 0.50, 0.75, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function QuickAddPad({ onQuickAdd }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-600" />
        <span className="text-sm font-semibold text-gray-600 uppercase">
          Agregar Rápido
        </span>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
        {QUICK_PRICES.map(price => (
          <motion.button
            key={price}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickAdd(price)}
            className="aspect-square bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95 touch-manipulation select-none"
          >
            ${price < 1 ? price.toFixed(2) : price}
          </motion.button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        💡 Toca para agregar productos de precio fijo al carrito
      </div>
    </Card>
  )
}