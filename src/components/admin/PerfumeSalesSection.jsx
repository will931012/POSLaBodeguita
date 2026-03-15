import { Sparkles } from 'lucide-react'
import ExcelTableCard from './ExcelTableCard.jsx'

export default function PerfumeSalesSection({ perfumeProducts }) {
  const rows = perfumeProducts.slice(0, 15).map((product, index) => ({
    key: product.id,
    rank: index + 1,
    name: product.name,
    category: product.category || 'Sin categoria',
    unitsSold: Number(product.units_sold) || 0,
    revenue: `$${(Number(product.revenue) || 0).toFixed(2)}`,
    avgPrice: `$${(Number(product.avg_price) || 0).toFixed(2)}`,
    stock: Number(product.current_stock) || 0,
  }))

  return (
    <div className="lg:col-span-2">
      <ExcelTableCard
        title="Perfumes mas vendidos"
        subtitle="Rendimiento por producto en formato de tabla"
        icon={Sparkles}
        headers={[
          { key: 'rank', label: '#' },
          { key: 'name', label: 'Producto' },
          { key: 'category', label: 'Categoria' },
          { key: 'unitsSold', label: 'Vendidas', cellClassName: 'font-mono' },
          { key: 'revenue', label: 'Ingresos', cellClassName: 'font-mono text-accent-600 font-semibold' },
          { key: 'avgPrice', label: 'Promedio', cellClassName: 'font-mono' },
          { key: 'stock', label: 'Stock', cellClassName: 'font-mono' },
        ]}
        rows={rows}
        emptyMessage="No hay datos de perfumes"
      />
    </div>
  )
}
