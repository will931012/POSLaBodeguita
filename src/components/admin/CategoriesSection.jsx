import { BarChart3 } from 'lucide-react'
import ExcelTableCard from './ExcelTableCard.jsx'

export default function CategoriesSection({ categoryData }) {
  const rows = categoryData.map((category, index) => ({
    key: `${category.category}-${index}`,
    category: category.category || 'Sin categoria',
    totalSales: Number(category.total_sales) || 0,
    totalUnits: Number(category.total_units) || 0,
    totalRevenue: `$${(Number(category.total_revenue) || 0).toFixed(2)}`,
  }))

  return (
    <ExcelTableCard
      title="Por categoria"
      subtitle="Ingresos y volumen del periodo"
      icon={BarChart3}
      headers={[
        { key: 'category', label: 'Categoria' },
        { key: 'totalSales', label: 'Ventas', cellClassName: 'font-mono' },
        { key: 'totalUnits', label: 'Unidades', cellClassName: 'font-mono' },
        { key: 'totalRevenue', label: 'Ingresos', cellClassName: 'font-mono' },
      ]}
      rows={rows}
      emptyMessage="No hay datos de categorias"
    />
  )
}
