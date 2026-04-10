import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios').select('perfil, nome').eq('id', user.id).single()

  // Campo vai direto para OS
  if (profile?.perfil === 'funcionario' || profile?.perfil === 'checkin') {
    redirect('/os')
  }

  const DASH_LABELS: Record<string, string> = {
    admin: 'Visão geral da empresa',
    gerente: 'Painel operacional',
    vendedor: 'Minhas reservas e clientes',
    midia: 'Fila de auditoria',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Olá, {profile?.nome?.split(' ')[0]}
      </h1>
      <p className="text-sm text-muted-foreground">
        {DASH_LABELS[profile?.perfil ?? ''] ?? 'Dashboard'}
      </p>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Métricas e resumos em breve.
      </div>
    </div>
  )
}
