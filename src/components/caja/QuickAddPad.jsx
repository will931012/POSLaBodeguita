import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import Card from '@components/Card'

const QUICK_PRICES = [0.1, 0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function QuickAddPad({ onQuickAdd }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-accent-600" />
        <span className="text-sm font-semibold uppercase text-primary-600">Agregar rapido</span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
        {QUICK_PRICES.map((price) => (
          <motion.button
            key={price}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickAdd(price)}
            className="aspect-[1/0.92] rounded-xl bg-primary-950 text-base font-bold text-white shadow-md transition-all hover:bg-accent-600 hover:shadow-lg md:text-lg"
          >
            ${price < 1 ? price.toFixed(2) : price}
          </motion.button>
        ))}
      </div>

      <div className="mt-3 text-xs text-primary-400">Toca para agregar productos de precio fijo al carrito.</div>
    </Card>
  )
}
