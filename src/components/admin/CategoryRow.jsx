import { Package } from 'lucide-react'

export default function CategoryRow({ category }) {
  const revenue = parseFloat(category.total_revenue) || 0
  
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{category.category}</p>
          <p className="text-xs text-gray-500">{category.total_units || 0} unidades</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-green-600">${revenue.toFixed(2)}</p>
        <p className="text-xs text-gray-500">{category.total_sales || 0} ventas</p>
      </div>
    </div>
  )
}