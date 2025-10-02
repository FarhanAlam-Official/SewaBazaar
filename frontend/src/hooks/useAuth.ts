import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  role: string
  first_name: string
  last_name: string
}

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated (this would typically check localStorage/cookies)
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (token && userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    // This would typically make an API call
    setLoading(true)
    try {
      // Mock login logic - replace with actual API call
      const mockUser: User = {
        id: '1',
        email,
        role: 'provider',
        first_name: 'John',
        last_name: 'Doe'
      }
      
      localStorage.setItem('token', 'mock-token')
      localStorage.setItem('user', JSON.stringify(mockUser))
      setUser(mockUser)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout
  }
}