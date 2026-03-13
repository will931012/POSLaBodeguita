import { useState } from 'react'
import { Mail, Phone, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function CustomerQuickRegister({ token }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '' })
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
    } catch (error) {
      toast.error(error.message || 'Error registrando cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2 border-emerald-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Registrar cliente</h2>
          <p className="text-sm text-gray-600">
            El cajero puede guardar clientes para futuras ofertas y mercancia nueva
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" loading={saving}>
            Guardar cliente
          </Button>
        </div>
      </form>
    </Card>
  )
}
