import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getReservasComJoins } from '@/app/actions/reservas'
import { ReservaTable } from '@/components/reservas/reserva-table'
import { Button } from '@/components/ui/button'
import type { PerfilUsuario, ReservaComJoins } from '@/types'

export default async function MinhasReservasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  const reservas = await getReservasComJoins({ vendedorId: user.id })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Minhas Reservas</h1>
        <Button size="sm" render={<Link href="/reservas/nova" />}>
          Nova Reserva
        </Button>
      </div>
      <ReservaTable
        reservas={reservas as ReservaComJoins[]}
        perfilUsuario={perfil.perfil as PerfilUsuario}
        mostrarVendedor={false}
      />
    </div>
  )
}
