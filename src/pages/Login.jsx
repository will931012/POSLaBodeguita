import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { User, Lock, ArrowLeft, Check } from 'lucide-react'
import Button from '@components/Button'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Login() {
  const [location, setLocation] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    // Get selected location from sessionStorage
    const savedLocation = sessionStorage.getItem('selected_location')
    if (!savedLocation) {
      navigate('/')
      return
    }

    const locationData = JSON.parse(savedLocation)
    setLocation(locationData)
    loadUsers(locationData.id)
  }, [navigate])

  const loadUsers = async (locationId) => {
    try {
      console.log('🔍 Fetching users for location:', locationId)
      
      const res = await fetch(`${API}/api/users?location_id=${locationId}`)
      
      console.log('📡 Response status:', res.status)
      console.log('📡 Response ok:', res.ok)
      
      if (!res.ok) throw new Error('Failed to load users')
      
      const data = await res.json()
      console.log('📦 Users data:', data)
      
      // El backend ya devuelve solo usuarios activos
      // Solo verificamos que sea un array
      setUsers(Array.isArray(data) ? data : [])
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('✅ Loaded', data.length, 'users')
      } else {
        console.warn('⚠️ No users received for location', locationId)
      }
    } catch (error) {
      console.error('❌ Load users error:', error)
      toast.error('Error al cargar usuarios')
      setUsers([])
    }
  }

  const handlePinInput = (digit) => {
    if (pin.length < 6) {
      setPin(pin + digit)
    }
  }

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1))
  }

  const handleLogin = async () => {
    if (!selectedUser) {
      toast.error('Selecciona un usuario')
      return
    }

    if (pin.length < 4) {
      toast.error('Ingresa tu PIN completo')
      return
    }

    try {
      setLoading(true)
      console.log('🔐 Attempting login:', {
        user_id: selectedUser.id,
        user_name: selectedUser.name,
        location_id: location.id,
        pin_length: pin.length
      })

      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          pin: pin,
          location_id: location.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'PIN incorrecto')
      }

      const data = await res.json()
      console.log('✅ Login successful:', data)

      // Login via context
      await login(location, data.user, data.token)

      toast.success(`¡Bienvenido, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (error) {
      console.error('❌ Login error:', error)
      toast.error(error.message || 'Error al iniciar sesión')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      handlePinInput(e.key)
    } else if (e.key === 'Backspace') {
      handlePinDelete()
    } else if (e.key === 'Enter' && pin.length >= 4) {
      handleLogin()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [pin, selectedUser])

  if (!location) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={() => navigate('/')}
          className="mb-6"
        >
          Cambiar Ubicación
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {location.name}
          </h1>
          <p className="text-gray-600">
            Inicia sesión para continuar
          </p>
        </motion.div>

        {/* User Selection */}
        {!selectedUser ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 space-y-3"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Selecciona tu usuario
            </h2>

            {users.map(user => (
              <motion.button
                key={user.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedUser(user)}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-primary-50 rounded-xl transition-colors border-2 border-transparent hover:border-primary-500"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{user.role}</div>
                </div>
                <Check className="w-5 h-5 text-primary-600 opacity-0" />
              </motion.button>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">
                  No hay usuarios disponibles para esta ubicación
                </p>
                <button
                  onClick={() => loadUsers(location.id)}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                >
                  Reintentar
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 space-y-6"
          >
            {/* Selected User */}
            <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl border-2 border-primary-200">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{selectedUser.name}</div>
                <div className="text-sm text-gray-600 capitalize">{selectedUser.role}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setPin('')
                }}
                className="text-sm text-primary-600 hover:underline"
              >
                Cambiar
              </button>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Ingresa tu PIN
              </label>
              
              {/* PIN Display */}
              <div className="flex gap-3 justify-center mb-6">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                      i < pin.length
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {i < pin.length ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* PIN Keypad */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                  <button
                    key={digit}
                    onClick={() => handlePinInput(digit.toString())}
                    disabled={loading}
                    className="h-14 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl font-semibold text-lg transition-colors"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={handlePinDelete}
                  disabled={loading}
                  className="h-14 bg-red-100 hover:bg-red-200 disabled:opacity-50 rounded-xl font-semibold transition-colors text-red-700"
                >
                  ←
                </button>
                <button
                  onClick={() => handlePinInput('0')}
                  disabled={loading}
                  className="h-14 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl font-semibold text-lg transition-colors"
                >
                  0
                </button>
                <button
                  onClick={handleLogin}
                  disabled={pin.length < 4 || loading}
                  className="h-14 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 rounded-xl font-semibold transition-colors text-white"
                >
                  {loading ? '...' : '✓'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}