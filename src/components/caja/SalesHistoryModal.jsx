import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { History, X, CreditCard, DollarSign, RefreshCw } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
}

export default function SalesHistoryModal({ open, onClose, token }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!open) return
    loadSales()
  }, [open])

  const loadSales = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error cargando ventas')
      const data = await res.json()
      setSales(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const total = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0)

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ventas de hoy</h2>
                <p className="text-sm text-gray-500">{sales.length} ventas · Total ${total.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadSales}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                title="Recargar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {loading && (
              <div className="text-center py-10 text-gray-400">Cargando...</div>
            )}

            {!loading && sales.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No hay ventas hoy</p>
              </div>
            )}

            {!loading && sales.map((sale) => (
              <div
                key={sale.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      sale.payment_method === 'cash' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {sale.payment_method === 'cash'
                        ? <DollarSign className="w-4 h-4 text-green-600" />
                        : <CreditCard className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Venta #{sale.id}</div>
                      <div className="text-xs text-gray-500">{formatTime(sale.created_at)}</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-lg text-primary-600">
                    ${parseFloat(sale.total).toFixed(2)}
                  </div>
                </button>

                {expanded === sale.id && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50 space-y-1">
                    {(sale.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-700">
                        <span>{item.qty}× {item.name}</span>
                        <span className="font-mono">${(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                    {sale.payment_method === 'cash' && parseFloat(sale.change_due || 0) > 0 && (
                      <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-200">
                        <span>Cambio dado</span>
                        <span className="font-mono">${parseFloat(sale.change_due).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
