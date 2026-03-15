import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import AnnouncementModal from './AnnouncementModal'

export default function Layout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <AnnouncementModal />
      
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        <Outlet />
      </motion.main>
      
      <footer className="bg-primary-950 border-t border-primary-800 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-primary-100 text-sm">
          <p>© 2026 Compassion & Love POS - Sistema de Punto de Venta</p>
        </div>
      </footer>
    </div>
  )
}
