import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Eye, Printer, Receipt, Search, Trash2 } from 'lucide-react'
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
  const [dateFilter, setDateFilter] = useState('all')

  const sanitizeHtml = (html) => {
    if (!html) return ''
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'link', 'meta'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    })
  }

  useEffect(() => {
    loadReceipts()
  }, [])

  const loadReceipts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
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

  useEffect(() => {
    let filtered = [...receipts]

    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      filtered = filtered.filter((receipt) => {
        const receiptDate = new Date(receipt.created_at)
        switch (dateFilter) {
          case 'today':
            return receiptDate >= today
          case 'week':
            return receiptDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          case 'month':
            return receiptDate >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          default:
            return true
        }
      })
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((receipt) =>
        receipt.id.toString().includes(query) ||
        receipt.sale_id?.toString().includes(query) ||
        receipt.supplier?.toLowerCase().includes(query) ||
        receipt.notes?.toLowerCase().includes(query)
      )
    }

    setFilteredReceipts(filtered)
  }, [receipts, searchQuery, dateFilter])

  const viewReceipt = async (receipt) => {
    try {
      setLoadingDetails(true)
      setShowModal(true)
      const res = await fetch(`${API}/api/receipts/${receipt.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load receipt details')
      const data = await res.json()
      setSelectedReceipt(data)
    } catch (error) {
      console.error('Error loading receipt:', error)
      toast.error('Error al cargar el recibo')
      setShowModal(false)
    } finally {
      setLoadingDetails(false)
    }
  }

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

  const deleteReceipt = async (id) => {
    if (!confirm('¿Eliminar este recibo?')) return

    try {
      const res = await fetch(`${API}/api/receipts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')

      setReceipts(receipts.filter((r) => r.id !== id))
      toast.success('Recibo eliminado')

      if (selectedReceipt?.id === id) {
        setShowModal(false)
        setSelectedReceipt(null)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('No se pudo eliminar el recibo')
    }
  }

  const salesReceipts = filteredReceipts.filter((r) => r.sale_id)
  const otherReceipts = filteredReceipts.filter((r) => !r.sale_id)
  const sanitizedReceiptContent = selectedReceipt?.content ? sanitizeHtml(selectedReceipt.content) : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Recibos</h1>
          <p className="mt-1 text-primary-500">Historial de transacciones</p>
        </div>

        <Button variant="outline" icon={Calendar} onClick={loadReceipts} loading={loading}>
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <Input icon={Search} placeholder="Buscar por ID, venta, proveedor o notas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </Card>

        <Card>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'today', label: 'Hoy' },
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mes' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={`flex-1 rounded-lg px-4 py-2 font-semibold transition-all ${
                  dateFilter === filter.value ? 'bg-primary-950 text-white' : 'bg-[#F4F4F4] text-primary-600 hover:bg-primary-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Total Recibos', value: filteredReceipts.length, tone: 'primary' },
          { label: 'De Ventas', value: salesReceipts.length, tone: 'accent' },
          { label: 'Otros', value: otherReceipts.length, tone: 'muted' },
        ].map((item) => (
          <Card key={item.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wider text-primary-500">{item.label}</div>
                <div className={`mt-1 text-3xl font-bold ${item.tone === 'accent' ? 'text-accent-600' : item.tone === 'muted' ? 'text-primary-600' : 'text-primary-950'}`}>
                  {item.value}
                </div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.tone === 'accent' ? 'bg-accent-600' : 'bg-primary-950'}`}>
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-primary-100">
                {['ID', 'Venta ID', 'Fecha', 'Proveedor', 'Notas', 'Acciones'].map((heading) => (
                  <th key={heading} className="p-4 text-left text-sm font-bold uppercase text-primary-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center"><div className="spinner mx-auto"></div></td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-primary-400">
                    <Receipt className="mx-auto mb-2 h-12 w-12 opacity-30" />
                    <p>No hay recibos para mostrar</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredReceipts.map((receipt) => (
                    <motion.tr key={receipt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-primary-100 transition-colors hover:bg-[#F4F4F4]">
                      <td className="p-4 font-mono font-semibold text-primary-950">#{receipt.id}</td>
                      <td className="p-4">
                        {receipt.sale_id ? (
                          <span className="rounded-lg bg-primary-100 px-2 py-1 font-mono text-sm font-semibold text-primary-700">#{receipt.sale_id}</span>
                        ) : (
                          <span className="text-primary-300">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-semibold text-primary-950">{format(new Date(receipt.created_at), 'dd MMM yyyy', { locale: es })}</div>
                          <div className="font-mono text-primary-400">{format(new Date(receipt.created_at), 'HH:mm:ss')}</div>
                        </div>
                      </td>
                      <td className="p-4 text-primary-600">{receipt.supplier || <span className="text-primary-300">-</span>}</td>
                      <td className="max-w-xs truncate p-4 text-primary-600">{receipt.notes || <span className="text-primary-300">-</span>}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button onClick={() => viewReceipt(receipt)} className="rounded-lg p-2 text-primary-600 transition-colors hover:bg-primary-50" title="Ver detalles">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteReceipt(receipt.id)} className="rounded-lg p-2 text-accent-600 transition-colors hover:bg-accent-50" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
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

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowModal(false); setSelectedReceipt(null) }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-2xl">
              {loadingDetails ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-primary-500">Cargando recibo...</p>
                  </div>
                </div>
              ) : selectedReceipt ? (
                <>
                  <div className="bg-primary-950 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">Recibo #{selectedReceipt.id}</h2>
                        <p className="mt-1 text-primary-100">{format(new Date(selectedReceipt.created_at), 'dd MMMM yyyy • HH:mm', { locale: es })}</p>
                      </div>
                      <button onClick={() => { setShowModal(false); setSelectedReceipt(null) }} className="rounded-lg p-2 transition-colors hover:bg-white/20">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[calc(90vh-200px)] space-y-4 overflow-y-auto p-6">
                    {selectedReceipt.sale_id && (
                      <div className="rounded-xl border-2 border-primary-100 bg-[#F4F4F4] p-4">
                        <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-primary-500">Venta ID</div>
                        <div className="font-mono text-2xl font-bold text-primary-950">#{selectedReceipt.sale_id}</div>
                      </div>
                    )}

                    {selectedReceipt.supplier && (
                      <div>
                        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-500">Proveedor</div>
                        <div className="text-lg text-primary-600">{selectedReceipt.supplier}</div>
                      </div>
                    )}

                    {selectedReceipt.notes && (
                      <div>
                        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-500">Notas</div>
                        <div className="rounded-lg bg-[#F4F4F4] p-4 text-primary-600">{selectedReceipt.notes}</div>
                      </div>
                    )}

                    {selectedReceipt.content ? (
                      <div>
                        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-500">Contenido del recibo</div>
                        <div className="overflow-x-auto rounded-lg border border-primary-100 bg-[#F4F4F4] p-4" dangerouslySetInnerHTML={{ __html: sanitizedReceiptContent }} />
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-accent-100 bg-accent-50 p-4 text-accent-700">
                        <span className="font-semibold">Este recibo no tiene contenido HTML almacenado</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 bg-[#F4F4F4] p-6">
                    {selectedReceipt.content && <Button icon={Printer} onClick={() => printReceipt(selectedReceipt)}>Imprimir</Button>}
                    <Button variant="outline" onClick={() => { setShowModal(false); setSelectedReceipt(null) }}>Cerrar</Button>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-primary-400"><p>No se pudo cargar el recibo</p></div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
