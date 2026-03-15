import { Camera, Scan, Search } from 'lucide-react'
import Card from '@components/Card'
import Input from '@components/Input'
import Button from '@components/Button'

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  onKeyDown,
  onCameraClick,
  isScanning,
  searchInputRef,
}) {
  return (
    <div className="sticky top-0 z-30 -mx-6 bg-white px-6 py-4 shadow-sm">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-accent-600" />
            <span className="text-sm font-semibold uppercase text-primary-600">Buscar productos</span>
          </div>

          <Button variant="outline" icon={Camera} onClick={onCameraClick} loading={isScanning} className="md:hidden">
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

          <Button variant="outline" icon={Camera} onClick={onCameraClick} loading={isScanning} className="hidden md:flex">
            {isScanning ? 'Analizando...' : 'Tomar foto'}
          </Button>
        </div>

        <div className="mt-2 text-xs text-primary-400">
          Tip: usa escaner fisico con Enter o toma foto del codigo con la camara.
        </div>
      </Card>
    </div>
  )
}
