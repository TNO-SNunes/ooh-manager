import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CampanhaForm } from '@/components/campanhas/campanha-form'
import type { Campanha, Cliente } from '@/types'

export default async function EditarCampanhaPage({
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

  if (!perfil || !['admin', 'gerente', 'vendedor'].includes(perfil.perfil)) {
    redirect('/campanhas')
  }

  const [{ data: campanha }, { data: clientes }] = await Promise.all([
    supabase
      .from('campanhas')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', perfil.empresa_id)
      .single(),
    supabase
      .from('clientes')
      .select('id, nome')
      .eq('empresa_id', perfil.empresa_id)
      .eq('ativo', true)
      .order('nome'),
  ])

  if (!campanha) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Editar Campanha</h1>
        <p className="text-sm text-muted-foreground">{(campanha as Campanha).nome}</p>
      </div>
      <CampanhaForm
        campanha={campanha as Campanha}
        clientes={(clientes ?? []) as Cliente[]}
        voltarHref={`/campanhas/${id}`}
      />
    </div>
  )
}
