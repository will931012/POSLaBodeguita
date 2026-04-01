import { AnimatePresence, motion } from 'framer-motion'
import { PauseCircle, X, ShoppingCart, Trash2, RotateCcw } from 'lucide-react'

const STORAGE_KEY = 'pos_parked_carts'

export function loadParkedCarts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveParkedCarts(carts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carts))
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
}

export default function ParkedCartsModal({ open, onClose, onRestore, onParkCurrent, hasActiveCart }) {
  const carts = loadParkedCarts()

  const handleDelete = (id) => {
    const updated = carts.filter((c) => c.id !== id)
    saveParkedCarts(updated)
    onClose()
    // reopen to refresh — simpler than local state
    setTimeout(onClose, 0)
  }

  const handleRestore = (cart) => {
    onRestore(cart)
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[75vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <PauseCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ventas pausadas</h2>
                <p className="text-sm text-gray-500">{carts.length} guardada{carts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Park current button */}
          {hasActiveCart && (
            <div className="px-6 pt-4">
              <button
                onClick={() => { onParkCurrent(); onClose() }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-amber-400 text-amber-600 font-semibold hover:bg-amber-50 transition-colors"
              >
                <PauseCircle className="w-4 h-4" />
                Guardar venta actual y pausar
              </button>
            </div>
          )}

          {/* List */}
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {carts.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No hay ventas pausadas</p>
              </div>
            )}

            {carts.map((parked) => {
              const itemCount = Object.values(parked.cart || {}).reduce((a, b) => a + b, 0)
              const total = parked.products
                ? parked.products.reduce((sum, p) => {
                    const qty = parked.cart[p.id] || 0
                    return sum + parseFloat(p.price || 0) * qty
                  }, 0)
                : 0

              return (
                <div
                  key={parked.id}
                  className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {parked.note || `Venta de las ${formatTime(parked.timestamp)}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {itemCount} artículo{itemCount !== 1 ? 's' : ''} · ${total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestore(parked)}
                      className="flex items-center gap-1 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retomar
                    </button>
                    <button
                      onClick={() => handleDelete(parked.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
