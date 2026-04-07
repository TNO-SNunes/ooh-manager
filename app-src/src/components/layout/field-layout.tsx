import { FieldHeader } from '@/components/layout/field-header'
import { FieldBottomTabs } from '@/components/layout/field-bottom-tabs'
import type { Usuario } from '@/types'

export function FieldLayout({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Usuario
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <FieldHeader perfil={profile.perfil} />
      <main className="flex-1 overflow-y-auto p-4 text-base">
        {children}
      </main>
      <FieldBottomTabs />
    </div>
  )
}
