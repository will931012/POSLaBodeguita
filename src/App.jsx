import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from 'sonner'

// Auth Pages
import LocationSelector from './pages/LocationSelector'
import Login from './pages/Login'

// Protected Pages
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import Inventory from './pages/Inventory'
import Receipts from './pages/Receipts'
import CloseCash from './pages/CloseCash'
import ProductLabel from './pages/ProductLabel'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'

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
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Sales - all roles */}
        <Route path="/sales" element={<Sales />} />

        {/* Inventory - admin & manager */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Inventory />
            </ProtectedRoute>
          }
        />

        {/* Receipts */}
        <Route path="/receipts" element={<Receipts />} />

        {/* Close cash */}
        <Route
          path="/close"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <CloseCash />
            </ProtectedRoute>
          }
        />

        {/* Product label */}
        <Route
          path="/label/:id"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <ProductLabel />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard - admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
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