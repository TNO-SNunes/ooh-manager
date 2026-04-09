import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CampanhaForm } from '@/components/campanhas/campanha-form'
import type { Cliente } from '@/types'

export default async function NovaCampanhaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente_id?: string }>
}) {
  const params = await searchParams
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

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('empresa_id', perfil.empresa_id)
    .eq('ativo', true)
    .order('nome')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Nova Campanha</h1>
        <p className="text-sm text-muted-foreground">Crie uma nova campanha para um cliente.</p>
      </div>
      <CampanhaForm
        clientes={(clientes ?? []) as Cliente[]}
        clientePreSelecionado={params.cliente_id}
        voltarHref="/campanhas"
      />
    </div>
  )
}
