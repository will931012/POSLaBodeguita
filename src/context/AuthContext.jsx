import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [location, setLocation] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing session
    const savedToken = localStorage.getItem('pos_token')
    const savedUser = localStorage.getItem('pos_user')
    const savedLocation = localStorage.getItem('pos_location')

    if (savedToken && savedUser && savedLocation) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setLocation(JSON.parse(savedLocation))
    }

    setLoading(false)
  }, [])

  const login = async (locationData, userData, sessionToken) => {
    setLocation(locationData)
    setUser(userData)
    setToken(sessionToken)

    // Save to localStorage
    localStorage.setItem('pos_token', sessionToken)
    localStorage.setItem('pos_user', JSON.stringify(userData))
    localStorage.setItem('pos_location', JSON.stringify(locationData))
  }

  const logout = async () => {
    // Call API to end session
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    // Clear state and localStorage
    setUser(null)
    setLocation(null)
    setToken(null)
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    localStorage.removeItem('pos_location')
  }

  const hasRole = (roles) => {
    if (!user) return false
    if (Array.isArray(roles)) {
      return roles.includes(user.role)
    }
    return user.role === roles
  }

  const value = {
    user,
    location,
    token,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
