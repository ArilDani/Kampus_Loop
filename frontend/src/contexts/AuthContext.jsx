import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kampusloop_session')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  // Validate or restore session from backend on mount
  useEffect(() => {
    api.get('/auth/me/')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('kampusloop_session', JSON.stringify(res.data))
      })
      .catch(() => {
        // Keep cached user if offline or clear
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password })
    const userData = res.data.user || res.data
    setUser(userData)
    localStorage.setItem('kampusloop_session', JSON.stringify(userData))
    return res.data
  }

  const register = async (nama, email, kampus, password) => {
    const res = await api.post('/auth/register/', { nama, email, kampus, password })
    const userData = res.data.user || res.data
    setUser(userData)
    localStorage.setItem('kampusloop_session', JSON.stringify(userData))
    return res.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout/')
    } catch {
      // Ignored
    }
    setUser(null)
    localStorage.removeItem('kampusloop_session')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
