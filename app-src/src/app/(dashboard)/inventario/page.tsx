import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InventarioClient } from '@/components/inventario/inventario-client'
import type { PontoMidia, PerfilUsuario } from '@/types'

const POR_PAGINA = 20

interface SearchParams {
  tipo?: string
  municipio?: string
  status?: string
  q?: string
  page?: string
}

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
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

  if (['vendedor', 'funcionario', 'checkin'].includes(perfil.perfil)) {
    redirect('/')
  }

  const pagina = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (pagina - 1) * POR_PAGINA
  const to = from + POR_PAGINA - 1

  let query = supabase
    .from('pontos_midia')
    .select('*', { count: 'exact' })
    .eq('empresa_id', perfil.empresa_id)
    .order('codigo')
    .range(from, to)

  if (params.tipo) query = query.eq('tipo', params.tipo)
  if (params.municipio) query = query.eq('municipio', params.municipio)
  if (params.status) query = query.eq('status', params.status)
  if (params.q) query = query.or(`codigo.ilike.%${params.q}%,nome.ilike.%${params.q}%`)

  const { data: pontos, count } = await query

  const { data: municipiosData } = await supabase
    .from('pontos_midia')
    .select('municipio')
    .eq('empresa_id', perfil.empresa_id)
    .not('municipio', 'is', null)

  const municipios = [
    ...new Set((municipiosData ?? []).map(p => p.municipio).filter(Boolean)),
  ] as string[]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Inventário de Pontos</h1>
      <InventarioClient
        pontos={(pontos ?? []) as PontoMidia[]}
        total={count ?? 0}
        pagina={pagina}
        municipios={municipios}
        perfil={perfil.perfil as PerfilUsuario}
      />
    </div>
  )
}
