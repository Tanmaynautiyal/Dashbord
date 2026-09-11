import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authService, type User } from '../services/authService'

const DEMO_ADMIN_EMAIL = 'admin@dev.prod'
const DEMO_ADMIN_PASSWORD = 'Admin@123'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<void>
  setSession: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [isLoading, setIsLoading] = useState(() => {
    const stored = localStorage.getItem('auth_token')
    return !!stored
  })

  useEffect(() => {
    let cancelled = false
    const stored = localStorage.getItem('auth_token')
    if (!stored) {
      setIsLoading(false)
      return
    }

    authService.getMe()
      .then((userData) => {
        if (!cancelled) {
          setUser(userData)
          localStorage.setItem('auth_user', JSON.stringify(userData))
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout()
          setIsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const normalizedEmail = email.trim().toLowerCase()
    setIsLoading(true)
    try {

      const res = await authService.login(email, password)
      localStorage.setItem('auth_token', res.access_token)
      localStorage.setItem('auth_user', JSON.stringify(res.user))
      setToken(res.access_token)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      await authService.register(name, email, password)
      await login(email, password)
    } finally {
      setIsLoading(false)
    }
  }, [login])

  const setSession = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      setSession,
      logout,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role?.toLowerCase() === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
