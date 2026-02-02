import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Card from '@components/Card'
import PerfumeRow from './PerfumeRow.jsx'

export default function PerfumeSalesSection({ perfumeProducts }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="lg:col-span-2"
    >
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Perfumes más Vendidos</h2>
            <p className="text-sm text-gray-600">Rendimiento por producto</p>
          </div>
        </div>

        <div className="space-y-3">
          {perfumeProducts.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay datos de perfumes</p>
          ) : (
            perfumeProducts.slice(0, 10).map((product, index) => (
              <PerfumeRow key={product.id} product={product} rank={index + 1} />
            ))
          )}
        </div>
      </Card>
    </motion.div>
  )
}