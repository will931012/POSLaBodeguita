import { Check } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

export default function AddProductForm({ addForm, setAddForm, categories, onSubmit, onCancel }) {
  return (
    <Card title="Agregar Producto" icon={Check}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="UPC (Codigo de barras)" placeholder="123456789" value={addForm.upc} onChange={(e) => setAddForm({ ...addForm, upc: e.target.value })} />
          <Input label="Nombre *" placeholder="Nombre del producto" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
          <div className="w-full">
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-primary-600">Categoria</label>
            <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} className="w-full rounded-xl border-2 border-primary-200 bg-[#F4F4F4] px-4 py-3 font-medium text-primary-600 transition-all duration-200 focus:border-accent-600 focus:outline-none">
              <option value="">Sin categoria</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <Input label="Precio *" type="number" step="0.01" placeholder="0.00" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} required />
          <Input label="Cantidad" type="number" placeholder="0" value={addForm.qty} onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" icon={Check}>Crear producto</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </form>
    </Card>
  )
}
