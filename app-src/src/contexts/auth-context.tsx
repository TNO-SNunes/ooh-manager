'use client'

import { createContext, useContext } from 'react'
import type { Usuario } from '@/types'

type AuthContextValue = {
  profile: Usuario | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  loading: true,
})

export function AuthProvider({
  children,
  initialProfile,
  loading,
}: {
  children: React.ReactNode
  initialProfile: Usuario | null
  loading: boolean
}) {
  return (
    <AuthContext.Provider value={{ profile: initialProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext)
}
