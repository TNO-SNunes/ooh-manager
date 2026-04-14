'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validarPeriodoPorTipo } from '@/lib/reservas/validacoes'
import { validarCamposReserva } from '@/lib/reservas/validacoes-action'
import type { TipoPonto } from '@/types'

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string>
  ok?: boolean
}

export async function criarReservaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente', 'vendedor'].includes(perfil.perfil)) {
    return { error: 'Sem permissão para criar reservas.' }
  }

  const campos = {
    ponto_id: formData.get('ponto_id') as string || undefined,
    campanha_id: formData.get('campanha_id') as string || undefined,
    data_inicio: formData.get('data_inicio') as string || undefined,
    data_fim: formData.get('data_fim') as string || undefined,
    slot_numero: formData.get('slot_numero') ? Number(formData.get('slot_numero')) : null,
    observacoes: formData.get('observacoes') as string || null,
  }

  const fieldErrors = validarCamposReserva(campos)
  if (fieldErrors) return { fieldErrors }

  // Buscar tipo do ponto para validar período
  const { data: ponto } = await supabase
    .from('pontos_midia')
    .select('tipo')
    .eq('id', campos.ponto_id!)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!ponto) return { error: 'Ponto não encontrado.' }

  const validacao = validarPeriodoPorTipo(ponto.tipo as TipoPonto, {
    data_inicio: new Date(campos.data_inicio!),
    data_fim: new Date(campos.data_fim!),
  })
  if (!validacao.valido) return { error: validacao.erro }

  const { error } = await supabase.from('reservas').insert({
    empresa_id: perfil.empresa_id,
    ponto_id: campos.ponto_id,
    campanha_id: campos.campanha_id,
    vendedor_id: user.id,
    data_inicio: campos.data_inicio,
    data_fim: campos.data_fim,
    slot_numero: campos.slot_numero,
    observacoes: campos.observacoes,
    status: 'solicitada',
  })

  if (error) return { error: error.message }

  revalidatePath('/reservas')
  revalidatePath('/aprovacoes')
  return { ok: true }
}

export async function aprovarReservaAction(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Sem permissão para aprovar reservas.' }
  }

  const { error } = await supabase
    .from('reservas')
    .update({ status: 'ativa', aprovador_id: user.id, aprovado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'solicitada')

  if (error) return { error: error.message }

  revalidatePath('/aprovacoes')
  revalidatePath('/reservas')
  return { ok: true }
}

export async function rejeitarReservaAction(
  id: string,
  motivo: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!motivo.trim()) return { error: 'Motivo de rejeição é obrigatório.' }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Sem permissão para rejeitar reservas.' }
  }

  const { error } = await supabase
    .from('reservas')
    .update({
      status: 'rejeitada',
      aprovador_id: user.id,
      aprovado_em: new Date().toISOString(),
      motivo_rejeicao: motivo.trim(),
    })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'solicitada')

  if (error) return { error: error.message }

  revalidatePath('/aprovacoes')
  revalidatePath('/reservas')
  return { ok: true }
}

export async function cancelarReservaAction(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  // vendedor só cancela as próprias; gerente/admin cancela qualquer uma
  let query = supabase
    .from('reservas')
    .update({ status: 'cancelada' })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'solicitada')

  if (perfil.perfil === 'vendedor') {
    query = query.eq('vendedor_id', user.id)
  }

  const { error } = await query
  if (error) return { error: error.message }

  revalidatePath('/reservas')
  revalidatePath('/aprovacoes')
  return { ok: true }
}

export async function getReservasComJoins(
  empresaId: string,
  filtros: { vendedorId?: string; status?: string[] } = {}
) {
  const supabase = await createClient()

  let query = supabase
    .from('reservas')
    .select(`
      *,
      ponto:pontos_midia(*),
      campanha:campanhas(*, cliente:clientes(*)),
      vendedor:usuarios!reservas_vendedor_id_fkey(id, nome, perfil)
    `)
    .eq('empresa_id', empresaId)
    .order('solicitado_em', { ascending: false })

  if (filtros.vendedorId) query = query.eq('vendedor_id', filtros.vendedorId)
  if (filtros.status?.length) query = query.in('status', filtros.status)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
