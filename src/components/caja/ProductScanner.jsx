import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Scan, Search } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'

export default function ProductScanner({ searchQuery, setSearchQuery, onKeyDown, searchResults, onAddToCart, searching, searchInputRef }) {
  const toNumber = (val) => {
    if (val === null || val === undefined) return 0
    const num = parseFloat(val)
    return Number.isNaN(num) ? 0 : num
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Scan className="h-5 w-5 text-accent-600" />
        <span className="text-sm font-semibold uppercase text-primary-600">Escanea o busca productos</span>
      </div>

      <Input ref={searchInputRef} icon={Search} placeholder="Escanea codigo de barras o busca por nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={onKeyDown} autoFocus />

      <div className="mt-2 text-xs text-primary-400">Escanea el codigo y presiona Enter para agregar automaticamente.</div>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 max-h-96 space-y-2 overflow-y-auto">
            {searchResults.map((product) => (
              <motion.button key={product.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => onAddToCart(product)} className="flex w-full items-center justify-between rounded-xl bg-[#F4F4F4] p-4 text-left transition-colors hover:bg-primary-100">
                <div>
                  <div className="font-semibold text-primary-950">{product.name}</div>
                  <div className="text-sm text-primary-500">
                    {product.upc && <span className="font-mono">UPC: {product.upc} • </span>}
                    Stock: {toNumber(product.qty)} • ${toNumber(product.price).toFixed(2)}
                  </div>
                </div>
                <Plus className="h-5 w-5 text-accent-600" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {searching && (
        <div className="mt-4 text-center text-primary-400">
          <div className="spinner mx-auto"></div>
        </div>
      )}
    </Card>
  )
}
