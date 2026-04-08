import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClienteTable } from '@/components/clientes/cliente-table'
import type { Cliente, PerfilUsuario } from '@/types'

const POR_PAGINA = 20

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>
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

  if (!perfil) redirect('/login')
  if (['funcionario', 'checkin'].includes(perfil.perfil)) redirect('/')

  const pagina = Math.max(1, parseInt(params.pagina ?? '1', 10))
  const from = (pagina - 1) * POR_PAGINA

  let query = supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .eq('empresa_id', perfil.empresa_id)
    .order('nome')
    .range(from, from + POR_PAGINA - 1)

  if (params.q) query = query.ilike('nome', `%${params.q}%`)

  const { data: clientes, count } = await query

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Clientes</h1>
      <ClienteTable
        clientes={(clientes ?? []) as Cliente[]}
        total={count ?? 0}
        pagina={pagina}
        perfil={perfil.perfil as PerfilUsuario}
      />
    </div>
  )
}
