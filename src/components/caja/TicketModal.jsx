import { motion, AnimatePresence } from 'framer-motion'
import { Check, Printer } from 'lucide-react'
import Button from '@components/Button'

export default function TicketModal({ show, onResponse }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
                <Check className="h-8 w-8 text-accent-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-primary-950">Venta completada</h2>
              <p className="text-primary-500">¿El cliente desea ticket impreso?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" onClick={() => onResponse(false)} className="w-full">No, gracias</Button>
              <Button size="lg" onClick={() => onResponse(true)} className="w-full" icon={Printer}>Si, imprimir</Button>
            </div>

            <button onClick={() => onResponse(false)} className="mt-4 w-full text-sm text-primary-400 transition-colors hover:text-primary-600">Cerrar</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
