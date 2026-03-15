import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Search, Eye, Printer, Trash2, Calendar } from 'lucide-react'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'
import DOMPurify from 'dompurify'
import { es } from 'date-fns/locale'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Receipts() {
  const { token } = useAuth()
  const [receipts, setReceipts] = useState([])
  const [filteredReceipts, setFilteredReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Filtros
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'today' | 'week' | 'month'

  const sanitizeHtml = (html) => {
    if (!html) return ''
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'link', 'meta'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    })
  }

  // ============================================
  // CARGAR RECIBOS
  // ============================================
  useEffect(() => {
    loadReceipts()
  }, [])

  const loadReceipts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/receipts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load receipts')
      
      const data = await res.json()
      console.log('📋 Recibos cargados:', data.length)
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
      setLoadingDetails(true)
      setShowModal(true)
      
      console.log('👁️ Cargando detalles del recibo:', receipt.id)
      
      const res = await fetch(`${API}/api/receipts/${receipt.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) {
        throw new Error('Failed to load receipt details')
      }
      
      const data = await res.json()
      console.log('✅ Detalles del recibo:', data)
      
      setSelectedReceipt(data)
    } catch (error) {
      console.error('Error loading receipt:', error)
      toast.error('Error al cargar el recibo')
      setShowModal(false)
    } finally {
      setLoadingDetails(false)
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

    const safeContent = sanitizeHtml(receipt.content)
    const printWindow = window.open('', 'PRINT', 'height=600,width=400')
    if (!printWindow) {
      toast.error('Popup bloqueado. Permite popups para imprimir.')
      return
    }
    
    printWindow.document.write(safeContent)
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
      const res = await fetch(`${API}/api/receipts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete')

      setReceipts(receipts.filter(r => r.id !== id))
      toast.success('Recibo eliminado')
      
      // Cerrar modal si es el recibo seleccionado
      if (selectedReceipt?.id === id) {
        setShowModal(false)
        setSelectedReceipt(null)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('No se pudo eliminar el recibo')
    }
  }

  // ============================================
  // RENDER
  // ============================================
  const salesReceipts = filteredReceipts.filter(r => r.sale_id)
  const otherReceipts = filteredReceipts.filter(r => !r.sale_id)
  const sanitizedReceiptContent = selectedReceipt?.content
    ? sanitizeHtml(selectedReceipt.content)
    : ''

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
            placeholder="Buscar por ID, venta, proveedor o notas..."
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
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Total Recibos
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {filteredReceipts.length}
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                De Ventas
              </div>
              <div className="text-3xl font-bold text-green-600 mt-1">
                {salesReceipts.length}
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Otros
              </div>
              <div className="text-3xl font-bold text-gray-600 mt-1">
                {otherReceipts.length}
              </div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Recibos */}
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
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowModal(false)
              setSelectedReceipt(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {loadingDetails ? (
                <div className="p-12 flex items-center justify-center">
                  <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando recibo...</p>
                  </div>
                </div>
              ) : selectedReceipt ? (
                <>
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
                        onClick={() => {
                          setShowModal(false)
                          setSelectedReceipt(null)
                        }}
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

                    {selectedReceipt.content ? (
                      <div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          Contenido del Recibo
                        </div>
                        <div 
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: sanitizedReceiptContent }}
                        />
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">
                            Este recibo no tiene contenido HTML almacenado
                          </span>
                        </div>
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
                      onClick={() => {
                        setShowModal(false)
                        setSelectedReceipt(null)
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <p>No se pudo cargar el recibo</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
