import { Image as ImageIcon } from 'lucide-react'
import ExcelTableCard from './ExcelTableCard.jsx'

export default function SublimationSalesSection({ sublimationProducts }) {
  const totalUnits = sublimationProducts.reduce((sum, product) => sum + (Number(product.units_sold) || 0), 0)
  const totalRevenue = sublimationProducts.reduce((sum, product) => sum + (Number(product.revenue) || 0), 0)
  const totalSales = sublimationProducts.reduce((sum, product) => sum + (Number(product.sales_count) || 0), 0)
  const lowStockCount = sublimationProducts.filter((product) => (Number(product.current_stock) || 0) <= 3).length
  const topPerformer = sublimationProducts[0]?.name || 'Sin datos'

  const rows = sublimationProducts.slice(0, 15).map((product, index) => ({
    key: product.id,
    rank: index + 1,
    name: (
      <div className="min-w-[220px]">
        <p className="font-semibold text-slate-900">{product.name}</p>
        <p className="text-xs text-slate-500">{product.upc || 'Sin UPC'}</p>
      </div>
    ),
    category: product.category || 'Sin categoria',
    salesCount: Number(product.sales_count) || 0,
    unitsSold: Number(product.units_sold) || 0,
    revenue: `$${(Number(product.revenue) || 0).toFixed(2)}`,
    avgPrice: `$${(Number(product.avg_price) || 0).toFixed(2)}`,
    lastSalePrice: `$${(Number(product.last_sale_price) || 0).toFixed(2)}`,
    listPrice: `$${(Number(product.list_price) || 0).toFixed(2)}`,
    stock: Number(product.current_stock) || 0,
    lastSoldAt: product.last_sold_at
      ? new Date(product.last_sold_at).toLocaleString('es-DO', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : 'Sin venta reciente',
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ingresos sublimacion</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unidades vendidas</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalUnits}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ventas registradas</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalSales}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bajo stock</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{lowStockCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top sublimacion</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{topPerformer}</p>
        </div>
      </div>

      <ExcelTableCard
        title="Productos de sublimacion mas vendidos"
        subtitle="Detalle de ventas, ingresos, stock y ultima actividad"
        icon={ImageIcon}
        headers={[
          { key: 'rank', label: '#' },
          { key: 'name', label: 'Producto' },
          { key: 'category', label: 'Categoria' },
          { key: 'salesCount', label: 'Ventas', cellClassName: 'font-mono' },
          { key: 'unitsSold', label: 'Vendidas', cellClassName: 'font-mono' },
          { key: 'revenue', label: 'Ingresos', cellClassName: 'font-mono' },
          { key: 'avgPrice', label: 'Promedio', cellClassName: 'font-mono' },
          { key: 'lastSalePrice', label: 'Ult. precio', cellClassName: 'font-mono' },
          { key: 'listPrice', label: 'Precio lista', cellClassName: 'font-mono' },
          { key: 'stock', label: 'Stock', cellClassName: 'font-mono' },
          { key: 'lastSoldAt', label: 'Ultima venta' },
        ]}
        rows={rows}
        emptyMessage="No hay datos de sublimacion"
      />
    </div>
  )
}
