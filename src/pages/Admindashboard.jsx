import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Sparkles,
  BarChart3,
  Calendar,
  Filter,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import Card from '@components/Card'
import Button from '@components/Button'
import { Navigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function AdminDashboard() {
  const { token, user } = useAuth()

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalRevenue: 0,
    perfumeSales: 0,
    perfumeRevenue: 0,
    totalCategories: 0
  })
  const [categoryData, setCategoryData] = useState([])
  const [perfumeProducts, setPerfumeProducts] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [timeline, setTimeline] = useState([])
  const [error, setError] = useState(null)

  // Calculate date range
  const getDateRange = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - parseInt(days))
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  }

  // Load dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({ startDate, endDate })

      const [summaryRes, categoryRes, perfumeRes, topRes, timelineRes] = await Promise.all([
        fetch(`${API}/api/analytics/dashboard-summary?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/analytics/sales-by-category?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/analytics/perfume-sales?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/analytics/top-products?limit=5&${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/analytics/sales-timeline?category=perfume&${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      // Check for errors
      if (!summaryRes.ok) {
        const errorData = await summaryRes.json()
        throw new Error(errorData.error || 'Error al cargar resumen')
      }

      const summaryData = await summaryRes.json()
      const categoryList = categoryRes.ok ? await categoryRes.json() : []
      const perfumeList = perfumeRes.ok ? await perfumeRes.json() : []
      const topList = topRes.ok ? await topRes.json() : []
      const timelineData = timelineRes.ok ? await timelineRes.json() : []

      // Ensure summary has all required fields with defaults
      setSummary({
        totalSales: summaryData.totalSales || 0,
        totalRevenue: summaryData.totalRevenue || 0,
        perfumeSales: summaryData.perfumeSales || 0,
        perfumeRevenue: summaryData.perfumeRevenue || 0,
        totalCategories: summaryData.totalCategories || 0
      })
      
      setCategoryData(categoryList)
      setPerfumeProducts(perfumeList)
      setTopProducts(topList)
      setTimeline(timelineData)
    } catch (error) {
      console.error('Dashboard load error:', error)
      setError(error.message)
      toast.error(error.message || 'Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [dateRange])

  // Calculate perfume percentage
  const perfumePercentage = summary.totalRevenue > 0
    ? (summary.perfumeRevenue / summary.totalRevenue * 100).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-10 h-10 text-amber-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Analítica de Ventas • Enfoque en Perfumes
          </p>

          {/* Date Range Filter */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-purple-200 bg-white font-semibold text-gray-700 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Último año</option>
            </select>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={ShoppingBag}
                label="Total Ventas"
                value={summary.totalSales || 0}
                color="purple"
                delay={0}
              />
              <StatCard
                icon={DollarSign}
                label="Ingresos Totales"
                value={`$${(summary.totalRevenue || 0).toFixed(2)}`}
                color="green"
                delay={0.1}
              />
              <StatCard
                icon={Sparkles}
                label="Ventas de Perfumes"
                value={summary.perfumeSales || 0}
                color="pink"
                delay={0.2}
                badge={`${perfumePercentage}%`}
              />
              <StatCard
                icon={TrendingUp}
                label="Ingresos Perfumes"
                value={`$${(summary.perfumeRevenue || 0).toFixed(2)}`}
                color="amber"
                delay={0.3}
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Perfume Sales - Featured */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2"
              >
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Perfumes más Vendidos</h2>
                      <p className="text-sm text-gray-600">Rendimiento por producto</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {perfumeProducts.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No hay datos de perfumes</p>
                    ) : (
                      perfumeProducts.slice(0, 10).map((product, index) => (
                        <PerfumeRow key={product.id} product={product} rank={index + 1} />
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Por Categoría</h2>
                      <p className="text-sm text-gray-600">Ingresos totales</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {categoryData.map((cat, index) => (
                      <CategoryRow key={index} category={cat} />
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Top Products Overall */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Top 5 Productos (Todas las Categorías)</h2>
                    <p className="text-sm text-gray-600">Mejores vendedores del periodo</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-3 font-bold text-sm text-gray-600">#</th>
                        <th className="text-left p-3 font-bold text-sm text-gray-600">Producto</th>
                        <th className="text-left p-3 font-bold text-sm text-gray-600">Categoría</th>
                        <th className="text-left p-3 font-bold text-sm text-gray-600">Vendidas</th>
                        <th className="text-left p-3 font-bold text-sm text-gray-600">Ingresos</th>
                        <th className="text-left p-3 font-bold text-sm text-gray-600">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              index === 0 ? 'bg-amber-100 text-amber-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-50 text-blue-800'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{product.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium">
                              {product.category || 'Sin categoría'}
                            </span>
                          </td>
                          <td className="p-3 font-mono">{product.units_sold || 0}</td>
                          <td className="p-3 font-mono font-bold text-green-600">
                            ${(parseFloat(product.revenue) || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-lg font-semibold ${
                              (product.current_stock || 0) < 5 ? 'bg-red-100 text-red-800' :
                              (product.current_stock || 0) < 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {product.current_stock || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, delay, badge }) {
  const colors = {
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600',
    amber: 'from-amber-500 to-amber-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color]} opacity-10 rounded-full -mr-16 -mt-16`} />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {badge && (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-bold">
                {badge}
              </span>
            )}
          </div>
          
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </Card>
    </motion.div>
  )
}

// Perfume Row Component
function PerfumeRow({ product, rank }) {
  const maxRevenue = 1000 // You can calculate this from the data
  const revenue = parseFloat(product.revenue) || 0
  const percentage = Math.min((revenue / maxRevenue) * 100, 100)

  return (
    <div className="p-4 rounded-xl bg-white border border-purple-100 hover:border-purple-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
            rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {rank}
          </span>
          <div>
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500">Stock: {product.current_stock || 0}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-purple-600">${revenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{product.units_sold || 0} vendidas</p>
        </div>
      </div>
      
      {/* Revenue bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: rank * 0.1 }}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
        />
      </div>
    </div>
  )
}

// Category Row Component
function CategoryRow({ category }) {
  const revenue = parseFloat(category.total_revenue) || 0
  
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{category.category}</p>
          <p className="text-xs text-gray-500">{category.total_units || 0} unidades</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-green-600">${revenue.toFixed(2)}</p>
        <p className="text-xs text-gray-500">{category.total_sales || 0} ventas</p>
      </div>
    </div>
  )
}