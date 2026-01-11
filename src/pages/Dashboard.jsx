import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Receipt,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Card, { StatCard } from '@components/Card'
import Button from '@components/Button'
import { useAuth } from '@/context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const toNumber = (val) => {
  if (val === null || val === undefined) return 0
  const num = parseFloat(val)
  return isNaN(num) ? 0 : num
}

export default function Dashboard() {
  const { token, hasRole } = useAuth()
  const [salesData, setSalesData] = useState([])
  const [todayTotal, setTodayTotal] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [verse, setVerse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    loadVerse()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/sales/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to load sales')
      
      const data = await res.json()
      
      const chartData = []
      let total = 0
      
      for (let h = 0; h < 24; h++) {
        const hour = data.find(d => parseInt(d.hour) === h)
        const hourTotal = toNumber(hour?.total || 0)
        total += hourTotal
        
        chartData.push({
          hour: `${h}:00`,
          total: total,
        })
      }
      
      setSalesData(chartData)
      setTodayTotal(total)
      setTodayCount(data.length)
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVerse = async () => {
    try {
      const res = await fetch('https://labs.bible.org/api/?passage=votd&type=json')
      const data = await res.json()
      if (data && data[0]) {
        setVerse(data[0])
      }
    } catch (error) {
      console.error('Verse error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={DollarSign}
          label="Ventas de Hoy"
          value={`$${todayTotal.toFixed(2)}`}
          trend={todayTotal > 0 ? '+' + todayTotal.toFixed(2) : '0.00'}
          color="primary"
        />
        <StatCard
          icon={ShoppingCart}
          label="Transacciones"
          value={todayCount}
          trend={`${todayCount} ventas`}
          color="success"
        />
      </div>

      {/* Verse of the Day */}
      {verse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-xl p-6">
              <div className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-90">
                Versículo del Día
              </div>
              <div className="text-lg leading-relaxed mb-3">
                "{verse.text}"
              </div>
              <div className="text-sm opacity-75">
                — {verse.bookname} {verse.chapter}:{verse.verse}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Sales Chart */}
      <Card title="Ventas Acumuladas Hoy" icon={TrendingUp}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="hour" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                formatter={(value) => [`$${toNumber(value).toFixed(2)}`, 'Total']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/sales">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Nueva Venta
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  Iniciar
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </Link>

        {hasRole(['admin', 'manager']) && (
          <Link to="/inventory">
            <Card className="hover:shadow-xl transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Inventario
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    Gestionar
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </Link>
        )}

        <Link to="/receipts">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Recibos
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  Ver Historial
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}