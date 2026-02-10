import { motion, AnimatePresence } from 'framer-motion'
import { Package, Edit2, Trash2, Check, X } from 'lucide-react'
import Card from '@components/Card'
import Button from '@components/Button'

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
  onLoadMore
}) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">UPC</th>
              <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Producto</th>
              <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Categoría</th>
              <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Precio</th>
              <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Stock</th>
              <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12">
                  <div className="spinner mx-auto"></div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No hay productos</p>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {products.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    {editingId === product.id ? (
                      <>
                        <td className="p-4">
                          <input
                            type="text"
                            value={editForm.upc}
                            onChange={(e) => setEditForm({ ...editForm, upc: e.target.value })}
                            className="w-full px-2 py-1 border rounded font-mono text-sm"
                            placeholder="UPC"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="">Sin categoría</option>
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            value={editForm.qty}
                            onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => onSaveEdit(product.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={onCancelEdit}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-mono text-sm">
                          {product.upc || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="p-4 font-semibold">
                          {product.name}
                        </td>
                        <td className="p-4">
                          {product.category ? (
                            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                              {product.category}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 font-mono">
                          ${parseFloat(product.price).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg font-semibold ${
                            product.qty < 5
                              ? 'bg-red-100 text-red-800'
                              : product.qty < 20
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.qty}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => onStartEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Load More */}
      {offset < total && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            loading={loading}
          >
            Cargar Más ({offset} de {total})
          </Button>
        </div>
      )}
    </Card>
  )
}
