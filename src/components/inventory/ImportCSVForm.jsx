import { Upload } from 'lucide-react'
import Card from '@components/Card'
import Button from '@components/Button'

export default function ImportCSVForm({
  importFile,
  setImportFile,
  importResult,
  importing,
  onPreview,
  onImport,
  onCancel,
  fileInputRef
}) {
  return (
    <Card title="Importar Productos (CSV)" icon={Upload}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Formato CSV: upc,name,price,qty,category
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => setImportFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>

        {importResult && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Resultado de Importación</h3>
            <p>Importados: {importResult.imported}</p>
            <p>Errores: {importResult.errors}</p>
            {importResult.preview && (
              <div className="mt-2">
                <p className="text-sm font-semibold">Vista Previa:</p>
                <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(importResult.preview, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onPreview}
            loading={importing}
            disabled={!importFile}
            variant="outline"
          >
            Vista Previa
          </Button>
          <Button
            onClick={onImport}
            loading={importing}
            disabled={!importFile}
            icon={Upload}
          >
            Importar
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  )
}