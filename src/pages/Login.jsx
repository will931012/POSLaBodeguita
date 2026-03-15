import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, User } from 'lucide-react'
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
      const res = await fetch(`${API}/api/users?location_id=${locationId}`)
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Load users error:', error)
      toast.error('Error al cargar usuarios')
      setUsers([])
    }
  }

  const handlePinInput = (digit) => {
    if (pin.length < 6) setPin(pin + digit)
  }

  const handlePinDelete = () => setPin(pin.slice(0, -1))

  const handleLogin = async () => {
    if (!selectedUser) return toast.error('Selecciona un usuario')
    if (pin.length < 4) return toast.error('Ingresa tu PIN completo')

    try {
      setLoading(true)
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          pin,
          location_id: location.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'PIN incorrecto')
      }

      const data = await res.json()
      await login(location, data.user, data.token)
      toast.success(`Bienvenido, ${data.user.name}`)
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Error al iniciar sesion')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key >= '0' && e.key <= '9') handlePinInput(e.key)
      else if (e.key === 'Backspace') handlePinDelete()
      else if (e.key === 'Enter' && pin.length >= 4) handleLogin()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [pin, selectedUser])

  if (!location) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/')} className="mb-6">
          Cambiar ubicacion
        </Button>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-950">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-primary-950">{location.name}</h1>
          <p className="text-primary-500">Inicia sesion para continuar</p>
        </motion.div>

        {!selectedUser ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 rounded-2xl border border-primary-100 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-primary-950">Selecciona tu usuario</h2>

            {users.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedUser(user)}
                className="flex w-full items-center gap-4 rounded-xl border-2 border-transparent bg-[#F4F4F4] p-4 text-left transition-colors hover:border-accent-600 hover:bg-primary-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-950">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-primary-950">{user.name}</div>
                  <div className="text-sm capitalize text-primary-500">{user.role}</div>
                </div>
                <Check className="h-5 w-5 text-accent-600 opacity-0" />
              </motion.button>
            ))}

            {users.length === 0 && (
              <div className="py-8 text-center">
                <p className="mb-2 text-primary-400">No hay usuarios disponibles para esta ubicacion</p>
                <button onClick={() => loadUsers(location.id)} className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                  Reintentar
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 rounded-2xl border border-primary-100 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-4 rounded-xl border-2 border-primary-100 bg-[#F4F4F4] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-950">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-primary-950">{selectedUser.name}</div>
                <div className="text-sm capitalize text-primary-500">{selectedUser.role}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setPin('')
                }}
                className="text-sm text-accent-600 hover:underline"
              >
                Cambiar
              </button>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold uppercase tracking-wider text-primary-600">Ingresa tu PIN</label>

              <div className="mb-6 flex justify-center gap-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-all ${
                      i < pin.length
                        ? 'border-accent-600 bg-accent-50 text-accent-600'
                        : 'border-primary-200 bg-[#F4F4F4] text-primary-300'
                    }`}
                  >
                    {i < pin.length ? '•' : ''}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinInput(digit.toString())}
                    disabled={loading}
                    className="h-14 rounded-xl bg-[#F4F4F4] text-lg font-semibold text-primary-600 transition-colors hover:bg-primary-100 disabled:opacity-50"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={handlePinDelete}
                  disabled={loading}
                  className="h-14 rounded-xl bg-accent-50 font-semibold text-accent-700 transition-colors hover:bg-accent-100 disabled:opacity-50"
                >
                  ←
                </button>
                <button
                  onClick={() => handlePinInput('0')}
                  disabled={loading}
                  className="h-14 rounded-xl bg-[#F4F4F4] text-lg font-semibold text-primary-600 transition-colors hover:bg-primary-100 disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handleLogin}
                  disabled={pin.length < 4 || loading}
                  className="h-14 rounded-xl bg-primary-950 font-semibold text-white transition-colors hover:bg-primary-800 disabled:bg-primary-200"
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
