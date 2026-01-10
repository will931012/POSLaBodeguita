import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Upload,
  Download,
  AlertTriangle,
  Check,
  X,
  Printer,
  FileSpreadsheet,
} from 'lucide-react'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const PAGE_SIZE = 50

export default function Inventory() {
  const [mode, setMode] = useState('search') // 'search' | 'add' | 'import' | 'low'
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Edición inline
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ upc: '', name: '', price: 0, qty: 0 })
  
  // Formulario de agregar
  const [addForm, setAddForm] = useState({ upc: '', name: '', price: '', qty: '' })
  
  // Importación
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)
  
  const fileInputRef = useRef(null)
  const searchTimerRef = useRef(null)

  // ============================================
  // BÚSQUEDA Y CARGA
  // ============================================
  const loadProducts = async (reset = false) => {
    try {
      setLoading(true)
      const newOffset = reset ? 0 : offset
      
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(newOffset),
        ...(searchQuery && { q: searchQuery }),
        ...(mode === 'low' && { low: '1' }),
      })

      const res = await fetch(`${API}/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to load products')
      
      const data = await res.json()
      
      if (reset) {
        setProducts(data.rows)
        setOffset(data.rows.length)
      } else {
        setProducts([...products, ...data.rows])
        setOffset(offset + data.rows.length)
      }
      
      setTotal(data.total)
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    
    searchTimerRef.current = setTimeout(() => {
      setProducts([])
      setOffset(0)
      loadProducts(true)
    }, 300)

    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery, mode])

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  const addProduct = async (e) => {
    e.preventDefault()
    
    if (!addForm.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      const res = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upc: addForm.upc.trim() || null,
          name: addForm.name.trim(),
          price: parseFloat(addForm.price) || 0,
          qty: parseInt(addForm.qty) || 0,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al crear producto')
      }

      toast.success('Producto agregado exitosamente')
      setAddForm({ upc: '', name: '', price: '', qty: '' })
      setMode('search')
      loadProducts(true)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditForm({
      upc: product.upc || '',
      name: product.name,
      price: product.price,
      qty: product.qty,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ upc: '', name: '', price: 0, qty: 0 })
  }

  const saveEdit = async (id) => {
    if (!editForm.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upc: editForm.upc.trim() || null,
          name: editForm.name.trim(),
          price: parseFloat(editForm.price),
          qty: parseInt(editForm.qty),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        if (error.error?.includes('UNIQUE constraint')) {
          throw new Error('Este UPC ya existe')
        }
        throw new Error(error.error || 'Error al actualizar')
      }

      const updated = await res.json()
      setProducts(products.map(p => p.id === id ? updated : p))
      cancelEdit()
      toast.success('Producto actualizado')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteProduct = async (id, name) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return

    try {
      const res = await fetch(`${API}/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')

      setProducts(products.filter(p => p.id !== id))
      setTotal(total - 1)
      toast.success('Producto eliminado')
    } catch (error) {
      toast.error('No se pudo eliminar el producto')
    }
  }

  // ============================================
  // IMPORTACIÓN/EXPORTACIÓN
  // ============================================
  const exportCSV = () => {
    const header = ['id', 'upc', 'name', 'price', 'qty']
    const rows = products.map(p => [
      p.id,
      p.upc || '',
      `"${p.name}"`,
      p.price,
      p.qty,
    ])
    
    const csv = [header, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado')
  }

  const downloadTemplate = () => {
    const csv = 'upc,name,price,qty\n012345678905,Ejemplo Producto,1.99,100'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'plantilla_importacion.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Plantilla descargada')
  }

  const handleImport = async (dryRun = true) => {
    if (!importFile) {
      toast.error('Selecciona un archivo primero')
      return
    }

    try {
      setImporting(true)
      const formData = new FormData()
      formData.append('file', importFile)

      const res = await fetch(`${API}/api/import/products?dryRun=${dryRun ? '1' : '0'}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error en la importación')
      }

      const result = await res.json()
      setImportResult(result)
      
      if (!dryRun) {
        toast.success('Importación completada')
        setImportFile(null)
        setImportResult(null)
        loadProducts(true)
      } else {
        toast.success('Simulación completada')
      }
    } catch (error) {
      toast.error(error.message)
      setImportResult({ error: error.message })
    } finally {
      setImporting(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Inventario</h1>
          <p className="text-gray-600 mt-1">Gestiona tus productos</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === 'search' ? 'primary' : 'outline'}
            icon={Search}
            onClick={() => setMode('search')}
          >
            Buscar
          </Button>
          <Button
            variant={mode === 'add' ? 'primary' : 'outline'}
            icon={Plus}
            onClick={() => setMode('add')}
          >
            Agregar
          </Button>
          <Button
            variant={mode === 'import' ? 'primary' : 'outline'}
            icon={Upload}
            onClick={() => setMode('import')}
          >
            Importar
          </Button>
          <Button
            variant={mode === 'low' ? 'primary' : 'outline'}
            icon={AlertTriangle}
            onClick={() => setMode('low')}
          >
            Stock Bajo
          </Button>
        </div>
      </div>

      {/* MODO: AGREGAR PRODUCTO */}
      {mode === 'add' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card title="Agregar Producto" icon={Plus}>
            <form onSubmit={addProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="UPC / Código de Barras"
                  placeholder="Opcional"
                  value={addForm.upc}
                  onChange={(e) => setAddForm({ ...addForm, upc: e.target.value })}
                />
                <Input
                  label="Nombre del Producto *"
                  placeholder="Obligatorio"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
                <Input
                  label="Precio"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addForm.price}
                  onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                />
                <Input
                  label="Cantidad"
                  type="number"
                  placeholder="0"
                  value={addForm.qty}
                  onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" icon={Check}>
                  Guardar Producto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddForm({ upc: '', name: '', price: '', qty: '' })}
                >
                  Limpiar
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* MODO: IMPORTAR */}
      {mode === 'import' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card title="Importar Productos" icon={Upload}>
            <div className="space-y-6">
              {/* Botones de ayuda */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  icon={Download}
                  onClick={downloadTemplate}
                >
                  Descargar Plantilla
                </Button>
                <Button
                  variant="outline"
                  icon={FileSpreadsheet}
                  onClick={exportCSV}
                  disabled={products.length === 0}
                >
                  Exportar Inventario Actual
                </Button>
              </div>

              {/* Selector de archivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Seleccionar Archivo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setImportFile(file)
                      setImportResult(null)
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Formatos: CSV, XLSX, XLS • Columnas requeridas: upc, name, price, qty
                </p>
              </div>

              {/* Botones de importación */}
              {importFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex gap-2"
                >
                  <Button
                    variant="secondary"
                    onClick={() => handleImport(true)}
                    loading={importing}
                    disabled={importing}
                  >
                    🔍 Simular (Sin Cambios)
                  </Button>
                  <Button
                    onClick={() => handleImport(false)}
                    loading={importing}
                    disabled={importing}
                  >
                    ✅ Confirmar Importación
                  </Button>
                </motion.div>
              )}

              {/* Resultado de importación */}
              {importResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl ${
                    importResult.error
                      ? 'bg-red-50 border-2 border-red-200'
                      : 'bg-blue-50 border-2 border-blue-200'
                  }`}
                >
                  {importResult.error ? (
                    <div className="text-red-800">
                      <div className="font-bold mb-1">❌ Error</div>
                      <div>{importResult.error}</div>
                    </div>
                  ) : (
                    <div className="text-blue-800 space-y-1">
                      <div className="font-bold">
                        {importResult.dryRun ? '🔍 Simulación' : '✅ Importación Completada'}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        <div className="bg-white p-2 rounded">
                          <div className="text-xs text-gray-600">Total Filas</div>
                          <div className="font-bold">{importResult.totalRows}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-xs text-gray-600">Insertados</div>
                          <div className="font-bold text-green-600">{importResult.inserted}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-xs text-gray-600">Actualizados</div>
                          <div className="font-bold text-blue-600">{importResult.updated}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-xs text-gray-600">Omitidos</div>
                          <div className="font-bold text-gray-600">{importResult.skipped}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* MODO: BÚSQUEDA / STOCK BAJO */}
      {(mode === 'search' || mode === 'low') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Búsqueda */}
          {mode === 'search' && (
            <Card>
              <Input
                icon={Search}
                placeholder="Buscar por nombre o UPC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Card>
          )}

          {mode === 'low' && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">
                  Mostrando productos con stock menor a 5 unidades
                </span>
              </div>
            </div>
          )}

          {/* Tabla de productos */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-bold text-sm text-gray-600 uppercase">ID</th>
                    <th className="text-left p-3 font-bold text-sm text-gray-600 uppercase">UPC</th>
                    <th className="text-left p-3 font-bold text-sm text-gray-600 uppercase">Nombre</th>
                    <th className="text-left p-3 font-bold text-sm text-gray-600 uppercase">Precio</th>
                    <th className="text-left p-3 font-bold text-sm text-gray-600 uppercase">Stock</th>
                    <th className="text-left p-3 font-bold text-sm text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 && !loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No hay productos {mode === 'low' ? 'con stock bajo' : 'para mostrar'}</p>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {products.map((product) => {
                        const editing = editingId === product.id
                        const lowStock = product.qty < 5

                        return (
                          <motion.tr
                            key={product.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-3 font-mono text-sm">{product.id}</td>
                            
                            <td className="p-3">
                              {editing ? (
                                <Input
                                  value={editForm.upc}
                                  onChange={(e) => setEditForm({ ...editForm, upc: e.target.value })}
                                  placeholder="UPC"
                                  className="!py-1 !px-2 text-sm"
                                />
                              ) : (
                                <span className="font-mono text-sm">{product.upc || '-'}</span>
                              )}
                            </td>
                            
                            <td className="p-3">
                              {editing ? (
                                <Input
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  placeholder="Nombre"
                                  className="!py-1 !px-2 text-sm"
                                />
                              ) : (
                                <span className="font-semibold">{product.name}</span>
                              )}
                            </td>
                            
                            <td className="p-3">
                              {editing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                  className="!py-1 !px-2 text-sm w-24"
                                />
                              ) : (
                                <span className="font-mono font-semibold text-primary-600">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </td>
                            
                            <td className="p-3">
                              {editing ? (
                                <Input
                                  type="number"
                                  value={editForm.qty}
                                  onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })}
                                  className="!py-1 !px-2 text-sm w-20"
                                />
                              ) : (
                                <span className={`font-mono font-semibold ${
                                  lowStock ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {product.qty}
                                  {lowStock && <AlertTriangle className="inline w-4 h-4 ml-1" />}
                                </span>
                              )}
                            </td>
                            
                            <td className="p-3">
                              {editing ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => saveEdit(product.id)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Guardar"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEdit(product)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => window.open(`/label/${product.id}`, '_blank')}
                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Imprimir Etiqueta"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteProduct(product.id, product.name)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {products.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {products.length} de {total} productos
                </div>
                
                {products.length < total && (
                  <Button
                    variant="outline"
                    onClick={() => loadProducts(false)}
                    loading={loading}
                  >
                    Cargar Más
                  </Button>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  )
}