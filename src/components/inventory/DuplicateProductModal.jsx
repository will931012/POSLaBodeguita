import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Edit2 } from 'lucide-react'

export default function DuplicateProductModal({ show, product, onClose, onEdit }) {
  if (!show || !product) return null

  return (
    <AnimatePresence>
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
                <AlertTriangle className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-950">UPC duplicado</h3>
                <p className="text-sm text-primary-400">Este codigo ya existe</p>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-primary-100 bg-[#F4F4F4] p-4">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary-400">UPC</p>
                  <p className="font-mono text-lg font-bold text-primary-950">{product.upc}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-primary-400">Producto</p>
                  <p className="font-semibold text-primary-950">{product.name}</p>
                </div>
                {product.category && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary-400">Categoria</p>
                    <p className="text-primary-600">{product.category}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 border-t border-primary-200 pt-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary-400">Precio</p>
                    <p className="text-lg font-bold text-primary-950">${parseFloat(product.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary-400">Stock</p>
                    <p className={`text-lg font-bold ${product.qty < 5 ? 'text-accent-600' : product.qty < 20 ? 'text-primary-600' : 'text-primary-950'}`}>
                      {product.qty}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={onEdit} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-950 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-800">
                <Edit2 className="h-4 w-4" />
                Editar producto
              </button>
              <button onClick={onClose} className="rounded-xl border-2 border-primary-200 px-4 py-3 font-semibold text-primary-600 transition-colors hover:bg-primary-50">
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
