'use client'

import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/auth-context'
import type { Usuario } from '@/types'

export function Providers({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode
  initialProfile?: Usuario | null
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider initialProfile={initialProfile} loading={false}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
