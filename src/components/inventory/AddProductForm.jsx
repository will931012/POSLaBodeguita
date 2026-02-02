import { Check } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

export default function AddProductForm({ 
  addForm, 
  setAddForm, 
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
          <Input
            label="Categoría"
            placeholder="Bebidas, Snacks, etc."
            value={addForm.category}
            onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
          />
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