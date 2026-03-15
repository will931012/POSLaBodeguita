import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  CreditCard, 
  Calculator, 
  Printer, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Check,
  Mail
} from 'lucide-react'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function CloseCash() {
  const { token } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return format(today, 'yyyy-MM-dd')
  })

  // Datos esperados del sistema
  const [expected, setExpected] = useState({
    cash: 0,
    card: 0,
    total: 0,
    salesCount: 0,
  })

  // Conteo del cajero
  const [counted, setCounted] = useState({
    cash: '',
    card: '',
  })

  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closed, setClosed] = useState(false)
  const [closureResult, setClosureResult] = useState(null)

  const receiptRef = useRef(null)

  // ============================================
  // CARGAR DATOS DEL DÍA
  // ============================================
  useEffect(() => {
    loadDayData()
  }, [selectedDate])

  const loadDayData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/report/close?day=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load data')

      const data = await res.json()
      if (data.ok) {
        setExpected({
          cash: Number(data.data.byMethod?.cash || 0),
          card: Number(data.data.byMethod?.card || 0),
          total: Number(data.data.total || 0),
          salesCount: Number(data.data.salesCount || 0),
        })
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Error al cargar datos del día')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // CÁLCULOS
  // ============================================
  const countedCash = parseFloat(counted.cash) || 0
  const countedCard = parseFloat(counted.card) || 0
  const countedTotal = countedCash + countedCard

  const diffCash = countedCash - expected.cash
  const diffCard = countedCard - expected.card
  const diffTotal = countedTotal - expected.total

  const isPerfect = Math.abs(diffTotal) < 0.01
  const hasShortage = diffTotal < -0.01
  const hasSurplus = diffTotal > 0.01

  // ============================================
  // CERRAR CAJA
  // ============================================
  const closeDay = async () => {
    if (!counted.cash && !counted.card) {
      toast.error('Ingresa al menos un monto')
      return
    }

    if (!confirm(`¿Confirmar cierre de caja para ${format(new Date(selectedDate), 'dd/MM/yyyy')}?`)) {
      return
    }

    try {
      setClosing(true)

      const res = await fetch(`${API}/report/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          day: selectedDate,
          counted_cash: countedCash,
          counted_card: countedCard,
        }),
      })

      if (!res.ok) throw new Error('Failed to close')

      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Error al cerrar')

      setClosureResult(data)
      setClosed(true)
      
      // Mostrar resultado
      if (data.data.diff.total === 0) {
        toast.success('¡Cierre perfecto! Cuadre exacto.')
      } else if (data.data.diff.total < 0) {
        toast.warning(`Cierre completado. Falta: $${Math.abs(data.data.diff.total).toFixed(2)}`)
      } else {
        toast.warning(`Cierre completado. Sobra: $${data.data.diff.total.toFixed(2)}`)
      }

      if (data.email?.sent) {
        toast.success('Email enviado correctamente')
      }
    } catch (error) {
      console.error('Close error:', error)
      toast.error(error.message || 'Error al cerrar caja')
    } finally {
      setClosing(false)
    }
  }

  // ============================================
  // IMPRIMIR RECIBO
  // ============================================
  const printReceipt = () => {
    const printContent = receiptRef.current
    if (!printContent) return

    const printWindow = window.open('', 'PRINT', 'height=600,width=400')
    if (!printWindow) {
      toast.error('Popup bloqueado')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cierre de Caja - ${selectedDate}</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 16px; font-size: 12px; }
          .center { text-align: center; }
          .right { text-align: right; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .bold { font-weight: bold; }
          @media print {
            @page { size: 80mm auto; margin: 6mm; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // ============================================
  // RESET
  // ============================================
  const reset = () => {
    setCounted({ cash: '', card: '' })
    setClosed(false)
    setClosureResult(null)
    loadDayData()
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Cierre de Caja</h1>
          <p className="text-gray-600 mt-1">Conciliación de efectivo y tarjeta</p>
        </div>

        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
            icon={Calendar}
          />
          <Button
            variant="outline"
            onClick={loadDayData}
            loading={loading}
          >
            Refrescar
          </Button>
        </div>
      </div>

      {/* Estadísticas Esperadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-600 uppercase tracking-wider">
                Efectivo
              </div>
              <div className="text-2xl font-bold text-green-900 font-mono">
                ${expected.cash.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                Tarjeta
              </div>
              <div className="text-2xl font-bold text-blue-900 font-mono">
                ${expected.card.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                Total
              </div>
              <div className="text-2xl font-bold text-purple-900 font-mono">
                ${expected.total.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Ventas
              </div>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {expected.salesCount}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Panel de Conteo y Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Conteo */}
        <Card title="Conteo del Cajero" icon={Calculator}>
          <div className="space-y-6">
            <Input
              label="Efectivo Contado"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={counted.cash}
              onChange={(e) => setCounted({ ...counted, cash: e.target.value })}
              icon={DollarSign}
              disabled={closed}
            />

            <Input
              label="Tarjeta Contado"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={counted.card}
              onChange={(e) => setCounted({ ...counted, card: e.target.value })}
              icon={CreditCard}
              disabled={closed}
            />

            {/* Total Contado */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600 uppercase">
                  Total Contado
                </span>
                <span className="text-3xl font-bold text-gray-900 font-mono">
                  ${countedTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              {!closed ? (
                <>
                  <Button
                    icon={Check}
                    onClick={closeDay}
                    loading={closing}
                    disabled={!counted.cash && !counted.card}
                    className="flex-1"
                  >
                    Cerrar Caja
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCounted({ cash: '', card: '' })}
                  >
                    Limpiar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    icon={Printer}
                    onClick={printReceipt}
                    className="flex-1"
                  >
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    onClick={reset}
                  >
                    Nuevo Cierre
                  </Button>
                </>
              )}
            </div>

            {/* Email status */}
            {closureResult?.email && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                closureResult.email.sent
                  ? 'bg-green-50 text-green-800'
                  : 'bg-gray-50 text-gray-600'
              }`}>
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {closureResult.email.sent ? 'Email enviado ✓' : 'Email no configurado'}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Panel de Diferencias */}
        <Card title="Análisis de Diferencias" icon={TrendingUp}>
          <div className="space-y-4">
            {/* Status general */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-6 rounded-2xl border-2 ${
                isPerfect
                  ? 'bg-green-50 border-green-500'
                  : hasShortage
                  ? 'bg-red-50 border-red-500'
                  : hasSurplus
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {isPerfect ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
                <div className="text-2xl font-bold">
                  {isPerfect && '¡Cuadre Perfecto!'}
                  {hasShortage && 'Falta Dinero'}
                  {hasSurplus && 'Sobra Dinero'}
                  {!isPerfect && !hasShortage && !hasSurplus && 'Ingresa montos'}
                </div>
              </div>
              {(countedCash > 0 || countedCard > 0) && (
                <div className="text-4xl font-bold font-mono mt-2">
                  {diffTotal >= 0 ? '+' : ''}${diffTotal.toFixed(2)}
                </div>
              )}
            </motion.div>

            {/* Diferencias por método */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600 uppercase">
                    Diferencia Efectivo
                  </span>
                  <span className={`text-xl font-bold font-mono ${
                    Math.abs(diffCash) < 0.01 ? 'text-green-600' :
                    diffCash < 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {diffCash >= 0 ? '+' : ''}${diffCash.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Esperado: ${expected.cash.toFixed(2)}</span>
                  <span>Contado: ${countedCash.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600 uppercase">
                    Diferencia Tarjeta
                  </span>
                  <span className={`text-xl font-bold font-mono ${
                    Math.abs(diffCard) < 0.01 ? 'text-green-600' :
                    diffCard < 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {diffCard >= 0 ? '+' : ''}${diffCard.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Esperado: ${expected.card.toFixed(2)}</span>
                  <span>Contado: ${countedCard.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recibo (oculto, solo para impresión) */}
      <div ref={receiptRef} className="hidden">
        <div className="center">
          <h2 className="bold">CIERRE DE CAJA</h2>
          <div>{format(new Date(selectedDate), 'dd MMMM yyyy', { locale: es })}</div>
          <div className="divider"></div>
        </div>

        <div className="row">
          <span>Ventas Efectivo:</span>
          <span className="bold">${expected.cash.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Ventas Tarjeta:</span>
          <span className="bold">${expected.card.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Total Ventas:</span>
          <span className="bold">${expected.total.toFixed(2)}</span>
        </div>
        
        <div className="divider"></div>

        <div className="row">
          <span>Contado Efectivo:</span>
          <span className="bold">${countedCash.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Contado Tarjeta:</span>
          <span className="bold">${countedCard.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Total Contado:</span>
          <span className="bold">${countedTotal.toFixed(2)}</span>
        </div>
        
        <div className="divider"></div>

        <div className="row">
          <span>Diferencia Efectivo:</span>
          <span className="bold">${diffCash.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Diferencia Tarjeta:</span>
          <span className="bold">${diffCard.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Diferencia Total:</span>
          <span className="bold">${diffTotal.toFixed(2)}</span>
        </div>

        <div className="divider"></div>
        <div className="row">
          <span># Ventas:</span>
          <span className="bold">{expected.salesCount}</span>
        </div>
        <div className="divider"></div>
        
        <div className="center">
          <div>Firma Cajero: ________________</div>
          <div>Hora: ________</div>
        </div>
      </div>
    </div>
  )
}