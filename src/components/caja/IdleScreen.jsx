import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import Button from '@components/Button'

export default function IdleScreen({ onStart }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <ShoppingCart className="mx-auto mb-6 h-24 w-24 text-accent-600" />
        <h1 className="mb-4 text-4xl font-bold text-gradient">Nueva venta</h1>
        <p className="mb-8 text-primary-500">Comienza a agregar productos al carrito</p>
        <Button size="xl" onClick={onStart}>Iniciar venta</Button>
      </motion.div>
    </div>
  )
}
