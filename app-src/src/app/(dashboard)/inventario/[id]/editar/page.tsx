import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PontoForm } from '@/components/inventario/ponto-form'
import type { PontoMidia } from '@/types'

export default async function EditarPontoPage({
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

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    redirect('/inventario')
  }

  const { data: ponto } = await supabase
    .from('pontos_midia')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!ponto) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Editar Ponto</h1>
        <p className="text-sm text-muted-foreground font-mono">{ponto.codigo}</p>
      </div>
      <PontoForm ponto={ponto as PontoMidia} />
    </div>
  )
}
