import { ClipboardList } from 'lucide-react'
import ExcelTableCard from './ExcelTableCard.jsx'

const currency = (value) => `$${(Number(value) || 0).toFixed(2)}`

export default function MetricsTable({ summary, todaySales, perfumePercentage }) {
  const todayPerfumePercentage = (todaySales.revenue || 0) > 0
    ? ((Number(todaySales.perfumeRevenue) || 0) / Number(todaySales.revenue) * 100).toFixed(1)
    : '0.0'

  const rows = [
    {
      key: 'period-total-sales',
      metric: 'Ventas del periodo',
      period: summary.totalSales || 0,
      today: todaySales.count || 0,
    },
    {
      key: 'period-total-revenue',
      metric: 'Ingresos del periodo',
      period: currency(summary.totalRevenue),
      today: currency(todaySales.revenue),
    },
    {
      key: 'period-perfume-sales',
      metric: 'Ventas de perfumes',
      period: summary.perfumeSales || 0,
      today: todaySales.perfumeCount || 0,
    },
    {
      key: 'period-perfume-revenue',
      metric: 'Ingresos perfumes',
      period: currency(summary.perfumeRevenue),
      today: currency(todaySales.perfumeRevenue),
    },
    {
      key: 'period-perfume-share',
      metric: '% perfumes',
      period: `${perfumePercentage}%`,
      today: `${todayPerfumePercentage}%`,
    },
    {
      key: 'period-categories',
      metric: 'Categorias activas',
      period: summary.totalCategories || 0,
      today: '-',
    },
  ]

  return (
    <ExcelTableCard
      title="Resumen general"
      subtitle="Vista tipo hoja de calculo del consolidado y del movimiento de hoy"
      icon={ClipboardList}
      headers={[
        { key: 'metric', label: 'Metrica' },
        { key: 'period', label: 'Periodo', cellClassName: 'font-mono' },
        { key: 'today', label: 'Hoy', cellClassName: 'font-mono' },
      ]}
      rows={rows}
    />
  )
}
