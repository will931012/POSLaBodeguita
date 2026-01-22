import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Check,
  Scan,
  Save,
  Zap,
  Printer,
} from 'lucide-react'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const CART_STORAGE_KEY = 'pos_active_sale'

// Precios rápidos para el pad
const QUICK_PRICES = [0.10, 0.25, 0.50, 0.75, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const toNumber = (val) => {
  if (val === null || val === undefined) return 0
  const num = parseFloat(val)
  return isNaN(num) ? 0 : num
}

export default function Sales() {
  const { token } = useAuth()
  const [mode, setMode] = useState('idle')
  const [cart, setCart] = useState({})
  const [products, setProducts] = useState([])
  const [tempProducts, setTempProducts] = useState([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cashReceived, setCashReceived] = useState('')
  
  const [tempForm, setTempForm] = useState({ name: '', price: '', qty: '1' })
  const [isCompletingSale, setIsCompletingSale] = useState(false)
  
  // Modal de ticket
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [pendingReceipt, setPendingReceipt] = useState(null)
  
  const searchTimerRef = useRef(null)
  const searchInputRef = useRef(null)

  // ============================================
  // PERSISTENCIA - CARGAR CARRITO AL MONTAR
  // ============================================
  useEffect(() => {
    loadSavedCart()
  }, [])

  const loadSavedCart = () => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        
        const savedTime = data.timestamp || 0
        const now = Date.now()
        const hoursSince = (now - savedTime) / (1000 * 60 * 60)
        
        if (hoursSince < 24) {
          setMode(data.mode || 'idle')
          setCart(data.cart || {})
          setProducts(data.products || [])
          setTempProducts(data.tempProducts || [])
          setPaymentMethod(data.paymentMethod || 'card')
          setCashReceived(data.cashReceived || '')
          
          console.log('🔄 Carrito restaurado:', Object.keys(data.cart || {}).length, 'productos')
          
          if (Object.keys(data.cart || {}).length > 0) {
            toast.success('Venta activa restaurada')
          }
        } else {
          localStorage.removeItem(CART_STORAGE_KEY)
          console.log('🗑️ Carrito antiguo eliminado')
        }
      }
    } catch (error) {
      console.error('Error loading saved cart:', error)
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }

  useEffect(() => {
    if (Object.keys(cart).length > 0 || mode === 'active') {
      const dataToSave = {
        mode,
        cart,
        products,
        tempProducts,
        paymentMethod,
        cashReceived,
        timestamp: Date.now(),
      }
      
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dataToSave))
    } else if (mode === 'idle') {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }, [mode, cart, products, tempProducts, paymentMethod, cashReceived])

  // ============================================
  // QUICK ADD - AGREGAR PRODUCTO POR PRECIO
  // ============================================
  const quickAddPrice = (price) => {
    const tempProduct = {
      id: -Date.now(),
      name: `$${price.toFixed(2)} Product`,
      price: price,
      qty: 999999,
      temp: true,
    }

    addToCart(tempProduct)
    toast.success(`$${price.toFixed(2)} agregado`)
    
    // Devolver foco al input de búsqueda para seguir escaneando
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)
  }

  // ============================================
  // BARCODE SCANNER
  // ============================================
  const searchProductByUPC = async (upc) => {
    try {
      console.log('🔍 Buscando producto por UPC:', upc)
      
      const res = await fetch(`${API}/api/products?q=${encodeURIComponent(upc)}&limit=50`, {
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
        addToCart(exactMatch)
        return true
      } else {
        console.log('❌ No se encontró producto con UPC:', upc)
        return false
      }
    } catch (error) {
      console.error('Error buscando por UPC:', error)
      return false
    }
  }

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()
      
      const found = await searchProductByUPC(searchQuery.trim())
      
      if (found) {
        setSearchQuery('')
        setSearchResults([])
        
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      } else {
        toast.error(`Producto no encontrado: ${searchQuery}`)
      }
    }
  }

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        setSearching(true)
        const res = await fetch(`${API}/api/products?q=${encodeURIComponent(searchQuery)}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!res.ok) throw new Error('Search failed')
        
        const data = await res.json()
        setSearchResults(data.rows || [])
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Error al buscar productos')
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery, token])

  // ============================================
  // CART MANAGEMENT
  // ============================================
  const addToCart = (product) => {
    const productId = product.id
    const isTemp = product.temp || false
    const currentQty = cart[productId] || 0
    const newQty = currentQty + 1

    // Sin límite de stock - permite inventario negativo

    setCart({ ...cart, [productId]: newQty })
    
    if (!products.find(p => p.id === productId) && !tempProducts.find(p => p.id === productId)) {
      if (isTemp) {
        setTempProducts([...tempProducts, product])
      } else {
        setProducts([...products, product])
      }
    }

    setSearchQuery('')
    setSearchResults([])
    
    // Mantener foco en input para seguir escaneando
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 25)
  }

  const updateQuantity = (productId, newQty) => {
    const product = [...products, ...tempProducts].find(p => p.id === productId)
    
    if (newQty <= 0) {
      removeFromCart(productId)
      return
    }

    // Sin límite de stock - permite inventario negativo

    setCart({ ...cart, [productId]: newQty })
  }

  const removeFromCart = (productId) => {
    const newCart = { ...cart }
    delete newCart[productId]
    setCart(newCart)
    
    const product = [...products, ...tempProducts].find(p => p.id === productId)
    if (product) {
      toast.info(`${product.name} eliminado del carrito`)
    }
  }

  const clearCart = () => {
    setCart({})
    setProducts([])
    setTempProducts([])
    setPaymentMethod('card')
    setCashReceived('')
    localStorage.removeItem(CART_STORAGE_KEY)
    toast.info('Carrito vaciado')
  }

  const addTempProduct = (e) => {
    e.preventDefault()
    
    if (!tempForm.name.trim() || !tempForm.price) {
      toast.error('Nombre y precio son obligatorios')
      return
    }

    const tempProduct = {
      id: -Date.now(),
      name: tempForm.name.trim(),
      price: parseFloat(tempForm.price),
      qty: 999999,
      temp: true,
    }

    addToCart(tempProduct)
    setTempForm({ name: '', price: '', qty: '1' })
  }

  // ============================================
  // CALCULATIONS
  // ============================================
  const subtotal = Object.entries(cart).reduce((sum, [productId, qty]) => {
    const product = [...products, ...tempProducts].find(p => p.id === parseInt(productId))
    if (!product) return sum
    return sum + (toNumber(product.price) * qty)
  }, 0)

  const cashReceivedNum = toNumber(cashReceived)
  const changeDue = paymentMethod === 'cash' ? Math.max(0, cashReceivedNum - subtotal) : 0
  const shortfall = paymentMethod === 'cash' ? Math.max(0, subtotal - cashReceivedNum) : 0

  // ============================================
  // COMPLETE SALE
  // ============================================
  const completeSale = async () => {
    if (Object.keys(cart).length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    if (paymentMethod === 'cash' && cashReceivedNum < subtotal) {
      toast.error('Efectivo insuficiente')
      return
    }

    // Prevenir múltiples clicks
    if (isCompletingSale) {
      console.log('⚠️ Venta ya en proceso, ignorando click')
      return
    }

    try {
      setIsCompletingSale(true)
      console.log('🛒 Iniciando completar venta...')

      const inventoryItems = products
        .filter(p => cart[p.id])
        .map(p => ({
          product_id: p.id,
          qty: cart[p.id],
        }))

      console.log('📦 Items del inventario:', inventoryItems)

      const saleRes = await fetch(`${API}/api/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: inventoryItems,
          payment: {
            method: paymentMethod,
            cash_received: paymentMethod === 'cash' ? cashReceivedNum : null,
            change_due: paymentMethod === 'cash' ? changeDue : 0,
          },
          override_total: subtotal,
        }),
      })

      if (!saleRes.ok) {
        const error = await saleRes.json()
        throw new Error(error.error || 'Error al crear venta')
      }

      const sale = await saleRes.json()
      console.log('✅ Venta creada:', sale)
      console.log('🔍 Sale ID:', sale.id, 'tipo:', typeof sale.id)

      // VALIDACIÓN CRÍTICA
      if (!sale || !sale.id) {
        console.error('❌ ERROR CRÍTICO: La venta no devolvió un ID válido')
        console.error('Sale object:', JSON.stringify(sale, null, 2))
        throw new Error('La venta se creó pero no devolvió un ID válido')
      }

      const receiptHTML = generateReceipt(sale)

      // Guardar recibo (solo una vez)
      try {
        console.log('📋 === GUARDANDO RECIBO ===')
        console.log('Sale ID para recibo:', sale.id, 'tipo:', typeof sale.id)
        console.log('Content length:', receiptHTML.length)
        
        const receiptRes = await fetch(`${API}/api/receipts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sale_id: sale.id,
            content: receiptHTML,
            supplier: null,
            notes: null,
          }),
        })

        if (receiptRes.ok) {
          const receipt = await receiptRes.json()
          console.log('✅ Recibo guardado exitosamente:')
          console.log('  - Receipt ID:', receipt.id)
          console.log('  - Sale ID:', receipt.sale_id)
          console.log('  - Location ID:', receipt.location_id)
        } else {
          const errorText = await receiptRes.text()
          console.error('❌ Error guardando recibo:', errorText)
          console.error('Status:', receiptRes.status)
          console.error('Body enviado:', JSON.stringify({
            sale_id: sale.id,
            content: receiptHTML.substring(0, 100) + '...',
          }))
        }
      } catch (error) {
        console.error('❌ Exception guardando recibo:', error)
        console.error('Sale ID que intentamos usar:', sale.id)
      }

      // Guardar recibo para el modal
      setPendingReceipt(receiptHTML)
      
      // Mostrar toast de éxito
      toast.success('¡Venta completada!')
      
      // Mostrar modal ANTES de limpiar
      setShowTicketModal(true)
      
      // NO limpiar ni cambiar modo aquí
      // Se hará en handleTicketResponse
      
    } catch (error) {
      console.error('Sale error:', error)
      toast.error(error.message || 'Error al completar la venta')
    } finally {
      setIsCompletingSale(false)
    }
  }

  const generateReceipt = (sale) => {
    const allProducts = [...products, ...tempProducts]
    const items = Object.entries(cart).map(([productId, qty]) => {
      const product = allProducts.find(p => p.id === parseInt(productId))
      return {
        name: product?.name || 'Producto',
        qty,
        price: toNumber(product?.price || 0),
        temp: product?.temp || false,
      }
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo #${sale.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 10px; }
          .center { text-align: center; }
          .header { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 4px 0; }
          .right { text-align: right; }
          .total { font-weight: bold; font-size: 14px; }
          .temp-badge { background: #fbbf24; color: #000; padding: 1px 4px; font-size: 9px; border-radius: 3px; }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="center header">Compassion & Love</div>
        <div class="center">Recibo #${sale.id}</div>
        <div class="center">${new Date().toLocaleString('es-ES')}</div>
        <div class="line"></div>
        <table>
          ${items.map(item => `
            <tr>
              <td>
                ${item.name}${item.temp ? ' <span class="temp-badge">TEMP</span>' : ''}
                <br><small>${item.qty} x $${item.price.toFixed(2)}</small>
              </td>
              <td class="right">$${(item.qty * item.price).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="line"></div>
        <table>
          <tr class="total">
            <td>TOTAL</td>
            <td class="right">$${subtotal.toFixed(2)}</td>
          </tr>
          ${paymentMethod === 'cash' ? `
            <tr>
              <td>Efectivo</td>
              <td class="right">$${cashReceivedNum.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Cambio</td>
              <td class="right">$${changeDue.toFixed(2)}</td>
            </tr>
          ` : ''}
        </table>
        <div class="line"></div>
        <div class="center">¡Gracias por su compra!</div>
        <div class="center" style="margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">Imprimir</button>
        </div>
      </body>
      </html>
    `
  }

  const printReceipt = (html) => {
    try {
      const printWindow = window.open('', 'PRINT', 'height=600,width=400')
      
      if (!printWindow) {
        toast.error('Popup bloqueado. Permite popups para imprimir.')
        return false
      }
      
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      
      setTimeout(() => {
        try {
          printWindow.print()
          setTimeout(() => {
            printWindow.close()
          }, 100)
        } catch (err) {
          console.error('Error al imprimir:', err)
          printWindow.close()
        }
      }, 250)
      
      return true
    } catch (error) {
      console.error('Error en printReceipt:', error)
      toast.error('Error al abrir ventana de impresión')
      return false
    }
  }

  const handleTicketResponse = (wantsPrint) => {
    if (wantsPrint && pendingReceipt) {
      printReceipt(pendingReceipt)
    }
    
    // Cerrar modal
    setShowTicketModal(false)
    setPendingReceipt(null)
    
    // AHORA SÍ limpiar carrito y volver a idle
    clearCart()
    setMode('idle')
  }

  // ============================================
  // RENDER
  // ============================================
  const allProducts = [...products, ...tempProducts]
  const itemCount = Object.keys(cart).length

  return (
    <>
      {/* Modo Idle */}
      {mode === 'idle' && (
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <ShoppingCart className="w-24 h-24 mx-auto mb-6 text-primary-600" />
            <h1 className="text-4xl font-bold text-gradient mb-4">Nueva Venta</h1>
            <p className="text-gray-600 mb-8">Comienza a agregar productos al carrito</p>
            <Button size="xl" onClick={() => setMode('active')}>
              Iniciar Venta
            </Button>
          </motion.div>
        </div>
      )}

      {/* Modo Active */}
      {mode === 'active' && (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Nueva Venta</h1>
          {itemCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Save className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-semibold">
                Venta guardada automáticamente ({itemCount} productos)
              </span>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => { clearCart(); setMode('idle') }}>
          Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Add Pad */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-gray-600 uppercase">
                Agregar Rápido
              </span>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {QUICK_PRICES.map(price => (
                <motion.button
                  key={price}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => quickAddPrice(price)}
                  className="aspect-square bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95 touch-manipulation select-none"
                >
                  ${price < 1 ? price.toFixed(2) : price}
                </motion.button>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              💡 Toca para agregar productos de precio fijo al carrito
            </div>
          </Card>

          {/* Scanner */}
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
              onKeyDown={handleSearchKeyDown}
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
                      onClick={() => addToCart(product)}
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

          {/* Temp Product Form */}
          <Card title="Producto Temporal" icon={Plus}>
            <form onSubmit={addTempProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Nombre"
                  placeholder="Ej: Descuento especial"
                  value={tempForm.name}
                  onChange={(e) => setTempForm({ ...tempForm, name: e.target.value })}
                />
                <Input
                  label="Precio"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tempForm.price}
                  onChange={(e) => setTempForm({ ...tempForm, price: e.target.value })}
                />
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    Agregar Temp
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Cart Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <Card title="Carrito" icon={ShoppingCart}>
            <div className="space-y-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {Object.entries(cart).map(([productId, qty]) => {
                    const product = allProducts.find(p => p.id === parseInt(productId))
                    if (!product) return null

                    const price = toNumber(product.price)
                    const itemTotal = price * qty

                    return (
                      <motion.div
                        key={productId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gray-50 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold">{product.name}</div>
                            {product.temp && (
                              <span className="inline-block px-2 py-1 bg-yellow-200 text-yellow-900 text-xs rounded mt-1">
                                TEMP
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(product.id, qty - 1)}
                              className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-100 touch-manipulation active:scale-95"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                              className="w-16 text-center border-2 border-gray-200 rounded-lg py-1 text-lg font-semibold"
                            />
                            <button
                              onClick={() => updateQuantity(product.id, qty + 1)}
                              className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-100 touch-manipulation active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="font-mono font-bold text-primary-600 text-lg">
                            ${itemTotal.toFixed(2)}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 mt-2">
                          ${price.toFixed(2)} × {qty}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {Object.keys(cart).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Carrito vacío</p>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>TOTAL</span>
                  <span className="font-mono text-primary-600">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold transition-all touch-manipulation active:scale-95 ${
                      paymentMethod === 'card'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    Tarjeta
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold transition-all touch-manipulation active:scale-95 ${
                      paymentMethod === 'cash'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    Efectivo
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Input
                    label="Efectivo Recibido"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    icon={DollarSign}
                  />
                  
                  {cashReceivedNum > 0 && (
                    <div className={`p-3 rounded-lg ${
                      shortfall > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                    }`}>
                      <div className="flex justify-between font-semibold">
                        <span>{shortfall > 0 ? 'Falta:' : 'Cambio:'}</span>
                        <span className="font-mono">
                          ${(shortfall > 0 ? shortfall : changeDue).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <div className="space-y-2">
                <Button
                  className="w-full touch-manipulation"
                  size="lg"
                  icon={Check}
                  onClick={completeSale}
                  loading={isCompletingSale}
                  disabled={Object.keys(cart).length === 0 || (paymentMethod === 'cash' && shortfall > 0) || isCompletingSale}
                >
                  {isCompletingSale ? 'Procesando...' : 'Completar Venta'}
                </Button>
                <Button
                  className="w-full touch-manipulation"
                  variant="outline"
                  onClick={clearCart}
                >
                  Vaciar Carrito
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
        </div>
      )}

      {/* Modal de Confirmación de Ticket - Siempre disponible */}
      <AnimatePresence>
        {showTicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Venta Completada!
                </h2>
                <p className="text-gray-600">
                  ¿El cliente desea ticket impreso?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleTicketResponse(false)}
                  className="w-full"
                >
                  No, Gracias
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleTicketResponse(true)}
                  className="w-full"
                  icon={Printer}
                >
                  Sí, Imprimir
                </Button>
              </div>

              <button
                onClick={() => handleTicketResponse(false)}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}