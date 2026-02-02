import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from 'sonner'

// Auth Pages (no lazy - needed immediately)
import LocationSelector from './pages/LocationSelector'
import Login from './pages/Login'

// Layout components (no lazy - needed for all routes)
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'

// Lazy load heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Caja = lazy(() => import('./pages/Caja'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Receipts = lazy(() => import('./pages/Receipts'))
const CloseCash = lazy(() => import('./pages/CloseCash'))
const ProductLabel = lazy(() => import('./pages/ProductLabel'))
const AdminDashboard = lazy(() => import('./pages/Admindashboard'))

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LocationSelector />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      {/* Protected layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - all roles */}
        <Route 
          path="/dashboard" 
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          } 
        />

        {/* Caja - all roles */}
        <Route 
          path="/caja" 
          element={
            <Suspense fallback={<PageLoader />}>
              <Caja />
            </Suspense>
          } 
        />

        {/* Inventory - admin & manager */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Suspense fallback={<PageLoader />}>
                <Inventory />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Receipts */}
        <Route 
          path="/receipts" 
          element={
            <Suspense fallback={<PageLoader />}>
              <Receipts />
            </Suspense>
          } 
        />

        {/* Close cash */}
        <Route
          path="/close"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Suspense fallback={<PageLoader />}>
                <CloseCash />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Product label */}
        <Route
          path="/label/:id"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Suspense fallback={<PageLoader />}>
                <ProductLabel />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard - admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}