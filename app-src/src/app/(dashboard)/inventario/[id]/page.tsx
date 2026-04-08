import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PontoDetail } from '@/components/inventario/ponto-detail'
import type { PontoMidia, PerfilUsuario } from '@/types'

export default async function DetalhePontoPage({
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

  if (['vendedor', 'funcionario', 'checkin'].includes(perfil.perfil)) {
    redirect('/inventario')
  }

  const { data: ponto } = await supabase
    .from('pontos_midia')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!ponto) notFound()

  return <PontoDetail ponto={ponto as PontoMidia} perfil={perfil.perfil as PerfilUsuario} />
}
