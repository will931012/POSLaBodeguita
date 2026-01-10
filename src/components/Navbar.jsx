import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Receipt, 
  DollarSign, 
  Menu, 
  X 
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/sales', label: 'Ventas', icon: ShoppingCart },
  { path: '/inventory', label: 'Inventario', icon: Package },
  { path: '/receipts', label: 'Recibos', icon: Receipt },
  { path: '/close', label: 'Cierre', icon: DollarSign },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 gradient-dark shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/50"
            >
              <ShoppingCart className="w-6 h-6 text-white" strokeWidth={2.5} />
            </motion.div>
            
            <div className="hidden sm:block">
              <div className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors">
                Compassion & Love
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Point of Sale
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative group"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg
                      transition-all duration-200
                      ${active 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/50' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </motion.div>
                  
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-400 rounded-full"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden pb-4"
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                    transition-all duration-200
                    ${active 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              )
            })}
          </motion.div>
        )}
      </div>
    </nav>
  )
}
