import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Calendar,
  Crown,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'

// Components
import StatCard from '@/components/admin/StatCard'
import TodaySales from '@/components/admin/TodaySales'
import PerfumeSalesSection from '@/components/admin/PerfumeSalesSection'
import CategoriesSection from '@/components/admin/CategoriesSection'
import TopProductsTable from '@/components/admin/TopProductsTable'
import PerfumesInventory from '@/components/admin/PerfumesInventory'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function AdminDashboard() {
  const { token, user } = useAuth()

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
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
  const [allPerfumes, setAllPerfumes] = useState([])
  const [todaySales, setTodaySales] = useState({
    count: 0,
    revenue: 0,
    perfumeCount: 0,
    perfumeRevenue: 0
  })

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
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({ startDate, endDate })

      const [summaryRes, categoryRes, perfumeRes, topRes] = await Promise.all([
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
        })
      ])

      if (!summaryRes.ok) {
        const errorData = await summaryRes.json()
        throw new Error(errorData.error || 'Error al cargar resumen')
      }

      const summaryData = await summaryRes.json()
      const categoryList = categoryRes.ok ? await categoryRes.json() : []
      const perfumeList = perfumeRes.ok ? await perfumeRes.json() : []
      const topList = topRes.ok ? await topRes.json() : []

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
    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error(error.message || 'Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Load all perfumes from inventory
  const loadAllPerfumes = async () => {
    try {
      const res = await fetch(`${API}/api/products?q=perfume&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        const perfumes = data.rows.filter(p => 
          p.category && p.category.toLowerCase().includes('perfume')
        )
        setAllPerfumes(perfumes)
      }
    } catch (error) {
      console.error('Error loading all perfumes:', error)
    }
  }

  // Load today's sales
  const loadTodaySales = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const params = new URLSearchParams({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString()
      })

      const [summaryRes, perfumeRes] = await Promise.all([
        fetch(`${API}/api/analytics/dashboard-summary?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API}/api/analytics/perfume-sales?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (summaryRes.ok) {
        const summary = await summaryRes.json()
        const perfumeData = perfumeRes.ok ? await perfumeRes.json() : []
        
        const perfumeRevenue = perfumeData.reduce((sum, p) => sum + (parseFloat(p.revenue) || 0), 0)
        
        setTodaySales({
          count: summary.totalSales || 0,
          revenue: summary.totalRevenue || 0,
          perfumeCount: perfumeData.length || 0,
          perfumeRevenue: perfumeRevenue
        })
      }
    } catch (error) {
      console.error('Error loading today sales:', error)
    }
  }

  useEffect(() => {
    loadDashboard()
    loadAllPerfumes()
    loadTodaySales()
  }, [dateRange])

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

            {/* Today's Sales */}
            <TodaySales todaySales={todaySales} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <PerfumeSalesSection perfumeProducts={perfumeProducts} />
              <CategoriesSection categoryData={categoryData} />
            </div>

            {/* Top Products */}
            <TopProductsTable topProducts={topProducts} />

            {/* All Perfumes Inventory */}
            <PerfumesInventory allPerfumes={allPerfumes} />
          </>
        )}
      </div>
    </div>
  )
}