import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight, Store } from 'lucide-react'
import Button from '@components/Button'
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
      console.error('❌ Load locations error:', error)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center mb-4">
            <Store className="w-14 h-14 text-primary-600" />
          </div>
          <h1 className="text-5xl font-bold text-primary-700 mb-3">
            Sistema POS
          </h1>
          <p className="text-xl text-gray-600">
            Selecciona tu ubicación para continuar
          </p>
        </motion.div>

        {/* LOCATIONS GRID */}
        {locations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
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
                  className="
                    w-full h-full min-h-[300px]
                    bg-white rounded-2xl shadow-xl
                    hover:shadow-2xl transition-all
                    p-8 border-2 border-transparent
                    hover:border-primary-500
                    flex flex-col items-center text-center
                    group
                  "
                >
                  {/* ICON */}
                  <div className="
                    w-16 h-16 mb-6
                    bg-gradient-to-br from-primary-600 to-primary-700
                    rounded-2xl flex items-center justify-center
                    group-hover:scale-110 transition-transform
                  ">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {location.name}
                    </h2>

                    {location.address && (
                      <p className="text-gray-600 mb-2 line-clamp-2">
                        {location.address}
                      </p>
                    )}

                    {location.phone && (
                      <p className="text-sm text-gray-500">
                        📞 {location.phone}
                      </p>
                    )}
                  </div>

                  {/* ACTION */}
                  <div className="
                    mt-6 flex items-center gap-2
                    text-primary-600 font-semibold
                    group-hover:gap-4 transition-all
                  ">
                    <span>Continuar</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {locations.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Store className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg mb-2">
              No hay ubicaciones disponibles
            </p>
            <button
              onClick={loadLocations}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Reintentar
            </button>
          </motion.div>
        )}

        {/* FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16 text-gray-500 text-sm"
        >
          <p>© 2026 POS Multi-Store System</p>
        </motion.div>
      </div>
    </div>
  )
}
