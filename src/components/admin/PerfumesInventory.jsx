import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Edit2, Search, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import Card from '@components/Card'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const getStockStatus = (qty) => {
  if (qty === 0) return 'Agotado'
  if (qty < 5) return 'Critico'
  if (qty < 20) return 'Bajo'
  return 'OK'
}

export default function PerfumesInventory({ allPerfumes, token, onPerfumeUpdated }) {
  const [upcFilter, setUpcFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    upc: '',
    name: '',
    category: '',
    price: '',
    qty: '',
  })
  const [saving, setSaving] = useState(false)
  const [localPerfumes, setLocalPerfumes] = useState(allPerfumes)

  useEffect(() => {
    setLocalPerfumes(allPerfumes)
  }, [allPerfumes])

  const hasActiveFilter = upcFilter.trim() !== '' || nameFilter.trim() !== ''

  const filteredPerfumes = useMemo(() => {
    if (!hasActiveFilter) return []

    const normalizedUpc = upcFilter.trim().toLowerCase()
    const normalizedName = nameFilter.trim().toLowerCase()

    return localPerfumes.filter((perfume) => {
      const perfumeUpc = String(perfume.upc || '').toLowerCase()
      const perfumeName = String(perfume.name || '').toLowerCase()

      const matchesUpc = normalizedUpc ? perfumeUpc.includes(normalizedUpc) : true
      const matchesName = normalizedName ? perfumeName.includes(normalizedName) : true

      return matchesUpc && matchesName
    })
  }, [hasActiveFilter, localPerfumes, nameFilter, upcFilter])

  const startEdit = (perfume) => {
    setEditingId(perfume.id)
    setEditForm({
      upc: perfume.upc || '',
      name: perfume.name || '',
      category: perfume.category || '',
      price: perfume.price ?? '',
      qty: perfume.qty ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({
      upc: '',
      name: '',
      category: '',
      price: '',
      qty: '',
    })
  }

  const saveEdit = async (perfumeId) => {
    if (!editForm.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`${API}/api/products/${perfumeId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upc: editForm.upc.trim() || null,
          name: editForm.name.trim(),
          category: editForm.category.trim() || null,
          price: Number(editForm.price) || 0,
          qty: parseInt(editForm.qty, 10) || 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'No se pudo guardar el perfume')
      }

      const updatedPerfume = await response.json()

      setLocalPerfumes((current) =>
        current.map((perfume) =>
          perfume.id === perfumeId
            ? updatedPerfume
            : perfume
        )
      )

      onPerfumeUpdated?.(updatedPerfume)

      toast.success('Perfume actualizado')
      cancelEdit()
    } catch (error) {
      toast.error(error.message || 'Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Inventario de perfumes</h2>
              <p className="text-sm text-slate-600">
                Escribe un UPC o Name para mostrar resultados editables
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isOpen ? 'Close' : 'Open'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Filtro por UPC</span>
            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 focus-within:border-blue-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={upcFilter}
                onChange={(event) => setUpcFilter(event.target.value)}
                placeholder="Buscar UPC..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Filtro por Name</span>
            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 focus-within:border-blue-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder="Buscar nombre..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
          </label>
        </div>
      </div>

      {isOpen ? (
        <Card className="border border-slate-200 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Tabla de inventario</h2>
              <p className="text-sm text-slate-600">
                {hasActiveFilter
                  ? `${filteredPerfumes.length} resultado(s) editable(s)`
                  : 'La tabla se llena solo con los filtros'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-300">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">UPC</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Name</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Categoria</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Precio</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Stock</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Estado</th>
                  <th className="sticky right-0 z-10 border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {!hasActiveFilter ? (
                  <tr>
                    <td colSpan="7" className="border border-slate-300 px-3 py-8 text-center text-slate-500">
                      Escribe un valor en UPC o Name para mostrar productos.
                    </td>
                  </tr>
                ) : filteredPerfumes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="border border-slate-300 px-3 py-8 text-center text-slate-500">
                      No hay perfumes que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredPerfumes.map((perfume, index) => {
                    const stock = Number(perfume.qty) || 0
                    const isEditing = editingId === perfume.id

                    return (
                      <tr key={perfume.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        {isEditing ? (
                          <>
                            <td className="border border-slate-300 px-3 py-2">
                              <input
                                type="text"
                                value={editForm.upc}
                                onChange={(event) => setEditForm({ ...editForm, upc: event.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              <input
                                type="text"
                                value={editForm.category}
                                onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.price}
                                onChange={(event) => setEditForm({ ...editForm, price: event.target.value })}
                                className="w-24 rounded border border-slate-300 px-2 py-1 font-mono"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              <input
                                type="number"
                                value={editForm.qty}
                                onChange={(event) => setEditForm({ ...editForm, qty: event.target.value })}
                                className="w-20 rounded border border-slate-300 px-2 py-1 font-mono"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-600">
                              {getStockStatus(parseInt(editForm.qty, 10) || 0)}
                            </td>
                            <td className="sticky right-0 border border-slate-300 bg-white px-3 py-2">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => saveEdit(perfume.id)}
                                  disabled={saving}
                                  className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Guardar"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  disabled={saving}
                                  className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border border-slate-300 px-3 py-2 font-mono text-slate-800">
                              {perfume.upc || <span className="text-slate-400">-</span>}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-slate-800">{perfume.name}</td>
                            <td className="border border-slate-300 px-3 py-2 text-slate-800">
                              {perfume.category || <span className="text-slate-400">-</span>}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 font-mono text-slate-800">
                              ${(Number(perfume.price) || 0).toFixed(2)}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 font-mono text-slate-800">{stock}</td>
                            <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-800">
                              {getStockStatus(stock)}
                            </td>
                            <td className="sticky right-0 border border-slate-300 bg-inherit px-3 py-2">
                              <button
                                type="button"
                                onClick={() => startEdit(perfume)}
                                className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                title="Editar"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            La columna de acciones queda fija a la derecha para que siempre puedas editar aunque la tabla tenga scroll horizontal.
          </p>
        </Card>
      ) : null}
    </div>
  )
}
