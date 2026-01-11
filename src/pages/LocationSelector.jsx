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
      console.log('🔍 Fetching locations from:', `${API}/api/locations`)
      
      const res = await fetch(`${API}/api/locations`)
      
      console.log('📡 Response status:', res.status)
      console.log('📡 Response ok:', res.ok)
      
      if (!res.ok) throw new Error('Failed to load locations')
      
      const data = await res.json()
      console.log('📦 Locations data:', data)
      
      // El backend ya devuelve solo ubicaciones activas
      // Solo verificamos que sea un array
      setLocations(Array.isArray(data) ? data : [])
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('✅ Loaded', data.length, 'locations')
      } else {
        console.warn('⚠️ No locations received')
      }
    } catch (error) {
      console.error('❌ Load locations error:', error)
      toast.error('Error al cargar ubicaciones')
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  const selectLocation = (location) => {
    console.log('📍 Selected location:', location.name)
    // Save selected location temporarily
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Store className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-3">
            Sistema POS
          </h1>
          <p className="text-xl text-gray-600">
            Selecciona tu ubicación para continuar
          </p>
        </motion.div>

        {/* Location Cards */}
        {locations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => selectLocation(location)}
                  className="w-full bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all p-8 border-2 border-transparent hover:border-primary-500 group"
                >
                  {/* Location Icon */}
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>

                  {/* Location Name */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {location.name}
                  </h2>

                  {/* Location Address */}
                  {location.address && (
                    <p className="text-gray-600 mb-4">
                      {location.address}
                    </p>
                  )}

                  {/* Phone */}
                  {location.phone && (
                    <p className="text-sm text-gray-500 mb-4">
                      📞 {location.phone}
                    </p>
                  )}

                  {/* Continue Button */}
                  <div className="flex items-center justify-center gap-2 text-primary-600 font-semibold group-hover:gap-4 transition-all">
                    <span>Continuar</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Locations */}
        {locations.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
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

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-gray-500 text-sm"
        >
          <p>© 2026 POS Multi-Store System</p>
        </motion.div>
      </div>
    </div>
  )
}