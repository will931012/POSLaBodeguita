import { Tag } from 'lucide-react'

export default function ProductBarcodeButton({ productId }) {
  return (
    <a
      href={`/label/${productId}`}
      target="_blank"
      rel="noreferrer"
      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
      title="Generar etiqueta UPC"
    >
      <Tag className="w-4 h-4" />
    </a>
  )
}
