import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CampanhaTable } from '@/components/campanhas/campanha-table'
import type { Campanha, Cliente, PerfilUsuario } from '@/types'

const POR_PAGINA = 20

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string; cliente?: string; status?: string }>
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

  const hoje = new Date().toISOString().slice(0, 10)

  let query = supabase
    .from('campanhas')
    .select('*, cliente:clientes(id, nome)', { count: 'exact' })
    .eq('empresa_id', perfil.empresa_id)
    .order('criado_em', { ascending: false })
    .range(from, from + POR_PAGINA - 1)

  if (params.q) query = query.ilike('nome', `%${params.q}%`)
  if (params.cliente) query = query.eq('cliente_id', params.cliente)
  if (params.status === 'vigente') query = query.or(`data_fim.is.null,data_fim.gte.${hoje}`)
  if (params.status === 'vencida') query = query.lt('data_fim', hoje)

  const [{ data: campanhas, count }, { data: clientes }] = await Promise.all([
    query,
    supabase
      .from('clientes')
      .select('id, nome')
      .eq('empresa_id', perfil.empresa_id)
      .order('nome'),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Campanhas</h1>
      <CampanhaTable
        campanhas={(campanhas ?? []) as Campanha[]}
        total={count ?? 0}
        pagina={pagina}
        perfil={perfil.perfil as PerfilUsuario}
        clientes={(clientes ?? []) as Cliente[]}
        porPagina={POR_PAGINA}
      />
    </div>
  )
}
