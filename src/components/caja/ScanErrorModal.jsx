import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import Button from '@components/Button'

export default function ScanErrorModal({ show, message, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Producto no encontrado
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={onClose}
              className="w-full"
            >
              Cerrar modal
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
