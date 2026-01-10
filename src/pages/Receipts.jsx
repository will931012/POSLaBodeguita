import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Search, Eye, Printer, Trash2, Calendar, Filter } from 'lucide-react'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Receipts() {
  const [receipts, setReceipts] = useState([])
  const [filteredReceipts, setFilteredReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  // Filtros
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'today' | 'week' | 'month'

  // ============================================
  // CARGAR RECIBOS
  // ============================================
  useEffect(() => {
    loadReceipts()
  }, [])

  const loadReceipts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/receipts`)
      if (!res.ok) throw new Error('Failed to load receipts')
      
      const data = await res.json()
      setReceipts(data)
      setFilteredReceipts(data)
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Error al cargar recibos')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FILTROS
  // ============================================
  useEffect(() => {
    let filtered = [...receipts]

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(receipt => {
        const receiptDate = new Date(receipt.created_at)
        
        switch (dateFilter) {
          case 'today':
            return receiptDate >= today
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return receiptDate >= weekAgo
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            return receiptDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(receipt => 
        receipt.id.toString().includes(query) ||
        receipt.sale_id?.toString().includes(query) ||
        receipt.supplier?.toLowerCase().includes(query) ||
        receipt.notes?.toLowerCase().includes(query)
      )
    }

    setFilteredReceipts(filtered)
  }, [receipts, searchQuery, dateFilter])

  // ============================================
  // VER RECIBO
  // ============================================
  const viewReceipt = async (receipt) => {
    try {
      const res = await fetch(`${API}/api/receipts/${receipt.id}`)
      if (!res.ok) throw new Error('Failed to load receipt details')
      
      const data = await res.json()
      setSelectedReceipt(data)
      setShowModal(true)
    } catch (error) {
      toast.error('Error al cargar el recibo')
    }
  }

  // ============================================
  // IMPRIMIR RECIBO
  // ============================================
  const printReceipt = (receipt) => {
    if (!receipt.content) {
      toast.error('Este recibo no tiene contenido para imprimir')
      return
    }

    const printWindow = window.open('', 'PRINT', 'height=600,width=400')
    if (!printWindow) {
      toast.error('Popup bloqueado. Permite popups para imprimir.')
      return
    }
    
    printWindow.document.write(receipt.content)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // ============================================
  // ELIMINAR RECIBO
  // ============================================
  const deleteReceipt = async (id) => {
    if (!confirm('¿Eliminar este recibo?')) return

    try {
      const res = await fetch(`${API}/api/receipts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      setReceipts(receipts.filter(r => r.id !== id))
      toast.success('Recibo eliminado')
    } catch (error) {
      toast.error('No se pudo eliminar el recibo')
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Recibos</h1>
          <p className="text-gray-600 mt-1">Historial de transacciones</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={Calendar}
            onClick={loadReceipts}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <Input
            icon={Search}
            placeholder="Buscar por ID, proveedor o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Card>

        <Card>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'today', label: 'Hoy' },
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mes' },
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                  dateFilter === filter.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200"
        >
          <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Total Recibos
          </div>
          <div className="text-4xl font-bold text-blue-900 font-mono">
            {filteredReceipts.length}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200"
        >
          <div className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">
            Ventas
          </div>
          <div className="text-4xl font-bold text-green-900 font-mono">
            {filteredReceipts.filter(r => r.sale_id).length}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200"
        >
          <div className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-2">
            Otros
          </div>
          <div className="text-4xl font-bold text-purple-900 font-mono">
            {filteredReceipts.filter(r => !r.sale_id).length}
          </div>
        </motion.div>
      </div>

      {/* Lista de Recibos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">ID</th>
                <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Venta ID</th>
                <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Fecha</th>
                <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Proveedor</th>
                <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Notas</th>
                <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="spinner mx-auto"></div>
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No hay recibos para mostrar</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredReceipts.map((receipt) => (
                    <motion.tr
                      key={receipt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 font-mono font-semibold">
                        #{receipt.id}
                      </td>
                      
                      <td className="p-4">
                        {receipt.sale_id ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg font-mono text-sm font-semibold">
                            #{receipt.sale_id}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-semibold">
                            {format(new Date(receipt.created_at), 'dd MMM yyyy', { locale: es })}
                          </div>
                          <div className="text-gray-500 font-mono">
                            {format(new Date(receipt.created_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        {receipt.supplier || <span className="text-gray-400">-</span>}
                      </td>
                      
                      <td className="p-4 max-w-xs truncate">
                        {receipt.notes || <span className="text-gray-400">-</span>}
                      </td>
                      
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => viewReceipt(receipt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {receipt.content && (
                            <button
                              onClick={() => printReceipt(receipt)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Imprimir"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteReceipt(receipt.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Detalles */}
      <AnimatePresence>
        {showModal && selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Recibo #{selectedReceipt.id}</h2>
                    <p className="text-primary-100 mt-1">
                      {format(new Date(selectedReceipt.created_at), 'dd MMMM yyyy • HH:mm', { locale: es })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                {selectedReceipt.sale_id && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <div className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">
                      Venta ID
                    </div>
                    <div className="text-2xl font-bold text-green-900 font-mono">
                      #{selectedReceipt.sale_id}
                    </div>
                  </div>
                )}

                {selectedReceipt.supplier && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Proveedor
                    </div>
                    <div className="text-lg">{selectedReceipt.supplier}</div>
                  </div>
                )}

                {selectedReceipt.notes && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Notas
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">{selectedReceipt.notes}</div>
                  </div>
                )}

                {selectedReceipt.content && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Contenido del Recibo
                    </div>
                    <div 
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: selectedReceipt.content }}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-6 flex gap-2">
                {selectedReceipt.content && (
                  <Button
                    icon={Printer}
                    onClick={() => printReceipt(selectedReceipt)}
                  >
                    Imprimir
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}