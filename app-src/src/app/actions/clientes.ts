'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validarCliente } from '@/lib/clientes/validacoes'

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
    cnpj: get('cnpj') || null,
    contato: get('contato') || null,
    telefone: get('telefone') || null,
    email: get('email') || null,
  }
}

export async function criarCliente(
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
    return { error: 'Sem permissão para criar clientes.' }
  }

  const campos = parseCampos(formData)
  const fieldErrors = validarCliente(campos)
  if (fieldErrors) return { fieldErrors }

  const vendedorId =
    perfil.perfil === 'vendedor'
      ? user.id
      : (formData.get('vendedor_id') as string) || null

  const { error } = await supabase.from('clientes').insert({
    ...campos,
    empresa_id: perfil.empresa_id,
    vendedor_id: vendedorId,
  })

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  redirect('/clientes')
}

export async function editarCliente(
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
  const fieldErrors = validarCliente(campos)
  if (fieldErrors) return { fieldErrors }

  const { error } = await supabase
    .from('clientes')
    .update(campos)
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  redirect(`/clientes/${id}`)
}

export async function excluirCliente(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Apenas admin e gerente podem excluir clientes.' }
  }

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)

  if (error) {
    return { error: 'Não foi possível excluir. Verifique se há reservas vinculadas a campanhas deste cliente.' }
  }

  revalidatePath('/clientes')
  redirect('/clientes')
}
