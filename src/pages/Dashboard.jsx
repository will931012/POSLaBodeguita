import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Card, { StatCard } from '@components/Card'
import { useAuth } from '@/context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const toNumber = (val) => {
  if (val === null || val === undefined) return 0
  const num = parseFloat(val)
  return Number.isNaN(num) ? 0 : num
}

export default function Dashboard() {
  const { token, hasRole } = useAuth()
  const [salesData, setSalesData] = useState([])
  const [todayTotal, setTodayTotal] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [verse, setVerse] = useState(null)

  useEffect(() => {
    if (!token) return
    loadDashboardData()
    loadVerse()
  }, [token])

  const loadDashboardData = async () => {
    try {
      const res = await fetch(`${API}/api/sales/today`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load sales')

      const data = await res.json()
      const chartData = []
      let total = 0

      for (let h = 0; h < 24; h++) {
        const hour = data.find((d) => parseInt(d.hour) === h)
        const hourTotal = toNumber(hour?.total || 0)
        total += hourTotal
        chartData.push({ hour: `${h}:00`, total })
      }

      setSalesData(chartData)
      setTodayTotal(total)
      setTodayCount(data.length)
    } catch (error) {
      console.error('Dashboard error:', error)
    }
  }

  const loadVerse = async () => {
    try {
      const res = await fetch('https://labs.bible.org/api/?passage=votd&type=json')
      const data = await res.json()
      if (data && data[0]) setVerse(data[0])
    } catch (error) {
      console.error('Verse error:', error)
    }
  }

  const actionCardClasses =
    'cursor-pointer border border-primary-100 bg-white transition-all hover:border-accent-200 hover:shadow-xl'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
        <p className="mt-2 text-primary-500">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatCard icon={DollarSign} label="Ventas de Hoy" value={`$${todayTotal.toFixed(2)}`} trend={todayTotal > 0 ? `+${todayTotal.toFixed(2)}` : '0.00'} color="primary" />
        <StatCard icon={ShoppingCart} label="Transacciones" value={todayCount} trend={`${todayCount} ventas`} color="accent" />
      </div>

      {verse && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="rounded-xl bg-primary-950 p-6 text-white">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-100">Versiculo del dia</div>
              <div className="mb-3 text-lg leading-relaxed">"{verse.text}"</div>
              <div className="text-sm text-primary-200">{verse.bookname} {verse.chapter}:{verse.verse}</div>
            </div>
          </Card>
        </motion.div>
      )}

      <Card title="Ventas Acumuladas Hoy" icon={TrendingUp}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E50914" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="hour" stroke="#525252" style={{ fontSize: '12px' }} />
              <YAxis stroke="#525252" style={{ fontSize: '12px' }} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '8px 12px' }}
                formatter={(value) => [`$${toNumber(value).toFixed(2)}`, 'Total']}
              />
              <Area type="monotone" dataKey="total" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link to="/caja">
          <Card className={actionCardClasses}>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-500">Nueva Venta</div>
                <div className="text-2xl font-bold text-primary-950">Iniciar</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-950">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </Link>

        {hasRole(['admin', 'manager']) && (
          <Link to="/inventory">
            <Card className={actionCardClasses}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-500">Inventario</div>
                  <div className="text-2xl font-bold text-primary-950">Gestionar</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-600">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </Link>
        )}

        <Link to="/receipts">
          <Card className={actionCardClasses}>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-500">Recibos</div>
                <div className="text-2xl font-bold text-primary-950">Ver Historial</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-950">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
