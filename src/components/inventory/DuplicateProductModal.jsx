import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Edit2 } from 'lucide-react'

export default function DuplicateProductModal({ 
  show, 
  product, 
  onClose, 
  onEdit 
}) {
  if (!show || !product) return null

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">UPC Duplicado</h3>
                <p className="text-sm text-gray-500">Este código ya existe</p>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">UPC</p>
                  <p className="font-mono text-lg font-bold text-gray-900">{product.upc}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Producto</p>
                  <p className="text-gray-900 font-semibold">{product.name}</p>
                </div>
                {product.category && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Categoría</p>
                    <p className="text-gray-900">{product.category}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Precio</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Stock</p>
                    <p className={`text-lg font-bold ${
                      product.qty < 5
                        ? 'text-red-600'
                        : product.qty < 20
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {product.qty}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="flex-1 bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar Producto
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}