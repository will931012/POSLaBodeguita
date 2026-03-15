import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  Calculator,
  Check,
  CreditCard,
  DollarSign,
  Mail,
  Printer,
  TrendingUp,
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
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [expected, setExpected] = useState({ cash: 0, card: 0, total: 0, salesCount: 0 })
  const [counted, setCounted] = useState({ cash: '', card: '' })
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closed, setClosed] = useState(false)
  const [closureResult, setClosureResult] = useState(null)
  const receiptRef = useRef(null)

  useEffect(() => {
    loadDayData()
  }, [selectedDate])

  const loadDayData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/report/close?day=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      toast.error('Error al cargar datos del dia')
    } finally {
      setLoading(false)
    }
  }

  const countedCash = parseFloat(counted.cash) || 0
  const countedCard = parseFloat(counted.card) || 0
  const countedTotal = countedCash + countedCard
  const diffCash = countedCash - expected.cash
  const diffCard = countedCard - expected.card
  const diffTotal = countedTotal - expected.total
  const isPerfect = Math.abs(diffTotal) < 0.01
  const hasShortage = diffTotal < -0.01
  const hasSurplus = diffTotal > 0.01

  const closeDay = async () => {
    if (!counted.cash && !counted.card) return toast.error('Ingresa al menos un monto')
    if (!confirm(`¿Confirmar cierre de caja para ${format(new Date(selectedDate), 'dd/MM/yyyy')}?`)) return

    try {
      setClosing(true)
      const res = await fetch(`${API}/report/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selectedDate, counted_cash: countedCash, counted_card: countedCard }),
      })
      if (!res.ok) throw new Error('Failed to close')

      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Error al cerrar')

      setClosureResult(data)
      setClosed(true)

      if (data.data.diff.total === 0) toast.success('Cierre perfecto')
      else if (data.data.diff.total < 0) toast.warning(`Cierre completado. Falta: $${Math.abs(data.data.diff.total).toFixed(2)}`)
      else toast.warning(`Cierre completado. Sobra: $${data.data.diff.total.toFixed(2)}`)

      if (data.email?.sent) toast.success('Email enviado correctamente')
    } catch (error) {
      console.error('Close error:', error)
      toast.error(error.message || 'Error al cerrar caja')
    } finally {
      setClosing(false)
    }
  }

  const printReceipt = () => {
    const printContent = receiptRef.current
    if (!printContent) return
    const printWindow = window.open('', 'PRINT', 'height=600,width=400')
    if (!printWindow) return toast.error('Popup bloqueado')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cierre de Caja - ${selectedDate}</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 16px; font-size: 12px; }
          .center { text-align: center; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>${printContent.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const reset = () => {
    setCounted({ cash: '', card: '' })
    setClosed(false)
    setClosureResult(null)
    loadDayData()
  }

  const summaryCards = [
    { label: 'Efectivo', value: expected.cash.toFixed(2), icon: DollarSign, tone: 'accent' },
    { label: 'Tarjeta', value: expected.card.toFixed(2), icon: CreditCard, tone: 'primary' },
    { label: 'Total', value: expected.total.toFixed(2), icon: Calculator, tone: 'accent' },
    { label: 'Ventas', value: expected.salesCount, icon: TrendingUp, tone: 'primary' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Cierre de Caja</h1>
          <p className="mt-1 text-primary-500">Conciliacion de efectivo y tarjeta</p>
        </div>

        <div className="flex items-center gap-2">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" icon={Calendar} />
          <Button variant="outline" onClick={loadDayData} loading={loading}>Refrescar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="border-2 border-primary-100 bg-white">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone === 'accent' ? 'bg-accent-600' : 'bg-primary-950'}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold uppercase tracking-wider text-primary-500">{label}</div>
                <div className="font-mono text-2xl font-bold text-primary-950">
                  {typeof value === 'string' && value.includes('.') ? `$${value}` : value}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Conteo del Cajero" icon={Calculator}>
          <div className="space-y-6">
            <Input label="Efectivo contado" type="number" step="0.01" placeholder="0.00" value={counted.cash} onChange={(e) => setCounted({ ...counted, cash: e.target.value })} icon={DollarSign} disabled={closed} />
            <Input label="Tarjeta contado" type="number" step="0.01" placeholder="0.00" value={counted.card} onChange={(e) => setCounted({ ...counted, card: e.target.value })} icon={CreditCard} disabled={closed} />

            <div className="rounded-xl border-2 border-primary-100 bg-[#F4F4F4] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase text-primary-500">Total contado</span>
                <span className="font-mono text-3xl font-bold text-primary-950">${countedTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {!closed ? (
                <>
                  <Button icon={Check} onClick={closeDay} loading={closing} disabled={!counted.cash && !counted.card} className="flex-1">Cerrar caja</Button>
                  <Button variant="outline" onClick={() => setCounted({ cash: '', card: '' })}>Limpiar</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" icon={Printer} onClick={printReceipt} className="flex-1">Imprimir</Button>
                  <Button variant="outline" onClick={reset}>Nuevo cierre</Button>
                </>
              )}
            </div>

            {closureResult?.email && (
              <div className={`flex items-center gap-2 rounded-lg p-3 ${closureResult.email.sent ? 'bg-primary-100 text-primary-700' : 'bg-[#F4F4F4] text-primary-500'}`}>
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">{closureResult.email.sent ? 'Email enviado' : 'Email no configurado'}</span>
              </div>
            )}
          </div>
        </Card>

        <Card title="Analisis de Diferencias" icon={TrendingUp}>
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-2xl border-2 p-6 ${
                isPerfect ? 'border-primary-200 bg-primary-50' : hasShortage || hasSurplus ? 'border-accent-200 bg-accent-50' : 'border-primary-100 bg-[#F4F4F4]'
              }`}
            >
              <div className="mb-2 flex items-center gap-3">
                {isPerfect ? <Check className="h-8 w-8 text-primary-950" /> : <AlertCircle className="h-8 w-8 text-accent-600" />}
                <div className="text-2xl font-bold text-primary-950">
                  {isPerfect && 'Cuadre perfecto'}
                  {hasShortage && 'Falta dinero'}
                  {hasSurplus && 'Sobra dinero'}
                  {!isPerfect && !hasShortage && !hasSurplus && 'Ingresa montos'}
                </div>
              </div>
              {(countedCash > 0 || countedCard > 0) && (
                <div className={`mt-2 font-mono text-4xl font-bold ${isPerfect ? 'text-primary-950' : 'text-accent-600'}`}>
                  {diffTotal >= 0 ? '+' : ''}${diffTotal.toFixed(2)}
                </div>
              )}
            </motion.div>

            {[{ label: 'Diferencia efectivo', diff: diffCash, expectedVal: expected.cash, countedVal: countedCash }, { label: 'Diferencia tarjeta', diff: diffCard, expectedVal: expected.card, countedVal: countedCard }].map((item) => (
              <div key={item.label} className="rounded-xl border-2 border-primary-100 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase text-primary-500">{item.label}</span>
                  <span className={`font-mono text-xl font-bold ${Math.abs(item.diff) < 0.01 ? 'text-primary-950' : 'text-accent-600'}`}>
                    {item.diff >= 0 ? '+' : ''}${item.diff.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-primary-400">
                  <span>Esperado: ${item.expectedVal.toFixed(2)}</span>
                  <span>Contado: ${item.countedVal.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div ref={receiptRef} className="hidden">
        <div className="center">
          <h2 className="bold">CIERRE DE CAJA</h2>
          <div>{format(new Date(selectedDate), 'dd MMMM yyyy', { locale: es })}</div>
          <div className="divider"></div>
        </div>
        <div className="row"><span>Ventas Efectivo:</span><span className="bold">${expected.cash.toFixed(2)}</span></div>
        <div className="row"><span>Ventas Tarjeta:</span><span className="bold">${expected.card.toFixed(2)}</span></div>
        <div className="row"><span>Total Ventas:</span><span className="bold">${expected.total.toFixed(2)}</span></div>
        <div className="divider"></div>
        <div className="row"><span>Contado Efectivo:</span><span className="bold">${countedCash.toFixed(2)}</span></div>
        <div className="row"><span>Contado Tarjeta:</span><span className="bold">${countedCard.toFixed(2)}</span></div>
        <div className="row"><span>Total Contado:</span><span className="bold">${countedTotal.toFixed(2)}</span></div>
        <div className="divider"></div>
        <div className="row"><span>Diferencia Efectivo:</span><span className="bold">${diffCash.toFixed(2)}</span></div>
        <div className="row"><span>Diferencia Tarjeta:</span><span className="bold">${diffCard.toFixed(2)}</span></div>
        <div className="row"><span>Diferencia Total:</span><span className="bold">${diffTotal.toFixed(2)}</span></div>
        <div className="divider"></div>
        <div className="row"><span># Ventas:</span><span className="bold">{expected.salesCount}</span></div>
      </div>
    </div>
  )
}
