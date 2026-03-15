import { Calendar } from 'lucide-react'
import ExcelTableCard from './ExcelTableCard.jsx'

export default function TodaySales({ todaySales }) {
  const rows = [
    { key: 'today-total-sales', metric: 'Total Ventas', value: todaySales.count || 0 },
    { key: 'today-revenue', metric: 'Ingresos', value: `$${(todaySales.revenue || 0).toFixed(2)}` },
    { key: 'today-perfumes', metric: 'Perfumes', value: todaySales.perfumeCount || 0 },
    { key: 'today-perfume-revenue', metric: 'Rev. Perfumes', value: `$${(todaySales.perfumeRevenue || 0).toFixed(2)}` },
  ]

  return (
    <ExcelTableCard
      title="Ventas de hoy"
      subtitle={new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
      icon={Calendar}
      headers={[
        { key: 'metric', label: 'Metrica' },
        { key: 'value', label: 'Valor', cellClassName: 'font-mono' },
      ]}
      rows={rows}
    />
  )
}
