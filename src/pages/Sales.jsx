import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  DollarSign,
  Printer,
  X,
  Package,
  AlertCircle
} from 'lucide-react'
import Button from '@components/Button'
import Card from '@components/Card'
import Input from '@components/Input'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const DRAFT_KEY = 'pos_sale_draft_v2'

export default function Sales() {
  // Estado del carrito
  const [cart, setCart] = useState({}) // { productId: quantity }
  const [products, setProducts] = useState([]) // productos del inventario
  const [tempProducts, setTempProducts] = useState([]) // productos temporales
  
  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  
  // Pago
  const [paymentMethod, setPaymentMethod] = useState('card') // 'card' | 'cash'
  const [cashReceived, setCashReceived] = useState('')
  
  // Form de producto temporal
  const [tempForm, setTempForm] = useState({ name: '', price: '', qty: '1' })
  const [showTempForm, setShowTempForm] = useState(false)
  
  // Estado general
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('idle') // 'idle' | 'active'

  // ============================================
  // CARGAR BORRADOR AL INICIAR
  // ============================================
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setCart(draft.cart || {})
      setProducts(draft.products || [])
      setTempProducts(draft.tempProducts || [])
      setPaymentMethod(draft.paymentMethod || 'card')
      setCashReceived(draft.cashReceived || '')
      if (Object.keys(draft.cart || {}).length > 0) {
        setMode('active')
      }
    }
  }, [])

  // ============================================
  // GUARDAR BORRADOR AUTOMÁTICAMENTE
  // ============================================
  useEffect(() => {
    if (mode === 'active') {
      saveDraft({
        cart,
        products,
        tempProducts,
        paymentMethod,
        cashReceived,
      })
    }
  }, [cart, products, tempProducts, paymentMethod, cashReceived, mode])

  // ============================================
  // FUNCIONES DE BORRADOR
  // ============================================
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function saveDraft(data) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Error saving draft:', e)
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch (e) {
      console.error('Error clearing draft:', e)
    }
  }

  // ============================================
  // BÚSQUEDA DE PRODUCTOS
  // ============================================
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const res = await fetch(`${API}/api/products?q=${encodeURIComponent(query)}&limit=10`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSearchResults(data.rows || [])
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Error al buscar productos')
    } finally {
      setSearching(false)
    }
  }

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ============================================
  // GESTIÓN DEL CARRITO
  // ============================================
  const addToCart = (product) => {
    if (!product) return
    
    const id = product.id
    const currentQty = cart[id] || 0
    const stock = product.qty || 0
    const isTemp = product.temp

    // Validar stock solo si no es temporal
    if (!isTemp && currentQty >= stock) {
      toast.error(`Stock insuficiente para ${product.name}`)
      return
    }

    // Agregar producto a la lista si no existe
    if (!products.find(p => p.id === id) && !tempProducts.find(p => p.id === id)) {
      if (isTemp) {
        setTempProducts([...tempProducts, product])
      } else {
        setProducts([...products, product])
      }
    }

    // Actualizar cantidad
    setCart({ ...cart, [id]: currentQty + 1 })
    setMode('active')
    toast.success(`${product.name} agregado al carrito`)
  }

  const updateQuantity = (productId, newQty) => {
    const product = allProducts.find(p => p.id === productId)
    if (!product) return

    const qty = Math.max(0, parseInt(newQty) || 0)
    
    // Validar stock si no es temporal
    if (!product.temp && qty > product.qty) {
      toast.error(`Stock máximo: ${product.qty}`)
      return
    }

    if (qty === 0) {
      const { [productId]: _, ...rest } = cart
      setCart(rest)
    } else {
      setCart({ ...cart, [productId]: qty })
    }
  }

  const removeFromCart = (productId) => {
    const { [productId]: _, ...rest } = cart
    setCart(rest)
    toast.success('Producto eliminado del carrito')
  }

  const clearCart = () => {
    setCart({})
    setTempProducts([])
    toast.success('Carrito vaciado')
  }

  // ============================================
  // PRODUCTO TEMPORAL
  // ============================================
  const addTempProduct = () => {
    const name = tempForm.name.trim()
    const price = parseFloat(tempForm.price)
    const qty = parseInt(tempForm.qty) || 1

    if (!name) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (isNaN(price) || price < 0) {
      toast.error('Precio inválido')
      return
    }

    const tempProduct = {
      id: -Date.now(), // ID negativo único
      name,
      price,
      qty: 999999, // Stock "infinito" para temporales
      temp: true,
    }

    addToCart(tempProduct)
    setTempForm({ name: '', price: '', qty: '1' })
    setShowTempForm(false)
  }

  // ============================================
  // CÁLCULOS
  // ============================================
  const allProducts = useMemo(() => [...products, ...tempProducts], [products, tempProducts])

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = allProducts.find(p => p.id === Number(id))
        if (!product) return null
        return { ...product, qtyInCart: qty }
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [cart, allProducts])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.price * item.qtyInCart)
    }, 0)
  }, [cartItems])

  const cashNum = parseFloat(cashReceived) || 0
  const changeDue = paymentMethod === 'cash' ? Math.max(0, cashNum - subtotal) : 0
  const shortfall = paymentMethod === 'cash' ? Math.max(0, subtotal - cashNum) : 0

  // ============================================
  // COMPLETAR VENTA
  // ============================================
  const completeSale = async () => {
    // Validaciones
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    if (paymentMethod === 'cash' && cashNum < subtotal) {
      toast.error(`Falta $${shortfall.toFixed(2)}`)
      return
    }

    try {
      setLoading(true)

      // Separar productos de inventario vs temporales
      const inventoryItems = cartItems
        .filter(item => !item.temp)
        .map(item => ({
          product_id: item.id,
          qty: item.qtyInCart,
        }))

      // Crear venta
      const payload = {
        items: inventoryItems,
        payment: {
          method: paymentMethod,
          cash_received: paymentMethod === 'cash' ? cashNum : null,
          change_due: paymentMethod === 'cash' ? changeDue : 0,
        },
        override_total: subtotal, // Incluye temporales
      }

      const res = await fetch(`${API}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al procesar la venta')
      }

      const sale = await res.json()

      // Generar recibo
      const receipt = generateReceipt(sale, cartItems)
      
      // Guardar recibo
      await fetch(`${API}/api/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: sale.id,
          content: receipt,
        }),
      }).catch(() => {}) // No bloqueamos si falla

      // Imprimir
      printReceipt(receipt)

      // Resetear
      setCart({})
      setProducts([])
      setTempProducts([])
      setPaymentMethod('card')
      setCashReceived('')
      setSearchQuery('')
      setSearchResults([])
      setMode('idle')
      clearDraft()

      toast.success('¡Venta completada exitosamente!')
    } catch (error) {
      console.error('Sale error:', error)
      toast.error(error.message || 'Error al completar la venta')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // GENERACIÓN E IMPRESIÓN DE RECIBO
  // ============================================
  function generateReceipt(sale, items) {
    const date = new Date().toLocaleString('es-ES')
    const itemsHtml = items.map(item => `
      <tr>
        <td>${item.name}${item.temp ? ' (TEMP)' : ''}</td>
        <td class="right">${item.qtyInCart}</td>
        <td class="right">$${item.price.toFixed(2)}</td>
        <td class="right">$${(item.price * item.qtyInCart).toFixed(2)}</td>
      </tr>
    `).join('')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recibo #${sale.id}</title>
  <style>
    body { 
      font-family: 'Courier New', monospace; 
      margin: 16px; 
      font-size: 12px;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 10px 0;
    }
    th, td { 
      padding: 6px 4px; 
      border-bottom: 1px solid #ddd; 
    }
    th { 
      font-weight: bold; 
      text-align: left; 
    }
    .total { 
      font-weight: bold; 
      font-size: 14px; 
    }
    @media print {
      @page { size: 80mm auto; margin: 6mm; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="center">
    <h2>Compassion & Love</h2>
    <p>Point of Sale</p>
    <p>Recibo #${sale.id}</p>
    <p>${date}</p>
  </div>
  <hr>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th class="right">Cant.</th>
        <th class="right">Precio</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
    <tfoot>
      <tr class="total">
        <td colspan="3" class="right">TOTAL:</td>
        <td class="right">$${subtotal.toFixed(2)}</td>
      </tr>
      ${paymentMethod === 'cash' ? `
        <tr>
          <td colspan="3" class="right">Efectivo recibido:</td>
          <td class="right">$${cashNum.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" class="right">Cambio:</td>
          <td class="right">$${changeDue.toFixed(2)}</td>
        </tr>
      ` : ''}
    </tfoot>
  </table>
  <hr>
  <div class="center">
    <p>¡Gracias por su compra!</p>
    <button onclick="window.print()">Imprimir</button>
  </div>
</body>
</html>
    `
  }

  function printReceipt(html) {
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 mx-auto gradient-primary rounded-3xl flex items-center justify-center shadow-2xl">
            <ShoppingCart className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Sistema de Ventas
            </h1>
            <p className="text-gray-600 text-lg">
              Comienza una nueva venta cuando estés listo
            </p>
          </div>
          
          <Button
            size="xl"
            icon={Plus}
            onClick={() => setMode('active')}
          >
            Nueva Venta
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Nueva Venta</h1>
          <p className="text-gray-600 mt-1">Agrega productos al carrito</p>
        </div>
        
        <Button
          variant="danger"
          icon={X}
          onClick={() => {
            if (cartItems.length > 0) {
              if (confirm('¿Cancelar esta venta? El carrito será limpiado.')) {
                setMode('idle')
                clearCart()
                clearDraft()
              }
            } else {
              setMode('idle')
            }
          }}
        >
          Cancelar Venta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo - Búsqueda y Productos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Búsqueda */}
          <Card title="Buscar Producto" icon={Search}>
            <div className="space-y-4">
              <Input
                placeholder="Buscar por nombre o escanear código de barras..."
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />

              {/* Resultados de búsqueda */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar"
                  >
                    {searchResults.map((product) => (
                      <motion.button
                        key={product.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          addToCart(product)
                          setSearchQuery('')
                          setSearchResults([])
                        }}
                        className="w-full p-4 bg-gray-50 hover:bg-primary-50 rounded-xl border-2 border-transparent hover:border-primary-500 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.upc && `UPC: ${product.upc} • `}
                              Stock: {product.qty}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-primary-600 font-mono ml-4">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {searching && (
                <div className="text-center py-4">
                  <div className="spinner mx-auto"></div>
                </div>
              )}
            </div>
          </Card>

          {/* Producto Temporal */}
          <Card title="Producto Temporal" icon={Package}>
            {!showTempForm ? (
              <Button
                variant="outline"
                icon={Plus}
                onClick={() => setShowTempForm(true)}
                className="w-full"
              >
                Agregar Producto Temporal
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nombre"
                      placeholder="Descripción del producto"
                      value={tempForm.name}
                      onChange={(e) => setTempForm({ ...tempForm, name: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Precio"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={tempForm.price}
                    onChange={(e) => setTempForm({ ...tempForm, price: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={addTempProduct}>
                    Agregar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTempForm(false)
                      setTempForm({ name: '', price: '', qty: '1' })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <AlertCircle className="w-4 h-4 inline mr-2 text-blue-600" />
                  Los productos temporales no afectan el inventario
                </div>
              </motion.div>
            )}
          </Card>
        </div>

        {/* Panel Derecho - Carrito */}
        <div className="lg:col-span-1">
          <Card 
            title={`Carrito (${cartItems.length})`}
            icon={ShoppingCart}
            className="sticky top-24"
          >
            <div className="space-y-4">
              {/* Items del carrito */}
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {cartItems.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-400"
                    >
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Carrito vacío</p>
                    </motion.div>
                  ) : (
                    cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-gray-50 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {item.name}
                              {item.temp && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                  TEMP
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 font-mono">
                              ${item.price.toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.qtyInCart - 1)}
                            className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <input
                            type="number"
                            value={item.qtyInCart}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className="w-16 text-center px-2 py-1 rounded-lg border-2 border-gray-200 font-mono font-semibold"
                          />
                          
                          <button
                            onClick={() => updateQuantity(item.id, item.qtyInCart + 1)}
                            className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          <div className="ml-auto font-bold font-mono text-lg">
                            ${(item.price * item.qtyInCart).toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {cartItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="w-full"
                >
                  Vaciar Carrito
                </Button>
              )}

              {/* Total */}
              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-3xl font-bold text-primary-600 font-mono">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Método de pago */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Método de Pago
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border-2 font-semibold transition-all ${
                        paymentMethod === 'card'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm">Tarjeta</div>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 rounded-xl border-2 font-semibold transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-success-600 bg-success-50 text-success-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm">Efectivo</div>
                    </button>
                  </div>

                  {/* Efectivo recibido */}
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
                      />
                      
                      {cashNum > 0 && (
                        <div className={`p-3 rounded-lg ${
                          cashNum >= subtotal
                            ? 'bg-success-50 text-success-800'
                            : 'bg-red-50 text-red-800'
                        }`}>
                          {cashNum >= subtotal ? (
                            <div className="flex justify-between font-semibold">
                              <span>Cambio:</span>
                              <span className="font-mono">${changeDue.toFixed(2)}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between font-semibold">
                              <span>Falta:</span>
                              <span className="font-mono">${shortfall.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Botón de completar venta */}
                <Button
                  size="lg"
                  icon={Printer}
                  onClick={completeSale}
                  loading={loading}
                  disabled={
                    cartItems.length === 0 ||
                    (paymentMethod === 'cash' && cashNum < subtotal)
                  }
                  className="w-full mt-4"
                >
                  Completar Venta e Imprimir
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}