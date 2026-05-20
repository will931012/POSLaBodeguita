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
  const productName = product?.name || 'Producto'

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
      <style>
        {`
          @media print {
            @page {
              size: 2.625in 1in;
              margin: 0;
            }
          }
        `}
      </style>

      <div className="flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Etiqueta de Producto</h1>
          <p className="mt-2 text-gray-600">Genera una etiqueta imprimible en formato 1 x 2 5/8 pulgadas.</p>
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
          <div className="mx-auto flex min-h-[1in] w-[2.625in] flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white p-3 shadow-sm print:min-h-[1in] print:w-[2.625in] print:rounded-none print:border-0 print:p-[0.08in] print:shadow-none">
            <div className="space-y-1 text-center">
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-slate-500 print:hidden">
                Etiqueta UPC
              </p>
              <h2 className="max-h-[1.8em] overflow-hidden text-[0.7rem] font-bold uppercase leading-tight text-slate-900">
                {productName}
              </h2>
            </div>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 print:mt-1 print:rounded-none print:border-0 print:bg-white print:px-0 print:py-0">
              {upc ? (
                barcodeSupported && barcodeSvg ? (
                  <div className="space-y-1">
                    <div
                      className="mx-auto h-[0.34in] w-full bg-white print:h-[0.34in]"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                    <p className="text-center font-mono text-[0.5rem] leading-none tracking-[0.12em] text-slate-900">
                      {upc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <AlertTriangle className="mx-auto h-5 w-5 text-amber-500" />
                    <p className="text-[0.55rem] leading-tight text-slate-700">
                      Este UPC contiene caracteres que esta etiqueta no puede renderizar todavia.
                    </p>
                    <p className="font-mono text-[0.55rem] text-slate-900">{upc}</p>
                  </div>
                )
              ) : (
                <div className="space-y-1 py-2 text-center">
                  <ScanLine className="mx-auto h-5 w-5 text-slate-400" />
                  <p className="text-[0.55rem] text-slate-600">Este producto no tiene UPC.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
