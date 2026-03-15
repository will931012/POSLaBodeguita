import { motion, AnimatePresence } from 'framer-motion'
import { Check, Edit2, Package, Trash2, X } from 'lucide-react'
import Card from '@components/Card'
import Button from '@components/Button'

const inputClass = 'w-full rounded border border-primary-200 bg-white px-2 py-1 text-primary-600'

export default function ProductsTable({
  products,
  loading,
  editingId,
  editForm,
  setEditForm,
  categories,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  offset,
  total,
  onLoadMore,
}) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-primary-100">
              <th className="p-4 text-left text-sm font-bold uppercase text-primary-500">UPC</th>
              <th className="p-4 text-left text-sm font-bold uppercase text-primary-500">Producto</th>
              <th className="p-4 text-left text-sm font-bold uppercase text-primary-500">Categoria</th>
              <th className="p-4 text-left text-sm font-bold uppercase text-primary-500">Precio</th>
              <th className="p-4 text-left text-sm font-bold uppercase text-primary-500">Stock</th>
              <th className="p-4 text-left text-sm font-bold uppercase text-primary-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="spinner mx-auto"></div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-primary-400">
                  <Package className="mx-auto mb-2 h-12 w-12 opacity-30" />
                  <p>No hay productos</p>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {products.map((product) => (
                  <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-primary-100 hover:bg-[#F4F4F4]">
                    {editingId === product.id ? (
                      <>
                        <td className="p-4"><input type="text" value={editForm.upc} onChange={(e) => setEditForm({ ...editForm, upc: e.target.value })} className={`${inputClass} font-mono text-sm`} placeholder="UPC" /></td>
                        <td className="p-4"><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} /></td>
                        <td className="p-4">
                          <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputClass}>
                            <option value="">Sin categoria</option>
                            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                          </select>
                        </td>
                        <td className="p-4"><input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-24 rounded border border-primary-200 bg-white px-2 py-1 text-primary-600" /></td>
                        <td className="p-4"><input type="number" value={editForm.qty} onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })} className="w-20 rounded border border-primary-200 bg-white px-2 py-1 text-primary-600" /></td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button onClick={() => onSaveEdit(product.id)} className="rounded-lg p-2 text-accent-600 transition-colors hover:bg-accent-50" title="Guardar"><Check className="h-4 w-4" /></button>
                            <button onClick={onCancelEdit} className="rounded-lg p-2 text-primary-500 transition-colors hover:bg-primary-50" title="Cancelar"><X className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-mono text-sm text-primary-600">{product.upc || <span className="text-primary-300">-</span>}</td>
                        <td className="p-4 font-semibold text-primary-950">{product.name}</td>
                        <td className="p-4">
                          {product.category ? <span className="rounded-lg bg-primary-100 px-2 py-1 text-sm font-medium text-primary-700">{product.category}</span> : <span className="text-primary-300">-</span>}
                        </td>
                        <td className="p-4 font-mono text-primary-600">${parseFloat(product.price).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`rounded-lg px-2 py-1 font-semibold ${
                            product.qty < 5 ? 'bg-accent-50 text-accent-700' : product.qty < 20 ? 'bg-primary-100 text-primary-700' : 'bg-[#F4F4F4] text-primary-600'
                          }`}>
                            {product.qty}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button onClick={() => onStartEdit(product)} className="rounded-lg p-2 text-primary-600 transition-colors hover:bg-primary-50" title="Editar"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => onDelete(product.id)} className="rounded-lg p-2 text-accent-600 transition-colors hover:bg-accent-50" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {offset < total && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onLoadMore} loading={loading}>
            Cargar mas ({offset} de {total})
          </Button>
        </div>
      )}
    </Card>
  )
}
