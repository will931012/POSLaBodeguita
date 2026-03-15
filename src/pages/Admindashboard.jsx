import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, ShoppingBag, Sparkles, Calendar, Crown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'

import StatCard from '@/components/admin/StatCard.jsx'
import TodaySales from '@/components/admin/TodaySales.jsx'
import PerfumeSalesSection from '@/components/admin/PerfumeSalesSection.jsx'
import CategoriesSection from '@/components/admin/CategoriesSection.jsx'
import TopProductsTable from '@/components/admin/TopProductsTable.jsx'
import PerfumesInventory from '@/components/admin/PerfumesInventory.jsx'
import MetricsTable from '@/components/admin/MetricsTable.jsx'
import LocationBreakdownTable from '@/components/admin/LocationBreakdownTable.jsx'
import SalesInsightsPies from '@/components/admin/SalesInsightsPies.jsx'
import CustomerCampaignsTab from '@/components/admin/CustomerCampaignsTab.jsx'
import Button from '@/components/Button.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function AdminDashboard() {
  const { token, user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [summary, setSummary] = useState({ totalSales: 0, totalRevenue: 0, perfumeSales: 0, perfumeRevenue: 0, totalCategories: 0 })
  const [categoryData, setCategoryData] = useState([])
  const [perfumeProducts, setPerfumeProducts] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [allPerfumes, setAllPerfumes] = useState([])
  const [locationBreakdown, setLocationBreakdown] = useState([])
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [announcementSending, setAnnouncementSending] = useState(false)
  const [todaySales, setTodaySales] = useState({ count: 0, revenue: 0, perfumeCount: 0, perfumeRevenue: 0 })

  const isAbortError = (error) => error?.name === 'AbortError'

  const getDateRange = (days) => {
    const parsedDays = Number.isFinite(parseInt(days, 10)) ? parseInt(days, 10) : 30
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - parsedDays)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  const loadDashboard = async (signal) => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange(dateRange)
      const params = new URLSearchParams({ startDate, endDate })

      const [summaryRes, categoryRes, perfumeRes, topRes, locationRes] = await Promise.all([
        fetch(`${API}/api/analytics/dashboard-summary?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch(`${API}/api/analytics/sales-by-category?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch(`${API}/api/analytics/perfume-sales?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch(`${API}/api/analytics/top-products?limit=5&${params}`, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch(`${API}/api/analytics/location-breakdown?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal }),
      ])

      if (!summaryRes.ok) {
        const errorData = await summaryRes.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al cargar resumen')
      }

      const summaryData = await summaryRes.json()
      setSummary({
        totalSales: summaryData.totalSales || 0,
        totalRevenue: summaryData.totalRevenue || 0,
        perfumeSales: summaryData.perfumeSales || 0,
        perfumeRevenue: summaryData.perfumeRevenue || 0,
        totalCategories: summaryData.totalCategories || 0,
      })
      setCategoryData(categoryRes.ok ? await categoryRes.json() : [])
      setPerfumeProducts(perfumeRes.ok ? await perfumeRes.json() : [])
      setTopProducts(topRes.ok ? await topRes.json() : [])
      setLocationBreakdown(locationRes.ok ? await locationRes.json() : [])
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
        fetch(`${API}/api/products?q=perfume&limit=1000`, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch(`${API}/api/products?q=fragancia&limit=1000`, { headers: { Authorization: `Bearer ${token}` }, signal }),
      ])

      const datasets = []
      if (perfumeRes.ok) datasets.push(await perfumeRes.json())
      if (fraganciaRes.ok) datasets.push(await fraganciaRes.json())

      if (datasets.length > 0) {
        const combined = datasets.flatMap((dataset) => dataset.rows || [])
        const byId = new Map(combined.map((product) => [product.id, product]))
        const perfumes = Array.from(byId.values()).filter((product) =>
          product.category && (product.category.toLowerCase().includes('perfume') || product.category.toLowerCase().includes('fragancia'))
        )
        setAllPerfumes(perfumes)
      }
    } catch (error) {
      if (isAbortError(error)) return
      console.error('Error loading all perfumes:', error)
    }
  }

  const loadTodaySales = async (signal) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const params = new URLSearchParams({ startDate: today.toISOString(), endDate: tomorrow.toISOString() })

      const [summaryRes, perfumeRes] = await Promise.all([
        fetch(`${API}/api/analytics/dashboard-summary?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch(`${API}/api/analytics/perfume-sales?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal }),
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
          perfumeRevenue,
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
    loadTodaySales(controller.signal)
    return () => controller.abort()
  }, [token])

  const perfumePercentage = useMemo(() => (
    summary.totalRevenue > 0 ? (summary.perfumeRevenue / summary.totalRevenue * 100).toFixed(1) : 0
  ), [summary.perfumeRevenue, summary.totalRevenue])

  const averageTicket = useMemo(() => (
    summary.totalSales > 0 ? (summary.totalRevenue / summary.totalSales).toFixed(2) : '0.00'
  ), [summary.totalRevenue, summary.totalSales])

  const topCategory = useMemo(() => {
    if (categoryData.length === 0) return 'Sin datos'
    return categoryData[0]?.category || 'Sin categoria'
  }, [categoryData])

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault()
    if (!announcementMessage.trim()) return toast.error('Escribe un mensaje para enviar')

    setAnnouncementSending(true)
    try {
      const res = await fetch(`${API}/api/announcements`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: announcementTitle.trim(), message: announcementMessage.trim() }),
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
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Crown className="h-10 w-10 text-accent-600" />
            <h1 className="text-5xl font-bold text-primary-950">Admin Dashboard</h1>
          </div>
          <p className="text-lg text-primary-600">Analitica visual de ventas, categorias y sucursales</p>
          <p className="text-sm font-medium text-accent-600">Vista consolidada de las 3 ubicaciones</p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Calendar className="h-5 w-5 text-primary-400" />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="rounded-xl border-2 border-primary-200 bg-[#F4F4F4] px-4 py-2 font-semibold text-primary-600 transition-colors focus:border-accent-600 focus:outline-none">
              <option value="1">Ultimo dia</option>
              <option value="7">Ultimos 7 dias</option>
              <option value="30">Ultimos 30 dias</option>
              <option value="90">Ultimos 90 dias</option>
              <option value="365">Ultimo ano</option>
            </select>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="spinner"></div></div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={ShoppingBag} label="Total Ventas" value={summary.totalSales || 0} color="purple" delay={0} />
              <StatCard icon={DollarSign} label="Ingresos Totales" value={`$${(summary.totalRevenue || 0).toFixed(2)}`} color="green" delay={0.1} />
              <StatCard icon={Sparkles} label="Ventas de Perfumes" value={summary.perfumeSales || 0} color="pink" delay={0.2} badge={`${perfumePercentage}%`} />
              <StatCard icon={TrendingUp} label="Ticket Promedio" value={`$${averageTicket}`} color="blue" delay={0.3} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">Categoria lider</p>
                <p className="mt-2 text-2xl font-bold text-primary-950">{topCategory}</p>
              </div>
              <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">Categorias activas</p>
                <p className="mt-2 text-2xl font-bold text-primary-950">{summary.totalCategories || 0}</p>
              </div>
              <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">Perfumes hoy</p>
                <p className="mt-2 text-2xl font-bold text-primary-950">{todaySales.perfumeCount || 0}</p>
              </div>
              <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">Ingresos hoy</p>
                <p className="mt-2 text-2xl font-bold text-accent-600">${(todaySales.revenue || 0).toFixed(2)}</p>
              </div>
            </div>

            <SalesInsightsPies categoryData={categoryData} locationBreakdown={locationBreakdown} summary={summary} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <TodaySales todaySales={todaySales} />
              <MetricsTable summary={summary} todaySales={todaySales} perfumePercentage={perfumePercentage} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <CategoriesSection categoryData={categoryData} />
              <LocationBreakdownTable locations={locationBreakdown} />
            </div>

            <TopProductsTable topProducts={topProducts} />

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
              <PerfumeSalesSection perfumeProducts={perfumeProducts} />
              <PerfumesInventory allPerfumes={allPerfumes} />
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-primary-950">Mensaje global</h2>
                <p className="mt-1 text-sm text-primary-500">Envia un aviso que se mostrara una sola vez a todos los usuarios.</p>
                <form onSubmit={handleAnnouncementSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-primary-600">Titulo (opcional)</label>
                    <input type="text" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} placeholder="Aviso importante" className="w-full rounded-xl border-2 border-primary-200 bg-[#F4F4F4] px-4 py-2 text-primary-600 transition-colors focus:border-accent-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-primary-600">Mensaje</label>
                    <textarea rows={4} value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} placeholder="Se ha cambiado el precio de..." className="w-full rounded-xl border-2 border-primary-200 bg-[#F4F4F4] px-4 py-2 text-primary-600 transition-colors focus:border-accent-600 focus:outline-none" />
                  </div>
                  <Button type="submit" loading={announcementSending}>Enviar a todos</Button>
                </form>
              </div>

              <CustomerCampaignsTab token={token} active />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
