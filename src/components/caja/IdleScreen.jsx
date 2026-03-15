import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import Button from '@components/Button'

export default function IdleScreen({ onStart }) {
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
        <Button size="xl" onClick={onStart}>
          Iniciar Venta
        </Button>
      </motion.div>
    </div>
  )
}