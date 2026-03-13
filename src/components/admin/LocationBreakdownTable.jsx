import { Building2 } from 'lucide-react'
import ExcelTableCard from './ExcelTableCard.jsx'

const currency = (value) => `$${(Number(value) || 0).toFixed(2)}`

export default function LocationBreakdownTable({ locations }) {
  const rows = locations.map((location) => {
    const totalRevenue = Number(location.total_revenue) || 0
    const perfumeRevenue = Number(location.perfume_revenue) || 0
    const perfumeShare = totalRevenue > 0
      ? `${((perfumeRevenue / totalRevenue) * 100).toFixed(1)}%`
      : '0%'

    return {
      key: location.location_id,
      location: location.location_name,
      sales: Number(location.total_sales) || 0,
      revenue: currency(totalRevenue),
      perfumeSales: Number(location.perfume_sales) || 0,
      perfumeRevenue: currency(perfumeRevenue),
      perfumeShare,
    }
  })

  return (
    <ExcelTableCard
      title="Desglose por ubicacion"
      subtitle="Comparativo consolidado por sucursal en el rango seleccionado"
      icon={Building2}
      headers={[
        { key: 'location', label: 'Ubicacion' },
        { key: 'sales', label: 'Ventas', cellClassName: 'font-mono' },
        { key: 'revenue', label: 'Ingresos', cellClassName: 'font-mono' },
        { key: 'perfumeSales', label: 'Ventas perfumes', cellClassName: 'font-mono' },
        { key: 'perfumeRevenue', label: 'Ingresos perfumes', cellClassName: 'font-mono' },
        { key: 'perfumeShare', label: '% perfumes', cellClassName: 'font-mono' },
      ]}
      rows={rows}
      emptyMessage="No hay sucursales con datos para este rango"
    />
  )
}
