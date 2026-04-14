'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TipoPonto, PontoMidia, ReservaComJoins } from '@/types'

export interface DadosMapa {
  pontos: PontoMidia[]
  reservas: ReservaComJoins[]
}

export async function getDadosMapa(
  tipo: TipoPonto | TipoPonto[],
  dataInicio: string,
  dataFim: string,
  busca?: string
): Promise<DadosMapa> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  const tipos = Array.isArray(tipo) ? tipo : [tipo]

  let pontosQuery = supabase
    .from('pontos_midia')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'ativo')
    .in('tipo', tipos)
    .order('codigo')

  if (busca) {
    pontosQuery = pontosQuery.or(`codigo.ilike.%${busca}%,nome.ilike.%${busca}%,endereco.ilike.%${busca}%`)
  }

  const { data: pontos } = await pontosQuery
  if (!pontos || pontos.length === 0) return { pontos: [], reservas: [] }

  const pontoIds = pontos.map(p => p.id)

  const { data: reservas } = await supabase
    .from('reservas')
    .select(`
      *,
      ponto:pontos_midia(*),
      campanha:campanhas(*, cliente:clientes(*)),
      vendedor:usuarios!reservas_vendedor_id_fkey(id, nome, perfil)
    `)
    .eq('empresa_id', perfil.empresa_id)
    .in('ponto_id', pontoIds)
    .in('status', ['solicitada', 'ativa', 'finalizada'])
    .lte('data_inicio', dataFim)
    .gte('data_fim', dataInicio)
    .order('data_inicio')

  return {
    pontos: pontos as PontoMidia[],
    reservas: (reservas ?? []) as unknown as ReservaComJoins[],
  }
}
