import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  LayoutDashboard, 
  Package, 
  Receipt, 
  DollarSign,
  Menu,
  X,
  LogOut,
  User,
  MapPin
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Button from '@components/Button'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user, location: userLocation, logout, hasRole, loading } = useAuth()

  // ⛑️ GUARD: evita render mientras Auth se hidrata
  if (loading || !user) return null

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] },
    { path: '/sales', label: 'Caja', icon: ShoppingCart, roles: [] },
    { path: '/inventory', label: 'Inventario', icon: Package, roles: ['admin', 'manager'] },
    { path: '/receipts', label: 'Recibos', icon: Receipt, roles: [] },
    { path: '/close', label: 'Cierre', icon: DollarSign, roles: ['admin', 'manager'] },
  ]

  const visibleItems = navItems.filter(
    item => item.roles.length === 0 || hasRole(item.roles)
  )

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión?')) {
      await logout()
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-primary-700 to-primary-600 shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center"
            >
              <ShoppingCart className="w-6 h-6 text-primary-600" />
            </motion.div>
            <span className="text-white font-bold text-xl hidden sm:block">
              POS System
            </span>
          </Link>

          {/* User Info - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl">
              <MapPin className="w-4 h-4 text-white/70" />
              <span className="text-white/90 text-sm font-medium">
                {userLocation?.name}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl">
              <User className="w-4 h-4 text-white/70" />
              <div>
                <div className="text-white/90 text-sm font-medium">
                  {user.name}
                </div>
                <div className="text-white/60 text-xs capitalize">
                  {user.role}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 rounded-xl transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-2 text-white/80 hover:text-white">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"
                    />
                  )}
                </Link>
              )
            })}

            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-200" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 space-y-2"
          >
            <div className="px-4 py-3 bg-white/10 rounded-xl mb-4">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-white/70" />
                <div>
                  <div className="text-white font-medium">{user.name}</div>
                  <div className="text-white/60 text-sm capitalize">{user.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <MapPin className="w-4 h-4" />
                {userLocation?.name}
              </div>
            </div>

            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-white text-primary-600'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
