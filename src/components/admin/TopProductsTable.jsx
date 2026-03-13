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
            <h2 className="text-2xl font-bold text-gray-900">Top 5 Productos</h2>
            <p className="text-sm text-gray-600">Mejores vendedores del periodo en formato tipo Excel</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 text-left p-3 font-bold text-slate-700">#</th>
                <th className="border border-slate-300 text-left p-3 font-bold text-slate-700">Producto</th>
                <th className="border border-slate-300 text-left p-3 font-bold text-slate-700">Categoria</th>
                <th className="border border-slate-300 text-left p-3 font-bold text-slate-700">Vendidas</th>
                <th className="border border-slate-300 text-left p-3 font-bold text-slate-700">Ingresos</th>
                <th className="border border-slate-300 text-left p-3 font-bold text-slate-700">Stock</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border border-slate-300 text-center py-12 text-gray-500">
                    No hay productos para mostrar
                  </td>
                </tr>
              ) : (
                topProducts.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="border border-slate-300 p-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="border border-slate-300 p-3 font-semibold">{product.name}</td>
                    <td className="border border-slate-300 p-3">
                      <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium">
                        {product.category || 'Sin categoria'}
                      </span>
                    </td>
                    <td className="border border-slate-300 p-3 font-mono">{product.units_sold || 0}</td>
                    <td className="border border-slate-300 p-3 font-mono font-bold text-green-600">
                      ${(parseFloat(product.revenue) || 0).toFixed(2)}
                    </td>
                    <td className="border border-slate-300 p-3">
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
