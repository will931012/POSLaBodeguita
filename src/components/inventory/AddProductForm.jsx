import { Check } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

export default function AddProductForm({ 
  addForm, 
  setAddForm, 
  categories,
  onSubmit, 
  onCancel 
}) {
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
