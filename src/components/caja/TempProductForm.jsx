import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PackagePlus, Plus, X } from 'lucide-react'
import Input from '@components/Input'
import Button from '@components/Button'

export default function TempProductForm({ tempForm, setTempForm, onSubmit }) {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!showModal) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowModal(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showModal])

  const closeModal = () => {
    setShowModal(false)
  }

  const handleSubmit = (event) => {
    onSubmit(event)
    if (tempForm.name.trim() && tempForm.price) {
      setShowModal(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        icon={PackagePlus}
        onClick={() => setShowModal(true)}
      >
        Producto temporal
      </Button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 16 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Producto temporal</h2>
                    <p className="text-sm text-gray-600">
                      Agrega un producto rapido sin ocupar espacio en la pantalla de venta
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Agregar temporal
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
