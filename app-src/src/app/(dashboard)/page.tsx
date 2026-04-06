import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Olá{profile?.nome ? `, ${profile.nome}` : ''}!
      </h1>
      <p className="text-muted-foreground">
        Perfil: <span className="font-medium capitalize">{profile?.perfil ?? '—'}</span>
      </p>
      {/* TODO Sprint 1: dashboard por perfil */}
    </div>
  )
}
