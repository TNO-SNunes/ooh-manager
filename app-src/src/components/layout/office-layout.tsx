import { OfficeSidebar } from '@/components/layout/office-sidebar'
import { OfficeHeader } from '@/components/layout/office-header'
import type { Usuario } from '@/types'

export function OfficeLayout({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Usuario
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex md:shrink-0">
        <OfficeSidebar perfil={profile.perfil} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <OfficeHeader profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
