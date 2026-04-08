'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calcularDisponibilidade } from '@/lib/disponibilidade/calcular'
import type { PontoMidia, DisponibilidadePonto } from '@/types'

export interface FiltrosDisponibilidade {
  data_inicio: string
  data_fim: string
  tipo?: string
  cidade?: string
}

export async function consultarDisponibilidade(
  filtros: FiltrosDisponibilidade
): Promise<DisponibilidadePonto[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  // Buscar pontos com filtros
  let pontosQuery = supabase
    .from('pontos_midia')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'ativo')
    .order('codigo')

  if (filtros.tipo) pontosQuery = pontosQuery.eq('tipo', filtros.tipo)
  if (filtros.cidade) pontosQuery = pontosQuery.eq('cidade', filtros.cidade)

  const { data: pontos } = await pontosQuery
  if (!pontos || pontos.length === 0) return []

  const pontoIds = pontos.map((p) => p.id)

  // Buscar bloqueios via RPC (SECURITY DEFINER — bypassa RLS de bloqueios_manutencao)
  const { data: bloqueadosPontos } = await supabase.rpc('bloqueios_no_periodo', {
    p_empresa_id: perfil.empresa_id,
    p_data_inicio: filtros.data_inicio,
    p_data_fim: filtros.data_fim,
  })

  const bloqueadosSet = new Set(
    (bloqueadosPontos ?? []).map((b: { ponto_id: string }) => b.ponto_id)
  )

  // Buscar reservas ativas para os pontos no período
  // Nota: vendedores verão apenas suas próprias reservas via RLS, o que pode subestimar
  // a ocupação real. Para MVP, isso é aceitável — admin/gerente/midia veem tudo.
  const { data: reservas } = await supabase
    .from('reservas')
    .select('ponto_id, data_inicio, data_fim, slot_numero')
    .eq('empresa_id', perfil.empresa_id)
    .in('status', ['solicitada', 'ativa'])
    .lte('data_inicio', filtros.data_fim)
    .gte('data_fim', filtros.data_inicio)
    .in('ponto_id', pontoIds)

  // Montar mapa ponto_id → lista de reservas
  const ocupacoesMap = new Map<
    string,
    Array<{ data_inicio: string; data_fim: string; slot_numero: number | null }>
  >()

  for (const r of reservas ?? []) {
    if (!ocupacoesMap.has(r.ponto_id)) ocupacoesMap.set(r.ponto_id, [])
    ocupacoesMap.get(r.ponto_id)!.push({
      data_inicio: r.data_inicio,
      data_fim: r.data_fim,
      slot_numero: r.slot_numero ?? null,
    })
  }

  return pontos.map((ponto) => {
    const reservasDoPonto = ocupacoesMap.get(ponto.id) ?? []
    const bloqueios = bloqueadosSet.has(ponto.id)
      ? [{ data_inicio: filtros.data_inicio, data_fim: filtros.data_fim }]
      : []

    const resultado = calcularDisponibilidade(
      ponto as PontoMidia,
      reservasDoPonto,
      bloqueios,
      filtros.data_inicio,
      filtros.data_fim
    )

    return {
      ponto: ponto as PontoMidia,
      status: resultado.status,
      slots_livres: resultado.slots_livres,
      slots_totais: resultado.slots_totais,
    }
  })
}
