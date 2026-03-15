import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, isAuthenticated, hasRole } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (roles.length > 0 && !hasRole(roles)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h1 className="mb-2 text-2xl font-bold text-primary-950">Acceso denegado</h1>
          <p className="mb-6 text-primary-600">No tienes permisos para acceder a esta pagina.</p>
          {user?.role && (
            <p className="text-sm text-primary-400">
              Tu rol: <span className="font-semibold capitalize text-primary-600">{user.role}</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  return children ? children : <Outlet />
}
