import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ShoppingCart,
  Package,
  Receipt,
  DollarSign,
  TrendingUp,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { StatCard } from '@components/Card'
import Card from '@components/Card'
import Button from '@components/Button'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Mock verse API for now
async function fetchVerseOfDay() {
  try {
    const res = await fetch('https://labs.bible.org/api/?passage=votd&type=json')
    if (!res.ok) throw new Error('Failed to fetch verse')
    const data = await res.json()
    const v = Array.isArray(data) && data[0] ? data[0] : null
    if (!v) throw new Error('Empty response')
    return {
      text: String(v.text || '').trim(),
      reference: `${v.bookname} ${v.chapter}:${v.verse}`,
    }
  } catch (e) {
    console.error('Verse fetch error:', e)
    return null
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [sales, setSales] = useState([])
  const [verse, setVerse] = useState({ text: '', reference: '', loading: true })
  const [loading, setLoading] = useState(true)

  // Fetch sales data
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await fetch(`${API}/api/sales/today`)
        if (!res.ok) throw new Error('Failed to fetch sales')
        const data = await res.json()
        setSales(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error loading sales:', error)
        toast.error('Error al cargar las ventas')
      } finally {
        setLoading(false)
      }
    }

    fetchSales()
  }, [])

  // Fetch verse of the day
  useEffect(() => {
    const loadVerse = async () => {
      const v = await fetchVerseOfDay()
      if (v) {
        setVerse({ text: v.text, reference: v.reference, loading: false })
      } else {
        setVerse({ text: '', reference: '', loading: false })
      }
    }

    loadVerse()
  }, [])

  // Process chart data
  const chartData = useMemo(() => {
    const hourlyBase =
      sales && sales.length
        ? sales
        : Array.from({ length: 13 }, (_, i) => ({
            hour: String(8 + i).padStart(2, '0'),
            total: 0,
          }))

    const sorted = [...hourlyBase].sort((a, b) => Number(a.hour) - Number(b.hour))
    let acc = 0

    return sorted.map((d) => {
      const y = Number(d.total) || 0
      acc += y
      return {
        hour: `${d.hour}:00`,
        hourly: y,
        cumulative: Number(acc.toFixed(2)),
      }
    })
  }, [sales])

  const totalToday = chartData[chartData.length - 1]?.cumulative || 0
  const salesCount = sales.length || 0

  const quickActions = [
    {
      title: 'Nueva Venta',
      description: 'Registrar transacción',
      icon: ShoppingCart,
      color: 'primary',
      path: '/sales',
    },
    {
      title: 'Inventario',
      description: 'Gestionar productos',
      icon: Package,
      color: 'success',
      path: '/inventory',
    },
    {
      title: 'Recibos',
      description: 'Ver historial',
      icon: Receipt,
      color: 'accent',
      path: '/receipts',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Bienvenido al sistema de punto de venta
          </p>
        </div>
        
        <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl shadow-sm">
          <p className="text-sm font-semibold text-gray-600 capitalize">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Ventas de Hoy"
          value={`$${totalToday.toFixed(2)}`}
          icon={DollarSign}
          trend="Acumulado"
          trendUp={true}
          color="primary"
        />
        
        <StatCard
          title="Transacciones"
          value={salesCount}
          icon={ShoppingCart}
          trend="Hoy"
          trendUp={true}
          color="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verse of the Day */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card
            title="Versículo del Día"
            icon={BookOpen}
            className="h-full gradient-dark text-white"
            headerClassName="border-white/10 bg-transparent"
          >
            {verse.loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="spinner border-white/30 border-t-white"></div>
                <p className="text-white/70">Cargando...</p>
              </div>
            ) : verse.text ? (
              <div className="space-y-4">
                <blockquote className="text-lg italic leading-relaxed text-white/95 border-l-4 border-primary-400 pl-4">
                  "{verse.text}"
                </blockquote>
                <p className="text-primary-300 font-bold text-right">
                  {verse.reference}
                </p>
              </div>
            ) : (
              <p className="text-white/60 italic text-center py-4">
                No se pudo cargar el versículo del día
              </p>
            )}
          </Card>
        </motion.div>

        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card title="Ventas de Hoy" icon={TrendingUp}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#6b7280"
                    style={{ fontSize: '0.875rem', fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '0.875rem', fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}`,
                      name === 'cumulative' ? 'Acumulado' : 'Hora',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorCumulative)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              {!sales.length && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 font-medium">Sin ventas registradas aún</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Acciones Rápidas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            const colorClasses = {
              primary: 'gradient-primary',
              success: 'gradient-success',
              accent: 'gradient-accent',
            }

            return (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(action.path)}
                className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-left transition-all hover:shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-16 h-16 ${colorClasses[action.color]} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {action.title}
                </h3>
                <p className="text-gray-600">
                  {action.description}
                </p>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
