import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import AnnouncementModal from './AnnouncementModal'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden">
        <Navbar />
      </div>
      <div className="print:hidden">
        <AnnouncementModal />
      </div>
      
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto max-w-7xl px-4 py-8 print:max-w-none print:px-0 print:py-0"
      >
        <Outlet />
      </motion.main>
      
      <footer className="mt-12 border-t border-gray-200 bg-white py-6 print:hidden">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2026 Compassion & Love POS - Sistema de Punto de Venta</p>
        </div>
      </footer>
    </div>
  )
}
