import { motion } from 'framer-motion'
import { AlertTriangle, Check, Sparkles } from 'lucide-react'
import Card from '@components/Card'

export default function PerfumesInventory({ allPerfumes }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-950">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-950">Inventario de Perfumes</h2>
              <p className="text-sm text-primary-500">{allPerfumes.length} perfumes en stock</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-primary-100">
                <th className="p-3 text-left text-sm font-bold text-primary-500">UPC</th>
                <th className="p-3 text-left text-sm font-bold text-primary-500">Nombre</th>
                <th className="p-3 text-left text-sm font-bold text-primary-500">Categoria</th>
                <th className="p-3 text-left text-sm font-bold text-primary-500">Precio</th>
                <th className="p-3 text-left text-sm font-bold text-primary-500">Stock</th>
                <th className="p-3 text-left text-sm font-bold text-primary-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {allPerfumes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-primary-400">
                    <Sparkles className="mx-auto mb-2 h-12 w-12 opacity-30" />
                    <p>No hay perfumes en el inventario</p>
                  </td>
                </tr>
              ) : (
                allPerfumes.map((perfume) => (
                  <tr key={perfume.id} className="border-b border-primary-100 transition-colors hover:bg-[#F4F4F4]">
                    <td className="p-3 font-mono text-sm text-primary-600">
                      {perfume.upc || <span className="text-primary-300">-</span>}
                    </td>
                    <td className="p-3 font-semibold text-primary-950">{perfume.name}</td>
                    <td className="p-3">
                      <span className="rounded-lg bg-primary-100 px-2 py-1 text-sm font-medium text-primary-700">
                        {perfume.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-primary-950">
                      ${(parseFloat(perfume.price) || 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-lg px-3 py-1 font-bold ${
                        (perfume.qty || 0) === 0
                          ? 'bg-accent-50 text-accent-700'
                          : (perfume.qty || 0) < 5
                            ? 'bg-accent-100 text-accent-800'
                            : (perfume.qty || 0) < 20
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-[#F4F4F4] text-primary-600'
                      }`}>
                        {perfume.qty || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      {(perfume.qty || 0) === 0 ? (
                        <span className="flex items-center gap-1 font-semibold text-accent-600">
                          <AlertTriangle className="h-4 w-4" />
                          Agotado
                        </span>
                      ) : (perfume.qty || 0) < 5 ? (
                        <span className="flex items-center gap-1 font-semibold text-accent-700">
                          <AlertTriangle className="h-4 w-4" />
                          Critico
                        </span>
                      ) : (perfume.qty || 0) < 20 ? (
                        <span className="flex items-center gap-1 font-semibold text-primary-600">
                          <AlertTriangle className="h-4 w-4" />
                          Bajo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-primary-950">
                          <Check className="h-4 w-4" />
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
