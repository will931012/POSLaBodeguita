import { motion, AnimatePresence } from 'framer-motion'
import { Scan, Search, Plus } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'

export default function ProductScanner({
  searchQuery,
  setSearchQuery,
  onKeyDown,
  searchResults,
  onAddToCart,
  searching,
  searchInputRef
}) {
  const toNumber = (val) => {
    if (val === null || val === undefined) return 0
    const num = parseFloat(val)
    return isNaN(num) ? 0 : num
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Scan className="w-5 h-5 text-primary-600" />
        <span className="text-sm font-semibold text-gray-600 uppercase">
          Escanea o busca productos
        </span>
      </div>
      
      <Input
        ref={searchInputRef}
        icon={Search}
        placeholder="Escanea código de barras o busca por nombre..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
      />

      <div className="mt-2 text-xs text-gray-500">
        💡 Escanea el código de barras y presiona Enter para agregar automáticamente
      </div>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2 max-h-96 overflow-y-auto"
          >
            {searchResults.map(product => (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onAddToCart(product)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left touch-manipulation"
              >
                <div>
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-sm text-gray-600">
                    {product.upc && <span className="font-mono">UPC: {product.upc} • </span>}
                    Stock: {toNumber(product.qty)} • ${toNumber(product.price).toFixed(2)}
                  </div>
                </div>
                <Plus className="w-5 h-5 text-primary-600" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {searching && (
        <div className="mt-4 text-center text-gray-500">
          <div className="spinner mx-auto"></div>
        </div>
      )}
    </Card>
  )
}