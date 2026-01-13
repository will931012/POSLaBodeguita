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
} from 'lucide-react'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const CART_STORAGE_KEY = 'pos_active_sale'

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
        
        // Verificar que no sea muy antiguo (más de 24 horas)
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
          // Limpiar carrito antiguo
          localStorage.removeItem(CART_STORAGE_KEY)
          console.log('🗑️ Carrito antiguo eliminado')
        }
      }
    } catch (error) {
      console.error('Error loading saved cart:', error)
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }

  // ============================================
  // PERSISTENCIA - GUARDAR CARRITO AUTOMÁTICAMENTE
  // ============================================
  useEffect(() => {
    // Solo guardar si hay algo en el carrito
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
      console.log('💾 Carrito guardado automáticamente')
    } else if (mode === 'idle') {
      // Si el modo es idle y no hay productos, limpiar storage
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }, [mode, cart, products, tempProducts, paymentMethod, cashReceived])

  // ============================================
  // BARCODE SCANNER - BÚSQUEDA EXACTA POR UPC
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
      
      // Buscar coincidencia exacta por UPC
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

  // ============================================
  // HANDLE ENTER KEY (SCANNER)
  // ============================================
  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()
      
      // Intentar agregar por UPC primero
      const found = await searchProductByUPC(searchQuery.trim())
      
      if (found) {
        // Limpiar input y mantener foco
        setSearchQuery('')
        setSearchResults([])
        
        // Mantener el foco en el input para seguir escaneando
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      } else {
        // Si no se encuentra por UPC, mostrar error
        toast.error(`Producto no encontrado: ${searchQuery}`)
      }
    }
  }

  // ============================================
  // SEARCH (PARA BÚSQUEDA MANUAL)
  // ============================================
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

    if (!isTemp) {
      const availableQty = toNumber(product.qty)
      if (newQty > availableQty) {
        toast.error(`Solo hay ${availableQty} unidades disponibles`)
        return
      }
    }

    setCart({ ...cart, [productId]: newQty })
    
    if (!products.find(p => p.id === productId) && !tempProducts.find(p => p.id === productId)) {
      if (isTemp) {
        setTempProducts([...tempProducts, product])
      } else {
        setProducts([...products, product])
      }
    }

    toast.success(`${product.name} agregado`)
    setSearchQuery('')
    setSearchResults([])
  }

  const updateQuantity = (productId, newQty) => {
    const product = [...products, ...tempProducts].find(p => p.id === productId)
    
    if (newQty <= 0) {
      removeFromCart(productId)
      return
    }

    if (product && !product.temp) {
      const availableQty = toNumber(product.qty)
      if (newQty > availableQty) {
        toast.error(`Solo hay ${availableQty} unidades`)
        return
      }
    }

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

  // ============================================
  // TEMP PRODUCTS
  // ============================================
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

    try {
      const inventoryItems = products
        .filter(p => cart[p.id])
        .map(p => ({
          product_id: p.id,
          qty: cart[p.id],
        }))

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

      const receiptHTML = generateReceipt(sale)

      try {
        await fetch(`${API}/api/receipts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sale_id: sale.id,
            content: receiptHTML,
          }),
        })
      } catch (error) {
        console.error('Receipt save error:', error)
      }

      printReceipt(receiptHTML)
      clearCart()
      setMode('idle')
      toast.success('¡Venta completada!')
    } catch (error) {
      console.error('Sale error:', error)
      toast.error(error.message || 'Error al completar la venta')
    }
  }

  // ============================================
  // RECEIPT GENERATION
  // ============================================
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
    const printWindow = window.open('', 'PRINT', 'height=600,width=400')
    if (!printWindow) {
      toast.error('Popup bloqueado. Permite popups para imprimir.')
      return
    }
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // ============================================
  // RENDER
  // ============================================
  if (mode === 'idle') {
    return (
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
    )
  }

  const allProducts = [...products, ...tempProducts]
  const itemCount = Object.keys(cart).length

  return (
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
              💡 Tip: Escanea el código de barras y presiona Enter para agregar automáticamente
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
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
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
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(product.id, qty - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-100"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                              className="w-16 text-center border-2 border-gray-200 rounded-lg py-1"
                            />
                            <button
                              onClick={() => updateQuantity(product.id, qty + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="font-mono font-bold text-primary-600">
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
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold transition-all ${
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
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl font-semibold transition-all ${
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
                  className="w-full"
                  size="lg"
                  icon={Check}
                  onClick={completeSale}
                  disabled={Object.keys(cart).length === 0 || (paymentMethod === 'cash' && shortfall > 0)}
                >
                  Completar Venta
                </Button>
                <Button
                  className="w-full"
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
  )
}