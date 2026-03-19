import { Check } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'
import { PERFUME_CONDITION_OPTIONS, isPerfumeCategory } from '@/utils/productMeta'

export default function AddProductForm({ 
  addForm, 
  setAddForm, 
  categories,
  onSubmit, 
  onCancel 
}) {
  const showPerfumeFields = isPerfumeCategory(addForm.category)

  return (
    <Card title="Agregar Producto" icon={Check}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="UPC (Código de Barras)"
            placeholder="123456789"
            value={addForm.upc}
            onChange={(e) => setAddForm({ ...addForm, upc: e.target.value })}
          />
          <Input
            label="Nombre *"
            placeholder="Nombre del producto"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            required
          />
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Categoría
            </label>
            <select
              value={addForm.category}
              onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 focus:outline-none input-focus border-gray-200 focus:border-primary-600"
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Precio *"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={addForm.price}
            onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
            required
          />
          <Input
            label="Cantidad"
            type="number"
            placeholder="0"
            value={addForm.qty}
            onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })}
          />
        </div>

        {showPerfumeFields ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-800">
              Detalles de perfume
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Size"
                placeholder="100 ml"
                value={addForm.perfume_size}
                onChange={(e) => setAddForm({ ...addForm, perfume_size: e.target.value })}
              />
              <Input
                label="Fragrance Type"
                placeholder="Eau de Parfum"
                value={addForm.fragrance_type}
                onChange={(e) => setAddForm({ ...addForm, fragrance_type: e.target.value })}
              />
              <div className="w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Condition
                </label>
                <select
                  value={addForm.perfume_condition}
                  onChange={(e) => setAddForm({ ...addForm, perfume_condition: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 focus:outline-none input-focus border-gray-200 focus:border-primary-600"
                >
                  <option value="">Seleccionar</option>
                  {PERFUME_CONDITION_OPTIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" icon={Check}>
            Crear Producto
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
