import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/Button'
import { toast } from 'sonner'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function AnnouncementModal() {
  const { token } = useAuth()
  const [announcement, setAnnouncement] = useState(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!token) {
      setAnnouncement(null)
      return
    }

    const controller = new AbortController()

    const loadAnnouncement = async () => {
      try {
        const res = await fetch(`${API}/api/announcements/active`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (res.status === 204) {
          setAnnouncement(null)
          return
        }

        if (!res.ok) {
          throw new Error('Error al cargar el anuncio')
        }

        const data = await res.json()
        setAnnouncement(data)
      } catch (error) {
        if (error?.name === 'AbortError') return
        console.error('Announcement load error:', error)
      }
    }

    loadAnnouncement()
    const intervalId = setInterval(loadAnnouncement, 5000)

    return () => {
      clearInterval(intervalId)
      controller.abort()
    }
  }, [token])

  const dismissAnnouncement = async () => {
    if (!announcement || closing) return
    setClosing(true)
    try {
      await fetch(`${API}/api/announcements/${announcement.id}/dismiss`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      setAnnouncement(null)
    } catch (error) {
      console.error('Announcement dismiss error:', error)
      toast.error('No se pudo cerrar el anuncio')
    } finally {
      setClosing(false)
    }
  }

  return (
    <AnimatePresence>
      {announcement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {announcement.title}
                </h2>
                <p className="mt-2 text-gray-700 whitespace-pre-line">
                  {announcement.message}
                </p>
              </div>
              <button
                onClick={dismissAnnouncement}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar anuncio"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <Button
                onClick={dismissAnnouncement}
                className="w-full"
                loading={closing}
              >
                Entendido
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
