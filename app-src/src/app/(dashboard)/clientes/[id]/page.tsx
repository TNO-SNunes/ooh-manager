import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClienteDetail } from '@/components/clientes/cliente-detail'
import type { Cliente, Campanha, PerfilUsuario } from '@/types'

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (['funcionario', 'checkin'].includes(perfil.perfil)) redirect('/')

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!cliente) notFound()

  const { data: campanhas } = await supabase
    .from('campanhas')
    .select('*')
    .eq('cliente_id', id)
    .eq('empresa_id', perfil.empresa_id)
    .order('criado_em', { ascending: false })

  return (
    <ClienteDetail
      cliente={cliente as Cliente}
      campanhas={(campanhas ?? []) as Campanha[]}
      perfil={perfil.perfil as PerfilUsuario}
    />
  )
}
