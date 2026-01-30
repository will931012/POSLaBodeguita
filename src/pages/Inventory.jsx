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
  Scan,
  Camera,
} from 'lucide-react'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Html5Qrcode } from 'html5-qrcode'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const PAGE_SIZE = 50

export default function Inventory() {
  const { token } = useAuth()
  const [mode, setMode] = useState('search')
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ upc: '', name: '', price: 0, qty: 0 })
  
  const [addForm, setAddForm] = useState({ upc: '', name: '', price: '', qty: '' })
  
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)
  
  // Camera scanner
  const [isScanning, setIsScanning] = useState(false)
  
  const fileInputRef = useRef(null)
  const searchTimerRef = useRef(null)
  const searchInputRef = useRef(null)
  const fileInputCameraRef = useRef(null)
  const skipReloadRef = useRef(false) // Flag para evitar recarga después de escaneo

  // ============================================
  // NATIVE CAMERA SCANNER
  // ============================================
  const handleNativeCameraCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsScanning(true)
      toast.info('Analizando imagen...')
      
      console.log('📷 Procesando imagen:', file.name)
      
      // Crear instancia de Html5Qrcode para escanear archivo
      const html5QrCode = new Html5Qrcode("temp-file-scanner")
      
      try {
        // Escanear el archivo de imagen
        const decodedText = await html5QrCode.scanFile(file, false)
        console.log('✅ Código detectado:', decodedText)
        
        // Vibrar si está disponible
        if (navigator.vibrate) {
          navigator.vibrate(200)
        }
        
        // Buscar producto por UPC
        const found = await searchProductByUPC(decodedText)
        
        if (found) {
          toast.success('¡Producto encontrado!')
        }
        
      } catch (scanError) {
        console.error('❌ Error al escanear:', scanError)
        toast.error('No se pudo detectar código de barras. Asegúrate de que el código esté visible y enfocado.')
        
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 100])
        }
      } finally {
        // Limpiar
        html5QrCode.clear()
      }
      
    } catch (error) {
      console.error('Error al procesar imagen:', error)
      toast.error('Error al procesar la imagen')
    } finally {
      setIsScanning(false)
      // Reset input para poder tomar otra foto
      e.target.value = ''
    }
  }

  // ============================================
  // BARCODE SCANNER - BÚSQUEDA EXACTA POR UPC
  // ============================================
  const searchProductByUPC = async (upc) => {
    try {
      console.log('🔍 Buscando producto por UPC:', upc)
      
      const params = new URLSearchParams({
        q: upc,
        limit: '50',
      })

      const res = await fetch(`${API}/api/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!res.ok) throw new Error('Search failed')
      
      const data = await res.json()
      const allProducts = data.rows || []
      
      const exactMatch = allProducts.find(p => p.upc === upc)
      
      if (exactMatch) {
        console.log('✅ Producto encontrado:', exactMatch.name)
        
        // Activar flag para evitar recarga
        skipReloadRef.current = true
        
        setProducts([exactMatch])
        setTotal(1)
        setOffset(1)
        
        startEdit(exactMatch)
        
        return true
      } else {
        console.log('❌ No se encontró producto con UPC:', upc)
        toast.error(`Producto no encontrado: ${upc}`)
        return false
      }
    } catch (error) {
      console.error('Error buscando por UPC:', error)
      toast.error('Error al buscar producto')
      return false
    }
  }

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()
      
      const found = await searchProductByUPC(searchQuery.trim())
      
      if (found) {
        // Limpiar input después de encontrar
        setTimeout(() => {
          setSearchQuery('')
          if (searchInputRef.current) {
            searchInputRef.current.focus()
          }
        }, 100)
      }
    }
  }

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

      const res = await fetch(`${API}/api/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
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

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    
    // Si acabamos de escanear, no recargar
    if (skipReloadRef.current) {
      skipReloadRef.current = false
      return
    }
    
    if (searchQuery && searchQuery.length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        setProducts([])
        setOffset(0)
        loadProducts(true)
      }, 500)
    } else if (!searchQuery) {
      setProducts([])
      setOffset(0)
      loadProducts(true)
    }

    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery, mode])

  // ============================================
  // CRUD OPERATIONS
  // ============================================
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
    try {
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm),
      })

      if (!res.ok) throw new Error('Failed to update')

      const updated = await res.json()
      setProducts(products.map(p => p.id === id ? updated : p))
      setEditingId(null)
      toast.success('Producto actualizado')
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Error al actualizar producto')
    }
  }

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return

    try {
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Failed to delete')

      setProducts(products.filter(p => p.id !== id))
      setTotal(total - 1)
      toast.success('Producto eliminado')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Error al eliminar producto')
    }
  }

  const addProduct = async (e) => {
    e.preventDefault()

    if (!addForm.name || !addForm.price) {
      toast.error('Nombre y precio son obligatorios')
      return
    }

    try {
      const res = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          upc: addForm.upc || null,
          name: addForm.name,
          price: parseFloat(addForm.price),
          qty: parseInt(addForm.qty) || 0,
        }),
      })

      if (!res.ok) throw new Error('Failed to create')

      const newProduct = await res.json()
      setProducts([newProduct, ...products])
      setTotal(total + 1)
      setAddForm({ upc: '', name: '', price: '', qty: '' })
      setMode('search')
      toast.success('Producto creado')
    } catch (error) {
      console.error('Create error:', error)
      toast.error('Error al crear producto')
    }
  }

  // ============================================
  // IMPORT/EXPORT CSV
  // ============================================
  const handleImport = async (dryRun = false) => {
    if (!importFile) {
      toast.error('Selecciona un archivo CSV')
      return
    }

    try {
      setImporting(true)
      const formData = new FormData()
      formData.append('file', importFile)

      const res = await fetch(`${API}/api/import/products?dryRun=${dryRun ? '1' : '0'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      })

      if (!res.ok) throw new Error('Import failed')

      const result = await res.json()
      setImportResult(result)

      if (!dryRun) {
        toast.success(`Importados ${result.imported} productos`)
        loadProducts(true)
        setImportFile(null)
        setMode('search')
      } else {
        toast.info('Vista previa generada')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Error al importar')
    } finally {
      setImporting(false)
    }
  }

  const exportProducts = () => {
    const csv = [
      ['upc', 'name', 'price', 'qty'],
      ...products.map(p => [p.upc || '', p.name, p.price, p.qty])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventario-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Inventario exportado')
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Div oculto para scanFile */}
      <div id="temp-file-scanner" style={{ display: 'none' }} />
      
      {/* Input oculto para cámara nativa */}
      <input
        ref={fileInputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCameraCapture}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Inventario</h1>
          <p className="text-gray-600 mt-1">
            {total} productos • {mode === 'low' ? 'Stock Bajo' : 'Todos'}
          </p>
        </div>

        <div className="flex sticky flex-wrap gap-2">
          <Button
            variant={mode === 'search' ? 'primary' : 'outline'}
            icon={Search}
            onClick={() => setMode('search')}
          >
            Buscar
          </Button>
          <Button
            variant={mode === 'low' ? 'primary' : 'outline'}
            icon={AlertTriangle}
            onClick={() => setMode('low')}
          >
            Stock Bajo
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
            variant="outline"
            icon={Download}
            onClick={exportProducts}
            disabled={products.length === 0}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Add Product Form */}
      {mode === 'add' && (
        <Card title="Agregar Producto" icon={Plus}>
          <form onSubmit={addProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="UPC (Código de Barras)"
                placeholder="123456789"
                value={addForm.upc}
                onChange={(e) => setAddForm({ ...addForm, upc: e.target.value })}
              />
              <Input
                label="Nombre *"
                placeholder="Nombre del producto"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
              />
              <Input
                label="Precio *"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={addForm.price}
                onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                required
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
                Crear Producto
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode('search')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Import CSV */}
      {mode === 'import' && (
        <Card title="Importar Productos (CSV)" icon={Upload}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Formato CSV: upc,name,price,qty
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            {importResult && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold mb-2">Resultado de Importación</h3>
                <p>Importados: {importResult.imported}</p>
                <p>Errores: {importResult.errors}</p>
                {importResult.preview && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Vista Previa:</p>
                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(importResult.preview, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => handleImport(true)}
                loading={importing}
                disabled={!importFile}
                variant="outline"
              >
                Vista Previa
              </Button>
              <Button
                onClick={() => handleImport(false)}
                loading={importing}
                disabled={!importFile}
                icon={Upload}
              >
                Importar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMode('search')
                  setImportFile(null)
                  setImportResult(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search Box */}
      {(mode === 'search' || mode === 'low') && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-semibold text-gray-600 uppercase">
                Buscar Productos
              </span>
            </div>
            
            {/* Botón de cámara para móviles */}
            <Button
              variant="outline"
              icon={Camera}
              onClick={() => fileInputCameraRef.current?.click()}
              loading={isScanning}
              className="md:hidden"
            >
              {isScanning ? '...' : 'Foto'}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                ref={searchInputRef}
                icon={Search}
                placeholder="Escanea UPC o busca por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            
            {/* Botón de cámara para desktop */}
            <Button
              variant="outline"
              icon={Camera}
              onClick={() => fileInputCameraRef.current?.click()}
              loading={isScanning}
              className="hidden md:flex"
            >
              {isScanning ? 'Analizando...' : 'Tomar Foto'}
            </Button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            💡 Tip: Escanea con escáner físico (Enter) o toma foto del código con la cámara
          </div>
        </Card>
      )}

      {/* Products Table */}
      {(mode === 'search' || mode === 'low') && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">UPC</th>
                  <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Producto</th>
                  <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Precio</th>
                  <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Stock</th>
                  <th className="text-left p-4 font-bold text-sm text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
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
                                  onClick={() => saveEdit(product.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Guardar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
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
                                  onClick={() => startEdit(product)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteProduct(product.id)}
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
                onClick={() => loadProducts(false)}
                loading={loading}
              >
                Cargar Más ({offset} de {total})
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}