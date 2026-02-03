import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import Card from '@components/Card'
import CategoryRow from './CategoryRow'

export default function CategoriesSection({ categoryData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Por Categoría</h2>
            <p className="text-sm text-gray-600">Ingresos totales</p>
          </div>
        </div>

        <div className="space-y-3">
          {categoryData.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay datos de categorÃ­as</p>
          ) : (
            categoryData.map((cat, index) => (
              <CategoryRow key={index} category={cat} />
            ))
          )}
        </div>
      </Card>
    </motion.div>
  )
}
