import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClienteForm } from '@/components/clientes/cliente-form'
import type { Cliente } from '@/types'

export default async function EditarClientePage({
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
    redirect('/clientes')
  }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!cliente) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Editar Cliente</h1>
        <p className="text-sm text-muted-foreground">{(cliente as Cliente).nome}</p>
      </div>
      <ClienteForm cliente={cliente as Cliente} voltarHref={`/clientes/${id}`} />
    </div>
  )
}
