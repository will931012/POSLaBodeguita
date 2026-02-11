import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  CreditCard,
  DollarSign,
} from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

export default function CartSidebar({
  cart,
  allProducts,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  subtotal,
  cashReceivedNum,
  changeDue,
  shortfall,
  onUpdateQuantity,
  onRemoveFromCart,
  onCompleteSale,
  onClearCart,
  isCompletingSale
}) {
  const toNumber = (val) => {
    if (val === null || val === undefined) return 0
    const num = parseFloat(val)
    return isNaN(num) ? 0 : num
  }

  return (
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
                      </div>
                      <button
                        onClick={() => onRemoveFromCart(product.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(product.id, qty - 1)}
                          className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-100 touch-manipulation active:scale-95"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => onUpdateQuantity(product.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center border-2 border-gray-200 rounded-lg py-1 text-lg font-semibold"
                        />
                        <button
                          onClick={() => onUpdateQuantity(product.id, qty + 1)}
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
              onClick={onCompleteSale}
              loading={isCompletingSale}
              disabled={Object.keys(cart).length === 0 || (paymentMethod === 'cash' && shortfall > 0) || isCompletingSale}
            >
              {isCompletingSale ? 'Procesando...' : 'Completar Venta'}
            </Button>
            <Button
              className="w-full touch-manipulation"
              variant="outline"
              onClick={onClearCart}
            >
              Vaciar Carrito
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
