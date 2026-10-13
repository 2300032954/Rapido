import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('rapido_user') || 'null')
  )

  const login = (u) => {
    setUser(u)
    localStorage.setItem('rapido_user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('rapido_user')
  }

  const updateUser = (patch) => {
    const updated = { ...user, ...patch }
    setUser(updated)
    localStorage.setItem('rapido_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)