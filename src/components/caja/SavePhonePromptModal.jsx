import { AnimatePresence, motion } from 'framer-motion'
import { Phone, Receipt } from 'lucide-react'
import Button from '@components/Button'

export default function SavePhonePromptModal({ show, onResponse }) {
  return (
    <AnimatePresence>
      {show && (
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
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Guardar telefono
              </h2>
              <p className="text-gray-600">
                ¿El cliente desea guardar su telefono?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => onResponse(false)}
                className="w-full"
                icon={Receipt}
              >
                No, seguir
              </Button>
              <Button
                size="lg"
                onClick={() => onResponse(true)}
                className="w-full"
                icon={Phone}
              >
                Si, guardar
              </Button>
            </div>

            <button
              onClick={() => onResponse(false)}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Omitir
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
