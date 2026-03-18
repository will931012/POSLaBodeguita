import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, RefreshCw, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import Card from '@components/Card'
import Button from '@components/Button'
import Input from '@components/Input'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function CustomerCampaignsTab({ token, active }) {
  const [customers, setCustomers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
  })

  const loadData = async (query = '') => {
    try {
      setLoading(true)
      const searchParams = query ? `?q=${encodeURIComponent(query)}` : ''

      const [customersRes, campaignsRes] = await Promise.all([
        fetch(`${API}/api/customers${searchParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/customers/campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const customersData = customersRes.ok ? await customersRes.json() : []
      const campaignsData = campaignsRes.ok ? await campaignsRes.json() : []

      setCustomers(customersData)
      setCampaigns(campaignsData)
      setSelectedRecipients((current) => {
        if (current.length === 0) {
          return []
        }

        return current.filter((id) => customersData.some((customer) => customer.id === id))
      })
    } catch (error) {
      toast.error('No se pudieron cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token || !active) return
    loadData(search)
  }, [token, active])

  const onSearchSubmit = (event) => {
    event.preventDefault()
    loadData(search)
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleRecipient = (customerId) => {
    setSelectedRecipients((current) => (
      current.includes(customerId)
        ? current.filter((id) => id !== customerId)
        : [...current, customerId]
    ))
  }

  const selectSuggestedTestRecipients = () => {
    const suggested = customers.slice(0, 2).map((customer) => customer.id)

    setSelectedRecipients(suggested)

    if (suggested.length > 0) {
      toast.success('Seleccionados los primeros clientes disponibles')
    } else {
      toast.error('No hay clientes disponibles en la tabla actual')
    }
  }

  const selectAllVisibleRecipients = () => {
    setSelectedRecipients(customers.map((customer) => customer.id))
  }

  const clearRecipients = () => {
    setSelectedRecipients([])
  }

  const customerStats = useMemo(() => ({
    total: customers.length,
    withPhone: customers.filter((customer) => customer.phone).length,
  }), [customers])

  const handleSendCampaign = async (event) => {
    event.preventDefault()

    if (!form.message.trim()) {
      toast.error('Escribe el contenido de la campana')
      return
    }

    if (selectedRecipients.length === 0) {
      toast.error('Selecciona al menos un cliente para la prueba')
      return
    }

    try {
      setSending(true)

      const response = await fetch(`${API}/api/customers/campaigns/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          recipient_ids: selectedRecipients,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar la campana')
      }

      toast.success(`Campana enviada. Exitosos: ${data.sentCount || 0}`)

      setForm({
        title: '',
        message: '',
      })

      loadData(search)
    } catch (error) {
      toast.error(error.message || 'Error enviando campana')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 uppercase">Clientes</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{customerStats.total}</p>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 uppercase">Con telefono</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{customerStats.withPhone}</p>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 uppercase">Seleccionados</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{selectedRecipients.length}</p>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Clientes registrados</h2>
              <p className="text-sm text-slate-600">Tabla con customer id y telefono</p>
            </div>
          </div>

          <div className="flex gap-2">
            <form onSubmit={onSearchSubmit} className="flex gap-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente"
                icon={Search}
                containerClassName="min-w-[240px]"
              />
              <Button type="submit" variant="outline">
                Buscar
              </Button>
            </form>
            <Button type="button" variant="outline" onClick={() => loadData(search)} icon={RefreshCw}>
              Refrescar
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button type="button" variant="outline" onClick={selectSuggestedTestRecipients}>
            Seleccionar 2
          </Button>
          <Button type="button" variant="outline" onClick={selectAllVisibleRecipients}>
            Seleccionar visibles
          </Button>
          <Button type="button" variant="outline" onClick={clearRecipients}>
            Limpiar seleccion
          </Button>
          <div className="flex items-center text-sm font-medium text-slate-600 px-2">
            Seleccionados: {selectedRecipients.length}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Enviar</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Customer ID</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Telefono</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="border border-slate-300 px-3 py-8 text-center text-slate-500">
                    {loading ? 'Cargando clientes...' : 'No hay clientes registrados'}
                  </td>
                </tr>
              ) : (
                customers.map((customer, index) => (
                  <tr key={customer.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="border border-slate-300 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(customer.id)}
                        onChange={() => toggleRecipient(customer.id)}
                        className="w-4 h-4 accent-primary-600"
                      />
                    </td>
                    <td className="border border-slate-300 px-3 py-2 font-mono">{customer.id}</td>
                    <td className="border border-slate-300 px-3 py-2">{customer.phone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Campanas de clientes</h2>
            <p className="text-sm text-slate-600">
              Envia ofertas y avisos de mercancia nueva por SMS
            </p>
          </div>
        </div>

        <form onSubmit={handleSendCampaign} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Titulo"
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
              placeholder="Nueva mercancia en tienda"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Mensaje
            </label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(event) => updateForm('message', event.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 font-medium focus:outline-none focus:border-primary-600"
              placeholder="Escribe la oferta o aviso de nueva mercancia..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={sending}>
              {`Enviar SMS a ${selectedRecipients.length}`}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Historial de campanas</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Titulo</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Canal</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Estado</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Destinatarios</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Enviados</th>
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Fallidos</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border border-slate-300 px-3 py-8 text-center text-slate-500">
                    No hay campanas registradas
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign, index) => (
                  <tr key={campaign.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="border border-slate-300 px-3 py-2">{campaign.title}</td>
                    <td className="border border-slate-300 px-3 py-2 capitalize">{campaign.channel}</td>
                    <td className="border border-slate-300 px-3 py-2 capitalize">{campaign.status}</td>
                    <td className="border border-slate-300 px-3 py-2 font-mono">{campaign.recipient_count}</td>
                    <td className="border border-slate-300 px-3 py-2 font-mono">{campaign.sent_count}</td>
                    <td className="border border-slate-300 px-3 py-2 font-mono">{campaign.failed_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
