import { Package } from 'lucide-react'

export default function CategoryRow({ category }) {
  const revenue = parseFloat(category.total_revenue) || 0

  return (
    <div className="flex items-center justify-between rounded-xl bg-[#F4F4F4] p-3 transition-colors hover:bg-primary-100">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-950">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-primary-950">{category.category}</p>
          <p className="text-xs text-primary-400">{category.total_units || 0} unidades</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-accent-600">${revenue.toFixed(2)}</p>
        <p className="text-xs text-primary-400">{category.total_sales || 0} ventas</p>
      </div>
    </div>
  )
}
