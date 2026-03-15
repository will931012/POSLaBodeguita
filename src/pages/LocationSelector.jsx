import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, Store } from 'lucide-react'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function LocationSelector() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/locations`)
      if (!res.ok) throw new Error('Failed to load locations')
      const data = await res.json()
      setLocations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Load locations error:', error)
      toast.error('Error al cargar ubicaciones')
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  const selectLocation = (location) => {
    sessionStorage.setItem('selected_location', JSON.stringify(location))
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-14 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Store className="h-14 w-14 text-accent-600" />
          </div>
          <h1 className="mb-3 text-5xl font-bold text-primary-950">Sistema POS</h1>
          <p className="text-xl text-primary-500">Selecciona tu ubicacion para continuar</p>
        </motion.div>

        {locations.length > 0 && (
          <div className="grid auto-rows-fr grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <button
                  onClick={() => selectLocation(location)}
                  className="group flex h-full min-h-[300px] w-full flex-col items-center rounded-2xl border-2 border-primary-100 bg-white p-8 text-center shadow-xl transition-all hover:border-accent-600 hover:shadow-2xl"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-950 transition-transform group-hover:scale-110">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>

                  <div className="flex flex-1 flex-col justify-center">
                    <h2 className="mb-2 line-clamp-2 text-2xl font-bold text-primary-950">{location.name}</h2>
                    {location.address && <p className="mb-2 line-clamp-2 text-primary-500">{location.address}</p>}
                    {location.phone && <p className="text-sm text-primary-400">{location.phone}</p>}
                  </div>

                  <div className="mt-6 flex items-center gap-2 font-semibold text-accent-600 transition-all group-hover:gap-4">
                    <span>Continuar</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {locations.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <Store className="mx-auto mb-4 h-16 w-16 text-primary-300" />
            <p className="mb-2 text-lg text-primary-500">No hay ubicaciones disponibles</p>
            <button onClick={loadLocations} className="font-semibold text-accent-600 hover:text-accent-700">
              Reintentar
            </button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-16 text-center text-sm text-primary-400">
          <p>© 2026 POS Multi-Store System</p>
        </motion.div>
      </div>
    </div>
  )
}
