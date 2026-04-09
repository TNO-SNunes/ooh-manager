'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validarCampanha } from '@/lib/campanhas/validacoes'

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string>
}

function parseCampos(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k)
    return v ? String(v).trim() : undefined
  }
  return {
    nome: get('nome'),
    cliente_id: get('cliente_id'),
    descricao: get('descricao') || null,
    data_inicio: get('data_inicio') || null,
    data_fim: get('data_fim') || null,
  }
}

export async function criarCampanha(
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
    return { error: 'Sem permissão para criar campanhas.' }
  }

  const campos = parseCampos(formData)
  const fieldErrors = validarCampanha(campos)
  if (fieldErrors) return { fieldErrors }

  const { error } = await supabase.from('campanhas').insert({
    ...campos,
    empresa_id: perfil.empresa_id,
  })

  if (error) return { error: error.message }

  revalidatePath('/campanhas')
  redirect('/campanhas')
}

export async function editarCampanha(
  id: string,
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
    return { error: 'Sem permissão.' }
  }

  const campos = parseCampos(formData)
  const fieldErrors = validarCampanha(campos)
  if (fieldErrors) return { fieldErrors }

  const { error } = await supabase
    .from('campanhas')
    .update(campos)
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)

  if (error) return { error: error.message }

  revalidatePath('/campanhas')
  revalidatePath(`/campanhas/${id}`)
  redirect(`/campanhas/${id}`)
}

export async function excluirCampanha(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Apenas admin e gerente podem excluir campanhas.' }
  }

  const { error } = await supabase
    .from('campanhas')
    .delete()
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)

  if (error) {
    return { error: 'Não foi possível excluir. Verifique se há reservas vinculadas.' }
  }

  revalidatePath('/campanhas')
  redirect('/campanhas')
}
