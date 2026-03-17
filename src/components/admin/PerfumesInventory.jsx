import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react'
import ExcelTableCard from './ExcelTableCard.jsx'

const getStockStatus = (qty) => {
  if (qty === 0) return 'Agotado'
  if (qty < 5) return 'Critico'
  if (qty < 20) return 'Bajo'
  return 'OK'
}

export default function PerfumesInventory({ allPerfumes }) {
  const [upcFilter, setUpcFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [isOpen, setIsOpen] = useState(true)

  const filteredPerfumes = useMemo(() => {
    const normalizedUpc = upcFilter.trim().toLowerCase()
    const normalizedName = nameFilter.trim().toLowerCase()

    return allPerfumes.filter((perfume) => {
      const perfumeUpc = String(perfume.upc || '').toLowerCase()
      const perfumeName = String(perfume.name || '').toLowerCase()

      const matchesUpc = normalizedUpc ? perfumeUpc.includes(normalizedUpc) : true
      const matchesName = normalizedName ? perfumeName.includes(normalizedName) : true

      return matchesUpc && matchesName
    })
  }, [allPerfumes, nameFilter, upcFilter])

  const rows = filteredPerfumes.map((perfume) => {
    const stock = Number(perfume.qty) || 0

    return {
      key: perfume.id,
      upc: perfume.upc || <span className="text-slate-400">-</span>,
      name: perfume.name || 'Sin nombre',
      category: perfume.category || 'Sin categoria',
      price: `$${(Number(perfume.price) || 0).toFixed(2)}`,
      stock,
      status: getStockStatus(stock),
    }
  })

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Inventario de perfumes</h2>
              <p className="text-sm text-slate-600">
                {filteredPerfumes.length} de {allPerfumes.length} productos visibles
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isOpen ? 'Close' : 'Open'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Filtro por UPC</span>
            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 focus-within:border-blue-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={upcFilter}
                onChange={(event) => setUpcFilter(event.target.value)}
                placeholder="Buscar UPC..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Filtro por Name</span>
            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 focus-within:border-blue-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder="Buscar nombre..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
          </label>
        </div>
      </div>

      {isOpen ? (
        <ExcelTableCard
          title="Tabla de inventario"
          subtitle="Vista tipo Excel con filtros por UPC y nombre"
          icon={Sparkles}
          headers={[
            { key: 'upc', label: 'UPC', cellClassName: 'font-mono whitespace-nowrap' },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Categoria' },
            { key: 'price', label: 'Precio', cellClassName: 'font-mono whitespace-nowrap' },
            { key: 'stock', label: 'Stock', cellClassName: 'font-mono whitespace-nowrap' },
            { key: 'status', label: 'Estado', cellClassName: 'font-semibold whitespace-nowrap' },
          ]}
          rows={rows}
          emptyMessage="No hay perfumes que coincidan con los filtros"
        />
      ) : null}
    </div>
  )
}
