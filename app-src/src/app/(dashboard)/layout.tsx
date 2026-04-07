import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OfficeLayout } from '@/components/layout/office-layout'
import { FieldLayout } from '@/components/layout/field-layout'

const FIELD_PROFILES = ['funcionario', 'checkin'] as const
type FieldProfile = typeof FIELD_PROFILES[number]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-center text-sm text-muted-foreground">
          Conta não configurada — contate o administrador.
        </p>
      </div>
    )
  }

  if (FIELD_PROFILES.includes(profile.perfil as FieldProfile)) {
    return <FieldLayout profile={profile}>{children}</FieldLayout>
  }

  return <OfficeLayout profile={profile}>{children}</OfficeLayout>
}
