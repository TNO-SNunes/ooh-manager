// app-src/src/app/(dashboard)/reservas/nova/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StepperReserva } from '@/components/reservas/stepper-reserva'
import type { PontoMidia, Cliente, Campanha } from '@/types'

export default async function NovaReservaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (!['admin', 'gerente', 'vendedor'].includes(perfil.perfil)) redirect('/')

  // Pontos ativos
  const { data: pontos } = await supabase
    .from('pontos_midia')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'ativo')
    .order('codigo')

  // Clientes (vendedor só vê os seus)
  let clientesQuery = supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .eq('ativo', true)
    .order('nome')
  if (perfil.perfil === 'vendedor') {
    clientesQuery = clientesQuery.eq('vendedor_id', user.id)
  }
  const { data: clientes } = await clientesQuery

  // Campanhas de todos os clientes encontrados
  const clienteIds = (clientes ?? []).map((c: Cliente) => c.id)
  const { data: campanhas } = clienteIds.length > 0
    ? await supabase
        .from('campanhas')
        .select('*')
        .eq('empresa_id', perfil.empresa_id)
        .eq('ativo', true)
        .in('cliente_id', clienteIds)
        .order('nome')
    : { data: [] }

  // Agrupar campanhas por cliente
  const campanhasPorCliente: Record<string, Campanha[]> = {}
  for (const c of campanhas ?? []) {
    if (!campanhasPorCliente[c.cliente_id]) campanhasPorCliente[c.cliente_id] = []
    campanhasPorCliente[c.cliente_id].push(c as Campanha)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">Nova Reserva</h1>
      <StepperReserva
        pontos={(pontos ?? []) as PontoMidia[]}
        clientes={(clientes ?? []) as Cliente[]}
        campanhasPorCliente={campanhasPorCliente}
      />
    </div>
  )
}
