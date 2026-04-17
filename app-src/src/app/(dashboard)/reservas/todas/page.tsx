import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReservasComJoins } from '@/app/actions/reservas'
import { ReservaTable } from '@/components/reservas/reserva-table'
import type { PerfilUsuario, ReservaComJoins } from '@/types'

export default async function TodasReservasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  if (!['admin', 'gerente', 'midia'].includes(perfil.perfil)) {
    redirect('/reservas/minhas')
  }

  let reservas: ReservaComJoins[] = []
  try {
    reservas = await getReservasComJoins({}) as ReservaComJoins[]
  } catch (e) {
    console.error('Erro ao carregar reservas:', e)
    // reservas stays empty, the empty state will handle it gracefully
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Todas as Reservas</h1>
      <ReservaTable
        reservas={reservas}
        perfilUsuario={perfil.perfil as PerfilUsuario}
        mostrarVendedor={true}
      />
    </div>
  )
}
