import { Plus } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

export default function TempProductForm({ tempForm, setTempForm, onSubmit }) {
  return (
    <Card title="Producto Temporal" icon={Plus}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Agregar Temp
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}