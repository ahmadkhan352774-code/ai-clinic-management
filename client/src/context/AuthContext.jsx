import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'

const AuthContext = createContext(null)

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('clinic_user'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem('clinic_token')))

  const persistSession = ({ token, user: nextUser }) => {
    localStorage.setItem('clinic_token', token)
    localStorage.setItem('clinic_user', JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  const clearSession = () => {
    localStorage.removeItem('clinic_user')
    localStorage.removeItem('clinic_token')
    setUser(null)
  }

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem('clinic_token')

      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const { data } = await api.get('/auth/me')
        const nextUser = data.user
        localStorage.setItem('clinic_user', JSON.stringify(nextUser))
        setUser(nextUser)
      } catch {
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    loadCurrentUser()
  }, [])

  const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback

  const login = async ({ email, password }) => {
    setIsLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      const nextUser = persistSession(data)
      toast.success(`Signed in as ${nextUser.role}`)
      return nextUser
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed')
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async ({ name, email, password, role }) => {
    setIsLoading(true)

    try {
      const { data } = await api.post('/auth/register', { name, email, password, role })
      const nextUser = persistSession(data)
      toast.success('Account created')
      return nextUser
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed')
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearSession()
    toast.success('Signed out')
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      register,
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
