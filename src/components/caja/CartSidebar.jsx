import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  CreditCard,
  DollarSign,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

export default function CartSidebar({
  cart,
  allProducts,
  discountPercent,
  setDiscountPercent,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  subtotal,
  discountAmount,
  finalTotal,
  cashReceivedNum,
  changeDue,
  shortfall,
  onUpdateQuantity,
  onRemoveFromCart,
  onCompleteSale,
  onClearCart,
  isCompletingSale,
}) {
  const toNumber = (val) => {
    if (val === null || val === undefined) return 0
    const num = parseFloat(val)
    return Number.isNaN(num) ? 0 : num
  }

  const discountOptions = [0, 5, 10, 15]

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <Card title="Carrito" icon={ShoppingCart}>
        <div className="space-y-4">
          <div className="max-h-96 space-y-2 overflow-y-auto">
            <AnimatePresence>
              {Object.entries(cart).map(([productId, qty]) => {
                const product = allProducts.find((p) => p.id === parseInt(productId))
                if (!product) return null

                const price = toNumber(product.price)
                const itemTotal = price * qty

                return (
                  <motion.div key={productId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="rounded-xl border border-primary-100 bg-[#F4F4F4] p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1 font-semibold text-primary-950">{product.name}</div>
                      <button onClick={() => onRemoveFromCart(product.id)} className="rounded p-1 transition-colors hover:bg-accent-50">
                        <Trash2 className="h-4 w-4 text-accent-600" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onUpdateQuantity(product.id, qty - 1)} className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-primary-200 bg-white transition-colors hover:bg-primary-50">
                          <Minus className="h-4 w-4 text-primary-600" />
                        </button>
                        <input type="number" value={qty} onChange={(e) => onUpdateQuantity(product.id, parseInt(e.target.value) || 0)} className="w-16 rounded-lg border-2 border-primary-200 bg-white py-1 text-center text-lg font-semibold text-primary-600" />
                        <button onClick={() => onUpdateQuantity(product.id, qty + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-primary-200 bg-white transition-colors hover:bg-primary-50">
                          <Plus className="h-4 w-4 text-primary-600" />
                        </button>
                      </div>
                      <div className="text-lg font-bold text-accent-600">${itemTotal.toFixed(2)}</div>
                    </div>

                    <div className="mt-2 text-xs text-primary-400">${price.toFixed(2)} x {qty}</div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {Object.keys(cart).length === 0 && (
              <div className="py-8 text-center text-primary-300">
                <ShoppingCart className="mx-auto mb-2 h-12 w-12 opacity-30" />
                <p>Carrito vacio</p>
              </div>
            )}
          </div>

          <div className="border-t-2 border-primary-100 pt-4">
            <div className="mb-3 space-y-1">
              <div className="flex items-center justify-between text-sm font-semibold text-primary-500">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-accent-600">
                <span>Descuento</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-2xl font-bold">
              <span className="text-primary-950">TOTAL</span>
              <span className="font-mono text-accent-600">${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold uppercase tracking-wider text-primary-600">Metodo de pago</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentMethod('card')} className={`flex items-center justify-center gap-2 rounded-xl p-3 font-semibold transition-all ${paymentMethod === 'card' ? 'bg-primary-950 text-white' : 'bg-[#F4F4F4] text-primary-600 hover:bg-primary-100'}`}>
                <CreditCard className="h-5 w-5" />
                Tarjeta
              </button>
              <button onClick={() => setPaymentMethod('cash')} className={`flex items-center justify-center gap-2 rounded-xl p-3 font-semibold transition-all ${paymentMethod === 'cash' ? 'bg-accent-600 text-white' : 'bg-[#F4F4F4] text-primary-600 hover:bg-primary-100'}`}>
                <DollarSign className="h-5 w-5" />
                Efectivo
              </button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
              <Input label="Efectivo recibido" type="number" step="0.01" placeholder="0.00" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} icon={DollarSign} />
              {cashReceivedNum > 0 && (
                <div className={`rounded-lg p-3 ${shortfall > 0 ? 'bg-accent-50 text-accent-700' : 'bg-primary-100 text-primary-700'}`}>
                  <div className="flex justify-between font-semibold">
                    <span>{shortfall > 0 ? 'Falta:' : 'Cambio:'}</span>
                    <span className="font-mono">${(shortfall > 0 ? shortfall : changeDue).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <div className="space-y-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold uppercase tracking-wider text-primary-600">Descuento</label>
              <div className="grid grid-cols-4 gap-2">
                {discountOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDiscountPercent(option)}
                    className={`rounded-xl py-2 text-sm font-bold transition-all ${
                      discountPercent === option ? 'bg-accent-600 text-white shadow-md' : 'bg-[#F4F4F4] text-primary-600 hover:bg-primary-100'
                    }`}
                  >
                    {option}%
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" icon={Check} onClick={onCompleteSale} loading={isCompletingSale} disabled={Object.keys(cart).length === 0 || (paymentMethod === 'cash' && shortfall > 0) || isCompletingSale}>
              {isCompletingSale ? 'Procesando...' : 'Completar venta'}
            </Button>
            <Button className="w-full" variant="outline" onClick={onClearCart}>Vaciar carrito</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
