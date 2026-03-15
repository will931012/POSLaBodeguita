import { Upload } from 'lucide-react'
import Card from '@components/Card'
import Button from '@components/Button'

export default function ImportCSVForm({ importFile, setImportFile, importResult, importing, onPreview, onImport, onCancel, fileInputRef }) {
  return (
    <Card title="Importar Productos (Excel o CSV)" icon={Upload}>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-primary-600">
            Formato: columnas `upc`, `name`, `price`, `qty`, `category`
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setImportFile(e.target.files[0])}
            className="block w-full text-sm text-primary-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#F4F4F4] file:px-4 file:py-2 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="mt-2 text-xs text-primary-400">
            Recomendado: archivo Excel `.xlsx` con la primera hoja usando esos encabezados.
          </p>
        </div>

        {importResult && (
          <div className="rounded-xl border border-primary-100 bg-[#F4F4F4] p-4">
            <h3 className="mb-2 font-semibold text-primary-950">Resultado de importacion</h3>
            <p className="text-primary-600">Importados: {importResult.imported}</p>
            <p className="text-primary-600">Errores: {importResult.errors}</p>
            {importResult.preview && (
              <div className="mt-2">
                <p className="text-sm font-semibold text-primary-600">Vista previa:</p>
                <pre className="mt-1 overflow-x-auto rounded border border-primary-100 bg-white p-2 text-xs text-primary-600">
                  {JSON.stringify(importResult.preview, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onPreview} loading={importing} disabled={!importFile} variant="outline">Vista previa</Button>
          <Button onClick={onImport} loading={importing} disabled={!importFile} icon={Upload}>Importar</Button>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </div>
    </Card>
  )
}
