import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@components/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="text-9xl font-bold text-gradient">
          404
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">
          Página no encontrada
        </h1>
        
        <p className="text-gray-600 max-w-md mx-auto">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>
          
          <Button
            icon={Home}
            onClick={() => navigate('/')}
          >
            Ir al Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
