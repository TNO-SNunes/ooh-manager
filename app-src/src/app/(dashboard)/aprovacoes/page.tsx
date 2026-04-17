import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReservasComJoins } from '@/app/actions/reservas'
import { ReservaTable } from '@/components/reservas/reserva-table'
import type { ReservaComJoins } from '@/types'

export default async function AprovacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente', 'midia'].includes(perfil.perfil)) {
    redirect('/')
  }

  let reservas: ReservaComJoins[] = []
  try {
    const data = await getReservasComJoins({ status: ['solicitada'] })
    reservas = data as ReservaComJoins[]
  } catch {
    reservas = []
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fila de Aprovação</h1>
        <span className="text-sm text-muted-foreground">
          {reservas.length} {reservas.length === 1 ? 'reserva aguardando' : 'reservas aguardando'}
        </span>
      </div>
      <ReservaTable
        reservas={reservas}
        perfilUsuario={perfil.perfil}
        mostrarVendedor={true}
      />
    </div>
  )
}
