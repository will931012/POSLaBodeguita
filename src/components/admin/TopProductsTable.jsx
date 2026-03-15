import { Crown } from 'lucide-react'
import ExcelTableCard from './ExcelTableCard.jsx'

export default function TopProductsTable({ topProducts }) {
  const rows = topProducts.map((product, index) => ({
    key: product.id,
    rank: index + 1,
    product: product.name,
    category: product.category || 'Sin categoria',
    sold: product.units_sold || 0,
    revenue: `$${(parseFloat(product.revenue) || 0).toFixed(2)}`,
    stock: product.current_stock || 0,
  }))

  return (
    <ExcelTableCard
      title="Top 5 Productos"
      subtitle="Mejores vendedores del periodo en formato tipo Excel"
      icon={Crown}
      headers={[
        { key: 'rank', label: '#' },
        { key: 'product', label: 'Producto' },
        { key: 'category', label: 'Categoria' },
        { key: 'sold', label: 'Vendidas', cellClassName: 'font-mono' },
        { key: 'revenue', label: 'Ingresos', cellClassName: 'font-mono text-accent-600 font-semibold' },
        { key: 'stock', label: 'Stock', cellClassName: 'font-mono' },
      ]}
      rows={rows}
      emptyMessage="No hay productos para mostrar"
    />
  )
}
