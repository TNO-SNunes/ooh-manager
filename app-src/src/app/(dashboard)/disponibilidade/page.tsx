import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DisponibilidadeFiltros } from '@/components/disponibilidade/disponibilidade-filtros'
import { ResultadoCard } from '@/components/disponibilidade/resultado-card'
import { consultarDisponibilidade } from '@/app/actions/disponibilidade'
import type { DisponibilidadePonto } from '@/types'

export default async function DisponibilidadePage({
  searchParams,
}: {
  searchParams: Promise<{
    data_inicio?: string
    data_fim?: string
    tipo?: string
    cidade?: string
  }>
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

  // Buscar cidades para o select de filtro
  const { data: cidadesData } = await supabase
    .from('pontos_midia')
    .select('cidade')
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'ativo')

  const cidades = [...new Set((cidadesData ?? []).map((p) => p.cidade).filter(Boolean))] as string[]

  // Só consulta se as datas obrigatórias estiverem presentes
  let resultados: DisponibilidadePonto[] = []
  let erro: string | null = null

  if (params.data_inicio && params.data_fim) {
    if (params.data_fim < params.data_inicio) {
      erro = 'Data de fim deve ser posterior à data de início.'
    } else {
      resultados = await consultarDisponibilidade({
        data_inicio: params.data_inicio,
        data_fim: params.data_fim,
        tipo: params.tipo,
        cidade: params.cidade,
      })
    }
  }

  const temFiltro = Boolean(params.data_inicio && params.data_fim)
  const livres = resultados.filter((r) => r.status === 'livre').length
  const parciais = resultados.filter((r) => r.status === 'parcial').length
  const ocupados = resultados.filter((r) => r.status === 'ocupado').length

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Consulta de Disponibilidade</h1>

      <DisponibilidadeFiltros
        cidades={cidades}
        dataInicio={params.data_inicio}
        dataFim={params.data_fim}
        tipo={params.tipo}
        cidade={params.cidade}
      />

      {erro && (
        <p className="text-sm text-destructive">{erro}</p>
      )}

      {temFiltro && !erro && (
        <>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="text-green-600 dark:text-green-400 font-medium">{livres} livres</span>
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">{parciais} parciais</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{ocupados} ocupados</span>
            <span>· {resultados.length} pontos no total</span>
          </div>

          {resultados.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum ponto encontrado com os filtros selecionados.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((item) => (
                <ResultadoCard key={item.ponto.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {!temFiltro && (
        <p className="text-sm text-muted-foreground">
          Selecione um período para consultar a disponibilidade dos pontos.
        </p>
      )}
    </div>
  )
}
