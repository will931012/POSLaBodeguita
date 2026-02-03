import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import Card from '@components/Card'

export default function TopProductsTable({ topProducts }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top 5 Productos (Todas las Categorías)</h2>
            <p className="text-sm text-gray-600">Mejores vendedores del periodo</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-bold text-sm text-gray-600">#</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Producto</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Categoría</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Vendidas</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Ingresos</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Stock</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    No hay productos para mostrar
                  </td>
                </tr>
              ) : (
                topProducts.map((product, index) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{product.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium">
                        {product.category || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{product.units_sold || 0}</td>
                    <td className="p-3 font-mono font-bold text-green-600">
                      ${(parseFloat(product.revenue) || 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-lg font-semibold ${
                        (product.current_stock || 0) < 5 ? 'bg-red-100 text-red-800' :
                        (product.current_stock || 0) < 20 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.current_stock || 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}