import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Phone, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import Input from '@components/Input'
import Button from '@components/Button'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function CustomerQuickRegister({ token }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!showModal) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !saving) {
        setShowModal(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showModal, saving])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '' })
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Escribe el nombre del cliente')
      return
    }

    if (!form.email.trim() && !form.phone.trim()) {
      toast.error('Debes agregar email o telefono')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`${API}/api/customers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar el cliente')
      }

      toast.success(data.updatedExisting ? 'Cliente actualizado' : 'Cliente registrado')
      resetForm()
      setShowModal(false)
    } catch (error) {
      toast.error(error.message || 'Error registrando cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          icon={Users}
          onClick={() => setShowModal(true)}
        >
          Registrar cliente
        </Button>
      </div>

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
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Registrar cliente</h2>
                    <p className="text-sm text-gray-600">
                      Guarda nombre, email y telefono sin interrumpir la venta
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Nombre"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="Nombre del cliente"
                    icon={UserPlus}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="cliente@email.com"
                    icon={Mail}
                  />
                  <Input
                    label="Telefono"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="+1 555 555 5555"
                    icon={Phone}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={saving}>
                    Guardar cliente
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
