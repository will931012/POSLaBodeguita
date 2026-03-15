import { Scan, Camera, Search } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  onKeyDown,
  onCameraClick,
  isScanning,
  searchInputRef
}) {
  return (
    <div className="sticky top-0 z-30 bg-white py-4 -mx-6 px-6 shadow-sm">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-semibold text-gray-600 uppercase">
              Buscar Productos
            </span>
          </div>
          
          {/* Botón de cámara para móviles */}
          <Button
            variant="outline"
            icon={Camera}
            onClick={onCameraClick}
            loading={isScanning}
            className="md:hidden"
          >
            {isScanning ? '...' : 'Foto'}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              ref={searchInputRef}
              icon={Search}
              placeholder="Escanea UPC o busca por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          
          {/* Botón de cámara para desktop */}
          <Button
            variant="outline"
            icon={Camera}
            onClick={onCameraClick}
            loading={isScanning}
            className="hidden md:flex"
          >
            {isScanning ? 'Analizando...' : 'Tomar Foto'}
          </Button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          💡 Tip: Escanea con escáner físico (Enter) o toma foto del código con la cámara
        </div>
      </Card>
    </div>
  )
}