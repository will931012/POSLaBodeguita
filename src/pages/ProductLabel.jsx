import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer, ScanLine, AlertTriangle } from 'lucide-react'
import Card from '@components/Card'
import Button from '@components/Button'
import { useAuth } from '@/context/AuthContext'
import { buildBarcodeSvg, canRenderBarcode } from '@/utils/barcode'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function ProductLabel() {
  const { id } = useParams()
  const { token } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        setError('')

        const res = await fetch(`${API}/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Failed to load product')

        const data = await res.json()
        setProduct(data)
      } catch (loadError) {
        console.error('Product label load error:', loadError)
        setError('No se pudo cargar el producto')
      } finally {
        setLoading(false)
      }
    }

    if (token && id) {
      loadProduct()
    }
  }, [id, token])

  const upc = String(product?.upc || '').trim()
  const barcodeSvg = upc ? buildBarcodeSvg(upc) : null
  const barcodeSupported = upc ? canRenderBarcode(upc) : false

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none print:space-y-0">
      <div className="flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Etiqueta de Producto</h1>
          <p className="mt-2 text-gray-600">Genera una imagen imprimible del UPC del producto.</p>
        </div>
        <Button type="button" icon={Printer} onClick={() => window.print()}>
          Imprimir
        </Button>
      </div>

      <Card
        title="Vista previa"
        headerClassName="print:hidden"
        className="print:border-0 print:shadow-none"
        bodyClassName="print:p-0"
      >
        {loading ? (
          <div className="py-16 text-center text-gray-500">Cargando etiqueta...</div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <div className="space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 print:hidden">
                Etiqueta UPC
              </p>
              <h2 className="text-3xl font-bold text-slate-900">{product?.name || 'Producto'}</h2>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 print:mt-6 print:rounded-none print:border-0 print:bg-white print:p-0">
              {upc ? (
                barcodeSupported && barcodeSvg ? (
                  <div className="space-y-3">
                    <div
                      className="mx-auto h-32 w-full max-w-xl bg-white p-3 print:h-28 print:max-w-none print:p-0"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                    <p className="text-center font-mono text-2xl tracking-[0.28em] text-slate-900">
                      {upc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                    <p className="text-sm text-slate-700">
                      Este UPC contiene caracteres que esta etiqueta no puede renderizar todavia.
                    </p>
                    <p className="font-mono text-lg text-slate-900">{upc}</p>
                  </div>
                )
              ) : (
                <div className="space-y-3 py-8 text-center">
                  <ScanLine className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="text-slate-600">Este producto no tiene UPC.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
