import { motion } from 'framer-motion'
import { Sparkles, AlertTriangle, Check } from 'lucide-react'
import Card from '@components/Card'

export default function PerfumesInventory({ allPerfumes }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inventario de Perfumes</h2>
              <p className="text-sm text-gray-600">{allPerfumes.length} perfumes en stock</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-bold text-sm text-gray-600">UPC</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Nombre</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Categoría</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Precio</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Stock</th>
                <th className="text-left p-3 font-bold text-sm text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {allPerfumes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No hay perfumes en el inventario</p>
                  </td>
                </tr>
              ) : (
                allPerfumes.map((perfume) => (
                  <tr key={perfume.id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                    <td className="p-3 font-mono text-sm">
                      {perfume.upc || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-3 font-semibold">{perfume.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium">
                        {perfume.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-gray-900">
                      ${(parseFloat(perfume.price) || 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-lg font-bold ${
                        (perfume.qty || 0) === 0 ? 'bg-red-100 text-red-800' :
                        (perfume.qty || 0) < 5 ? 'bg-orange-100 text-orange-800' :
                        (perfume.qty || 0) < 20 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {perfume.qty || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      {(perfume.qty || 0) === 0 ? (
                        <span className="flex items-center gap-1 text-red-600 font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          Agotado
                        </span>
                      ) : (perfume.qty || 0) < 5 ? (
                        <span className="flex items-center gap-1 text-orange-600 font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          Crítico
                        </span>
                      ) : (perfume.qty || 0) < 20 ? (
                        <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          Bajo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <Check className="w-4 h-4" />
                          OK
                        </span>
                      )}
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