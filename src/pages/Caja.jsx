import { useState, useEffect, useRef } from 'react'
import { Save } from 'lucide-react'
import Button from '@components/Button'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

// Components
import IdleScreen from '@/components/caja/IdleScreen'
import QuickAddPad from '@/components/caja/QuickAddPad'
import ProductScanner from '@/components/caja/ProductScanner'
import TempProductForm from '@/components/caja/TempProductForm'
import CartSidebar from '@/components/caja/CartSidebar'
import TicketModal from '@/components/caja/TicketModal'
import CustomerQuickRegister from '@/components/caja/CustomerQuickRegister'
import ScanErrorModal from '@/components/caja/ScanErrorModal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const CART_STORAGE_KEY = 'pos_active_sale'

const toNumber = (val) => {
  if (val === null || val === undefined) return 0
  const num = parseFloat(val)
  return isNaN(num) ? 0 : num
}

export default function Caja() {
  const { token, location } = useAuth()
  
  // UI State
  const [mode, setMode] = useState('idle')
  const [searching, setSearching] = useState(false)
  const [isCompletingSale, setIsCompletingSale] = useState(false)
  
  // Cart State
  const [cart, setCart] = useState({})
  const [products, setProducts] = useState([])
  const [tempProducts, setTempProducts] = useState([])
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cashReceived, setCashReceived] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  
  // Form State
  const [tempForm, setTempForm] = useState({ name: '', price: '', qty: '1' })
  
  // Modal State
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [pendingReceipt, setPendingReceipt] = useState(null)
  const [verse, setVerse] = useState(null)
  const [tempShortcutSignal, setTempShortcutSignal] = useState(0)
  const [customerShortcutSignal, setCustomerShortcutSignal] = useState(0)
  const [scanErrorMessage, setScanErrorMessage] = useState('')
  const [showScanErrorModal, setShowScanErrorModal] = useState(false)
  
  // Refs
  const searchTimerRef = useRef(null)
  const searchInputRef = useRef(null)

  const playErrorSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return

      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime)
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.28)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.28)
      oscillator.onended = () => {
        audioContext.close().catch(() => {})
      }
    } catch (error) {
      console.error('Error reproduciendo sonido:', error)
    }
  }

  const showScanError = (message) => {
    playErrorSound()
    setScanErrorMessage(message)
    setShowScanErrorModal(true)
  }

  // ============================================
  // PERSISTENCE
  // ============================================
  useEffect(() => {
    loadSavedCart()
  }, [])

  useEffect(() => {
    if (!token) return
    loadVerse()
  }, [token])

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
          setDiscountPercent(data.discountPercent || 0)
          
          if (Object.keys(data.cart || {}).length > 0) {
            toast.success('Venta activa restaurada')
          }
        } else {
          localStorage.removeItem(CART_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Error loading saved cart:', error)
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }

  const loadVerse = async () => {
    try {
      const res = await fetch('https://labs.bible.org/api/?passage=votd&type=json')
      const data = await res.json()
      if (data && data[0]) {
        setVerse(data[0])
      }
    } catch (error) {
      console.error('Verse error:', error)
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
        discountPercent,
        timestamp: Date.now(),
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dataToSave))
    } else if (mode === 'idle') {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }, [mode, cart, products, tempProducts, paymentMethod, cashReceived, discountPercent])

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!target) return false
      const tagName = target.tagName?.toLowerCase()
      return (
        tagName === 'input'
        || tagName === 'textarea'
        || tagName === 'select'
        || target.isContentEditable
      )
    }

    const handleKeyDown = (event) => {
      if (mode !== 'active') return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      if (event.key === 'F2') {
        event.preventDefault()
        setTempShortcutSignal((current) => current + 1)
        return
      }

      if (event.key === 'F3') {
        event.preventDefault()
        setCustomerShortcutSignal((current) => current + 1)
        return
      }

      if (event.key === 'Enter' && !isEditableTarget(event.target) && !showTicketModal) {
        event.preventDefault()
        completeSale()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, showTicketModal, cart, paymentMethod, cashReceived, products, tempProducts, isCompletingSale])

  // ============================================
  // QUICK ADD
  // ============================================
  const quickAddPrice = (price) => {
    const quickId = -Math.round(price * 100)
    const tempProduct = {
      id: quickId,
      name: `$${price.toFixed(2)}`,
      price: price,
      qty: 999999,
      temp: true,
    }

    addToCart(tempProduct)
    toast.success(`$${price.toFixed(2)} agregado`)
    
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  // ============================================
  // SEARCH & SCANNER
  // ============================================
  const searchProductByUPC = async (upc) => {
    try {
      const res = await fetch(`${API}/api/products?q=${encodeURIComponent(upc)}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Search failed')
      
      const data = await res.json()
      const exactMatch = data.rows?.find(p => p.upc === upc)
      
      if (exactMatch) {
        addToCart(exactMatch)
        return true
      }
      return false
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
        searchInputRef.current?.focus()
      } else {
        showScanError(`No se encontro el producto: ${searchQuery}`)
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
          headers: { Authorization: `Bearer ${token}` }
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
    
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 25)
  }

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId)
      return
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
    setDiscountPercent(0)
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

  const discountAmount = subtotal * (discountPercent / 100)
  const finalTotal = Math.max(0, subtotal - discountAmount)

  const cashReceivedNum = toNumber(cashReceived)
  const changeDue = paymentMethod === 'cash' ? Math.max(0, cashReceivedNum - finalTotal) : 0
  const shortfall = paymentMethod === 'cash' ? Math.max(0, finalTotal - cashReceivedNum) : 0

  // ============================================
  // COMPLETE SALE
  // ============================================
  const completeSale = async () => {
    if (Object.keys(cart).length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    if (paymentMethod === 'cash' && cashReceivedNum < finalTotal) {
      toast.error('Efectivo insuficiente')
      return
    }

    if (isCompletingSale) return

    try {
      setIsCompletingSale(true)

      const inventoryItems = products
        .filter(p => cart[p.id])
        .map(p => ({
          product_id: p.id,
          qty: cart[p.id],
        }))

      const saleRes = await fetch(`${API}/api/sales`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: inventoryItems,
          payment: {
            method: paymentMethod,
            cash_received: paymentMethod === 'cash' ? cashReceivedNum : null,
            change_due: paymentMethod === 'cash' ? changeDue : 0,
          },
          override_total: finalTotal,
        }),
      })

      if (!saleRes.ok) {
        const error = await saleRes.json()
        throw new Error(error.error || 'Error al crear venta')
      }

      const sale = await saleRes.json()

      if (!sale || !sale.id) {
        throw new Error('La venta se creó pero no devolvió un ID válido')
      }

      const receiptHTML = generateReceipt(sale)

      // Save receipt
      try {
        await fetch(`${API}/api/receipts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sale_id: sale.id,
            content: receiptHTML,
            supplier: null,
            notes: null,
          }),
        })
      } catch (error) {
        console.error('Error guardando recibo:', error)
      }

      setPendingReceipt(receiptHTML)
      toast.success('¡Venta completada!')
      setShowTicketModal(true)
      
    } catch (error) {
      console.error('Sale error:', error)
      toast.error(error.message || 'Error al completar la venta')
    } finally {
      setIsCompletingSale(false)
    }
  }

  const generateReceipt = (sale) => {
    const locationName = location?.name || 'Compassion & Love'
    const locationAddress = location?.address || ''
    const verseText = verse?.text || ''
    const verseRef = verse
      ? `${verse.bookname} ${verse.chapter}:${verse.verse}`
      : ''
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
          body { font-family: 'Courier New', monospace; max-width: 270px; margin: 0 auto; padding: 8px; color: #111827; }
          .receipt { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; }
          .center { text-align: center; }
          .header { font-weight: bold; font-size: 15px; margin-bottom: 4px; letter-spacing: 0.04em; text-transform: uppercase; }
          .subheader { font-size: 11px; margin-bottom: 6px; }
          .muted { color: #4b5563; font-size: 10px; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 3px 0; vertical-align: top; }
          .right { text-align: right; }
          .item-name { font-weight: bold; font-size: 12px; }
          .item-meta { font-size: 10px; color: #4b5563; }
          .summary td { font-size: 11px; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { margin-top: 10px; font-size: 10px; line-height: 1.4; }
          .verse { font-style: italic; }
          .thanks { font-weight: bold; font-size: 12px; margin-top: 2px; }
          .print-btn { padding: 8px 14px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 6px; background: white; margin-top: 14px; }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            button { display: none; }
            body { max-width: none; padding: 0; }
            .receipt { border: none; border-radius: 0; padding: 6px 8px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
        <div class="center header">${locationName}</div>
        <div class="center subheader">Recibo #${sale.id}</div>
        <div class="center muted">${new Date().toLocaleString('es-ES')}</div>
        ${locationAddress ? `<div class="center muted" style="margin-top: 4px;">${locationAddress}</div>` : ''}
        <div class="line"></div>
        <table>
          ${items.map(item => `
            <tr>
              <td>
                <div class="item-name">${item.name}</div>
                <div class="item-meta">${item.qty} x $${item.price.toFixed(2)}</div>
              </td>
              <td class="right item-name">$${(item.qty * item.price).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="line"></div>
        <table class="summary">
          <tr>
            <td>Subtotal</td>
            <td class="right">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr class="total">
            <td>TOTAL</td>
            <td class="right">$${finalTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Pago</td>
            <td class="right">${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</td>
          </tr>
          ${discountPercent > 0 ? `
            <tr>
              <td>Descuento (${discountPercent}%)</td>
              <td class="right">-$${discountAmount.toFixed(2)}</td>
            </tr>
          ` : ''}
          ${paymentMethod === 'cash' ? `
            <tr>
              <td>Recibido</td>
              <td class="right">$${cashReceivedNum.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Cambio</td>
              <td class="right">$${changeDue.toFixed(2)}</td>
            </tr>
          ` : ''}
        </table>
        <div class="line"></div>
        <div class="center thanks">Gracias por su compra</div>
        <div class="center footer">
          ${verseText ? `<div class="verse">"${verseText}"</div>` : ''}
          ${verseRef ? `<div>${verseRef}</div>` : ''}
        </div>
        </div>
        <div class="center">
          <button onclick="window.print()" class="print-btn">Imprimir</button>
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
          setTimeout(() => printWindow.close(), 100)
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
    
    setShowTicketModal(false)
    setPendingReceipt(null)
    clearCart()
    setMode('idle')
  }

  // ============================================
  // RENDER
  // ============================================
  const allProducts = [...products, ...tempProducts]
  const itemCount = Object.keys(cart).length

  if (mode === 'idle') {
    return <IdleScreen onStart={() => setMode('active')} />
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Caja</h1>
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
            <div className="flex items-center justify-between gap-3">
              <TempProductForm
                tempForm={tempForm}
                setTempForm={setTempForm}
                onSubmit={addTempProduct}
                shortcutSignal={tempShortcutSignal}
              />
              <CustomerQuickRegister
                token={token}
                shortcutSignal={customerShortcutSignal}
              />
            </div>

            <QuickAddPad onQuickAdd={quickAddPrice} />
            
            <ProductScanner
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onKeyDown={handleSearchKeyDown}
              searchResults={searchResults}
              onAddToCart={addToCart}
              searching={searching}
              searchInputRef={searchInputRef}
            />

          </div>

          <CartSidebar
            cart={cart}
            allProducts={allProducts}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            discountPercent={discountPercent}
            setDiscountPercent={setDiscountPercent}
            cashReceived={cashReceived}
            setCashReceived={setCashReceived}
            subtotal={subtotal}
            discountAmount={discountAmount}
            finalTotal={finalTotal}
            cashReceivedNum={cashReceivedNum}
            changeDue={changeDue}
            shortfall={shortfall}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onCompleteSale={completeSale}
            onClearCart={clearCart}
            isCompletingSale={isCompletingSale}
          />
        </div>
      </div>

      <TicketModal
        show={showTicketModal}
        onResponse={handleTicketResponse}
      />
      <ScanErrorModal
        show={showScanErrorModal}
        message={scanErrorMessage}
        onClose={() => {
          setShowScanErrorModal(false)
          setScanErrorMessage('')
          searchInputRef.current?.focus()
        }}
      />
    </>
  )
}


