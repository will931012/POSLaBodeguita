import { useState, useEffect, useMemo } from 'react'
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

import StatCard from '@/components/admin/StatCard.jsx'
import TodaySales from '@/components/admin/TodaySales.jsx'
import PerfumeSalesSection from '@/components/admin/PerfumeSalesSection.jsx'
import SublimationSalesSection from '@/components/admin/SublimationSalesSection.jsx'
import CategoriesSection from '@/components/admin/CategoriesSection.jsx'
import TopProductsTable from '@/components/admin/TopProductsTable.jsx'
import PerfumesInventory from '@/components/admin/PerfumesInventory.jsx'
import SublimationInventory from '@/components/admin/SublimationInventory.jsx'
import MetricsTable from '@/components/admin/MetricsTable.jsx'
import LocationBreakdownTable from '@/components/admin/LocationBreakdownTable.jsx'
import SalesInsightsPies from '@/components/admin/SalesInsightsPies.jsx'
import CustomerCampaignsTab from '@/components/admin/CustomerCampaignsTab.jsx'
import Button from '@/components/Button.jsx'
import { isSublimationCategory } from '@/utils/productMeta'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function AdminDashboard() {
  const { token, user } = useAuth()

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
  const [sublimationProducts, setSublimationProducts] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [allPerfumes, setAllPerfumes] = useState([])
  const [allSublimationProducts, setAllSublimationProducts] = useState([])
  const [locationBreakdown, setLocationBreakdown] = useState([])
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [announcementSending, setAnnouncementSending] = useState(false)
  const [activeTab, setActiveTab] = useState('ventas')
  const [todaySales, setTodaySales] = useState({
    count: 0,
    revenue: 0,
    perfumeCount: 0,
    perfumeRevenue: 0
  })

  const isAbortError = (error) => error?.name === 'AbortError'

  const getDateRange = (days) => {
    const parsedDays = Number.isFinite(parseInt(days, 10)) ? parseInt(days, 10) : 30
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - parsedDays)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  }

  const loadDashboard = async (signal) => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({ startDate, endDate })

      const [summaryRes, categoryRes, perfumeRes, sublimationRes, topRes, locationRes] = await Promise.all([
        fetch(`${API}/api/analytics/dashboard-summary?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }),
        fetch(`${API}/api/analytics/sales-by-category?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }),
        fetch(`${API}/api/analytics/perfume-sales?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }),
        fetch(`${API}/api/analytics/sublimation-sales?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }),
        fetch(`${API}/api/analytics/top-products?limit=5&${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }),
        fetch(`${API}/api/analytics/location-breakdown?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        })
      ])

      if (!summaryRes.ok) {
        const errorData = await summaryRes.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al cargar resumen')
      }

      const summaryData = await summaryRes.json()
      const categoryList = categoryRes.ok ? await categoryRes.json() : []
      const perfumeList = perfumeRes.ok ? await perfumeRes.json() : []
      const sublimationList = sublimationRes.ok ? await sublimationRes.json() : []
      const topList = topRes.ok ? await topRes.json() : []
      const locationList = locationRes.ok ? await locationRes.json() : []

      setSummary({
        totalSales: summaryData.totalSales || 0,
        totalRevenue: summaryData.totalRevenue || 0,
        perfumeSales: summaryData.perfumeSales || 0,
        perfumeRevenue: summaryData.perfumeRevenue || 0,
        totalCategories: summaryData.totalCategories || 0
      })
      setCategoryData(categoryList)
      setPerfumeProducts(perfumeList)
      setSublimationProducts(sublimationList)
      setTopProducts(topList)
      setLocationBreakdown(locationList)
    } catch (error) {
      if (isAbortError(error)) return
      console.error('Dashboard load error:', error)
      toast.error(error.message || 'Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadAllPerfumes = async (signal) => {
    try {
      const [perfumeRes, fraganciaRes] = await Promise.all([
        fetch(`${API}/api/products?q=perfume&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }),
        fetch(`${API}/api/products?q=fragancia&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        })
      ])

      const datasets = []
      if (perfumeRes.ok) datasets.push(await perfumeRes.json())
      if (fraganciaRes.ok) datasets.push(await fraganciaRes.json())

      if (datasets.length > 0) {
        const combined = datasets.flatMap((dataset) => dataset.rows || [])
        const byId = new Map(combined.map((product) => [product.id, product]))
        const perfumes = Array.from(byId.values()).filter((product) =>
          product.category && (
            product.category.toLowerCase().includes('perfume')
            || product.category.toLowerCase().includes('fragancia')
          )
        )
        setAllPerfumes(perfumes)
      }
    } catch (error) {
      if (isAbortError(error)) return
      console.error('Error loading all perfumes:', error)
    }
  }

  const loadAllSublimationProducts = async (signal) => {
    try {
      const [sublimationRes, sublimacionRes] = await Promise.all([
        fetch(`${API}/api/products?q=sublimation&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }),
        fetch(`${API}/api/products?q=sublimacion&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        })
      ])

      const datasets = []
      if (sublimationRes.ok) datasets.push(await sublimationRes.json())
      if (sublimacionRes.ok) datasets.push(await sublimacionRes.json())

      if (datasets.length > 0) {
        const combined = datasets.flatMap((dataset) => dataset.rows || [])
        const byId = new Map(combined.map((product) => [product.id, product]))
        const sublimationOnly = Array.from(byId.values()).filter((product) => (
          isSublimationCategory(product.category)
        ))
        setAllSublimationProducts(sublimationOnly)
      }
    } catch (error) {
      if (isAbortError(error)) return
      console.error('Error loading all sublimation products:', error)
    }
  }

  const loadTodaySales = async (signal) => {
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
          headers: { Authorization: `Bearer ${token}` },
          signal
        }),
        fetch(`${API}/api/analytics/perfume-sales?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        })
      ])

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        const perfumeData = perfumeRes.ok ? await perfumeRes.json() : []

        const perfumeRevenue = perfumeData.reduce((sum, product) => sum + (parseFloat(product.revenue) || 0), 0)
        const perfumeUnits = perfumeData.reduce((sum, product) => sum + (parseFloat(product.units_sold) || 0), 0)

        setTodaySales({
          count: summaryData.totalSales || 0,
          revenue: summaryData.totalRevenue || 0,
          perfumeCount: perfumeUnits || 0,
          perfumeRevenue
        })
      }
    } catch (error) {
      if (isAbortError(error)) return
      console.error('Error loading today sales:', error)
    }
  }

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    loadDashboard(controller.signal)
    return () => controller.abort()
  }, [dateRange, token])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    loadAllPerfumes(controller.signal)
    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    loadAllSublimationProducts(controller.signal)
    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    loadTodaySales(controller.signal)
    return () => controller.abort()
  }, [token])

  const perfumePercentage = useMemo(() => (
    summary.totalRevenue > 0
      ? (summary.perfumeRevenue / summary.totalRevenue * 100).toFixed(1)
      : 0
  ), [summary.perfumeRevenue, summary.totalRevenue])

  const averageTicket = useMemo(() => (
    summary.totalSales > 0
      ? (summary.totalRevenue / summary.totalSales).toFixed(2)
      : '0.00'
  ), [summary.totalRevenue, summary.totalSales])

  const topCategory = useMemo(() => {
    if (categoryData.length === 0) return 'Sin datos'
    return categoryData[0]?.category || 'Sin categoria'
  }, [categoryData])

  const handlePerfumeUpdated = (updatedPerfume) => {
    setAllPerfumes((current) =>
      current.map((perfume) => (
        perfume.id === updatedPerfume.id ? updatedPerfume : perfume
      ))
    )
  }

  const handleSublimationProductUpdated = (updatedProduct) => {
    setAllSublimationProducts((current) =>
      current.map((product) => (
        product.id === updatedProduct.id ? updatedProduct : product
      ))
    )
  }

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault()
    if (!announcementMessage.trim()) {
      toast.error('Escribe un mensaje para enviar')
      return
    }

    setAnnouncementSending(true)
    try {
      const res = await fetch(`${API}/api/announcements`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al enviar el mensaje')
      }

      toast.success('Mensaje enviado a todos los usuarios')
      setAnnouncementTitle('')
      setAnnouncementMessage('')
    } catch (error) {
      toast.error(error.message || 'Error al enviar el mensaje')
    } finally {
      setAnnouncementSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-amber-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-10 h-10 text-amber-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-amber-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            Analitica visual de ventas, categorias y sucursales
          </p>
          <p className="text-sm font-medium text-blue-700">
            Vista consolidada de las 3 ubicaciones
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Calendar className="w-5 h-5 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="1">Ultimo dia</option>
              <option value="7">Ultimos 7 dias</option>
              <option value="30">Ultimos 30 dias</option>
              <option value="90">Ultimos 90 dias</option>
              <option value="365">Ultimo ano</option>
            </select>
          </div>
        </motion.div>

        <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('ventas')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'ventas'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Ventas
            </button>
            <button
              onClick={() => setActiveTab('perfumes')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'perfumes'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Perfumes
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'top'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Top productos
            </button>
            <button
              onClick={() => setActiveTab('sublimacion')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'sublimacion'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Sublimacion
            </button>
            <button
              onClick={() => setActiveTab('mensaje')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'mensaje'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mensaje global
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'clientes'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Clientes
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {activeTab === 'ventas' && (
              <>
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
                    label="Ticket Promedio"
                    value={`$${averageTicket}`}
                    color="blue"
                    delay={0.3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Categoria lider</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{topCategory}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Categorias activas</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{summary.totalCategories || 0}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Perfumes hoy</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{todaySales.perfumeCount || 0}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Ingresos hoy</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">${(todaySales.revenue || 0).toFixed(2)}</p>
                  </div>
                </div>

                <SalesInsightsPies
                  categoryData={categoryData}
                  locationBreakdown={locationBreakdown}
                  summary={summary}
                />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <TodaySales todaySales={todaySales} />
                  <MetricsTable
                    summary={summary}
                    todaySales={todaySales}
                    perfumePercentage={perfumePercentage}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <CategoriesSection categoryData={categoryData} />
                  <LocationBreakdownTable locations={locationBreakdown} />
                </div>
              </>
            )}

            {activeTab === 'perfumes' && (
              <div className="space-y-6">
                <div>
                  <PerfumeSalesSection perfumeProducts={perfumeProducts} />
                </div>
                <PerfumesInventory
                  allPerfumes={allPerfumes}
                  token={token}
                  onPerfumeUpdated={handlePerfumeUpdated}
                />
              </div>
            )}

            {activeTab === 'top' && (
              <TopProductsTable topProducts={topProducts} />
            )}

            {activeTab === 'sublimacion' && (
              <div className="space-y-6">
                <div>
                  <SublimationSalesSection sublimationProducts={sublimationProducts} />
                </div>
                <SublimationInventory
                  allSublimationProducts={allSublimationProducts}
                  token={token}
                  onProductUpdated={handleSublimationProductUpdated}
                />
              </div>
            )}

            {activeTab === 'mensaje' && (
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Mensaje global</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Envia un aviso que se mostrara una sola vez a todos los usuarios.
                </p>
                <form onSubmit={handleAnnouncementSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Titulo (opcional)
                    </label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Aviso importante"
                      className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Mensaje
                    </label>
                    <textarea
                      rows={4}
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      placeholder="Se ha cambiado el precio de..."
                      className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <Button type="submit" loading={announcementSending}>
                    Enviar a todos
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'clientes' && (
              <CustomerCampaignsTab token={token} active={activeTab === 'clientes'} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
