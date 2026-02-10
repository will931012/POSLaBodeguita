import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Plus,
  Upload,
  Download,
  AlertTriangle,
} from 'lucide-react'
import Button from '@components/Button'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Html5Qrcode } from 'html5-qrcode'

// Components
import DuplicateProductModal from '@/components/inventory/DuplicateProductModal'
import AddProductForm from '@/components/inventory/AddProductForm'
import ImportCSVForm from '@/components/inventory/ImportCSVForm'
import SearchBar from '@/components/inventory/SearchBar'
import ProductsTable from '@/components/inventory/ProductsTable'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const PAGE_SIZE = 50

export default function Inventory() {
  const { token } = useAuth()
  
  // UI State
  const [mode, setMode] = useState('search')
  const [loading, setLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  
  // Products State
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  
  // Edit State
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ 
    upc: '', 
    name: '', 
    price: 0, 
    qty: 0, 
    category: '' 
  })
  
  // Add State
  const [addForm, setAddForm] = useState({ 
    upc: '', 
    name: '', 
    price: '', 
    qty: '', 
    category: '' 
  })
  
  // Import State
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)
  
  // Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateProduct, setDuplicateProduct] = useState(null)
  
  // Refs
  const fileInputRef = useRef(null)
  const searchTimerRef = useRef(null)
  const searchInputRef = useRef(null)
  const fileInputCameraRef = useRef(null)
  const skipReloadRef = useRef(false)

  // ============================================
  // CAMERA SCANNER
  // ============================================
  const handleNativeCameraCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsScanning(true)
      toast.info('Analizando imagen...')
      
      const html5QrCode = new Html5Qrcode("temp-file-scanner")
      
      try {
        const decodedText = await html5QrCode.scanFile(file, false)
        
        if (navigator.vibrate) navigator.vibrate(200)
        
        const found = await searchProductByUPC(decodedText)
        if (found) toast.success('¡Producto encontrado!')
      } catch {
        toast.error('No se pudo detectar código de barras')
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100])
      } finally {
        html5QrCode.clear()
      }
    } catch (error) {
      console.error('Error al procesar imagen:', error)
      toast.error('Error al procesar la imagen')
    } finally {
      setIsScanning(false)
      e.target.value = ''
    }
  }

  // ============================================
  // SEARCH BY UPC
  // ============================================
  const searchProductByUPC = async (upc) => {
    try {
      const params = new URLSearchParams({ q: upc, limit: '50' })
      const res = await fetch(`${API}/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Search failed')
      
      const data = await res.json()
      const exactMatch = data.rows?.find(p => p.upc === upc)
      
      if (exactMatch) {
        skipReloadRef.current = true
        setProducts([exactMatch])
        setTotal(1)
        setOffset(1)
        startEdit(exactMatch)
        return true
      } else {
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
        setTimeout(() => {
          setSearchQuery('')
          searchInputRef.current?.focus()
        }, 100)
      }
    }
  }

  // ============================================
  // LOAD PRODUCTS
  // ============================================
  const loadCategories = async () => {
    try {
      const res = await fetch(`${API}/api/products/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load categories')
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Categories load error:', error)
    }
  }

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
        headers: { Authorization: `Bearer ${token}` }
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
    if (token) loadCategories()
  }, [token])

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    
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
      category: product.category || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ upc: '', name: '', price: 0, qty: 0, category: '' })
  }

  const saveEdit = async (id) => {
    try {
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm),
      })

      if (!res.ok) throw new Error('Failed to update')

      const updated = await res.json()
      setProducts(products.map(p => p.id === id ? updated : p))
      setEditingId(null)
      loadCategories()
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
        headers: { Authorization: `Bearer ${token}` }
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
      // Check for duplicate UPC
      if (addForm.upc) {
        const checkRes = await fetch(`${API}/api/products?q=${addForm.upc}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (checkRes.ok) {
          const checkData = await checkRes.json()
          const existing = checkData.rows?.find(p => p.upc === addForm.upc)
          
          if (existing) {
            setDuplicateProduct(existing)
            setShowDuplicateModal(true)
            return
          }
        }
      }

      const res = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          upc: addForm.upc || null,
          name: addForm.name,
          price: parseFloat(addForm.price),
          qty: parseInt(addForm.qty) || 0,
          category: addForm.category || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to create')

      const newProduct = await res.json()
      setProducts([newProduct, ...products])
      setTotal(total + 1)
      setAddForm({ upc: '', name: '', price: '', qty: '', category: '' })
      setMode('search')
      loadCategories()
      toast.success('Producto creado')
    } catch (error) {
      console.error('Create error:', error)
      toast.error('Error al crear producto')
    }
  }

  // ============================================
  // IMPORT/EXPORT
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
        headers: { Authorization: `Bearer ${token}` },
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
      ['upc', 'name', 'category', 'price', 'qty'],
      ...products.map(p => [p.upc || '', p.name, p.category || '', p.price, p.qty])
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
    <div className="h-screen overflow-y-auto">
      <div className="space-y-6 p-6">
        {/* Hidden elements */}
        <div id="temp-file-scanner" style={{ display: 'none' }} />
        <input
          ref={fileInputCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraCapture}
          style={{ display: 'none' }}
        />

        {/* Duplicate Modal */}
        <DuplicateProductModal
          show={showDuplicateModal}
          product={duplicateProduct}
          onClose={() => setShowDuplicateModal(false)}
          onEdit={() => {
            setShowDuplicateModal(false)
            setMode('search')
            startEdit(duplicateProduct)
          }}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Inventario</h1>
            <p className="text-gray-600 mt-1">
              {total} productos • {mode === 'low' ? 'Stock Bajo' : 'Todos'}
            </p>
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
          <AddProductForm
            addForm={addForm}
            setAddForm={setAddForm}
            categories={categories}
            onSubmit={addProduct}
            onCancel={() => setMode('search')}
          />
        )}

        {/* Import CSV */}
        {mode === 'import' && (
          <ImportCSVForm
            importFile={importFile}
            setImportFile={setImportFile}
            importResult={importResult}
            importing={importing}
            onPreview={() => handleImport(true)}
            onImport={() => handleImport(false)}
            onCancel={() => {
              setMode('search')
              setImportFile(null)
              setImportResult(null)
            }}
            fileInputRef={fileInputRef}
          />
        )}

        {/* Search Bar */}
        {(mode === 'search' || mode === 'low') && (
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onKeyDown={handleSearchKeyDown}
            onCameraClick={() => fileInputCameraRef.current?.click()}
            isScanning={isScanning}
            searchInputRef={searchInputRef}
          />
        )}

        {/* Products Table */}
        {(mode === 'search' || mode === 'low') && (
          <ProductsTable
            products={products}
            loading={loading}
            editingId={editingId}
            editForm={editForm}
            setEditForm={setEditForm}
            categories={categories}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onStartEdit={startEdit}
            onDelete={deleteProduct}
            offset={offset}
            total={total}
            onLoadMore={() => loadProducts(false)}
          />
        )}
      </div>
    </div>
  )
}
