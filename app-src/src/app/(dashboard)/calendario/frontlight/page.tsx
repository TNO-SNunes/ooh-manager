import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDadosMapa } from '@/app/actions/mapa'
import { gerarColunasMeses, corCelulaFrontlight } from '@/lib/calendario/colunas'
import { MapaOcupacao } from '@/components/calendario/mapa-ocupacao'
import { CelulaReserva } from '@/components/calendario/celula-reserva'
import { FiltrosMapa } from '@/components/calendario/filtros-mapa'
import type { ReservaComJoins, PontoMidia } from '@/types'

interface SearchParams {
  mesInicio?: string; anoInicio?: string
  mesFim?: string;    anoFim?: string
  q?: string
}

export default async function CalendarioFrontlightPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const hoje = new Date()
  const mesInicio = parseInt(params.mesInicio ?? String(hoje.getMonth() + 1))
  const anoInicio = parseInt(params.anoInicio ?? String(hoje.getFullYear()))

  // Calcular mesFim/anoFim padrão = 3 meses à frente
  const dataFimDefault = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 1)
  const mesFim = parseInt(params.mesFim ?? String(dataFimDefault.getMonth() + 1))
  const anoFim = parseInt(params.anoFim ?? String(dataFimDefault.getFullYear()))

  const dataInicio = `${anoInicio}-${String(mesInicio).padStart(2, '0')}-01`
  const dataFim    = `${anoFim}-${String(mesFim).padStart(2, '0')}-31`

  const { pontos, reservas } = await getDadosMapa(['frontlight', 'empena'], dataInicio, dataFim, params.q)
  const colunasMes = gerarColunasMeses(anoInicio, mesInicio, anoFim, mesFim)

  const linhas = pontos.map((ponto: PontoMidia) => {
    const cells = colunasMes.map(col => {
      const colInicio = `${col.ano}-${String(col.mes).padStart(2, '0')}-01`
      const colFim    = `${col.ano}-${String(col.mes).padStart(2, '0')}-31`

      // Pode haver múltiplas reservas sobrepostas ao mês
      const reservasMes = reservas.filter((r: ReservaComJoins) =>
        r.ponto_id === ponto.id &&
        r.data_inicio <= colFim &&
        r.data_fim >= colInicio
      )

      if (reservasMes.length === 0) {
        return <CelulaReserva key={`${col.ano}-${col.mes}`} cor="livre" />
      }

      // Mostrar a de maior prioridade como cor da célula (solicitada > ativa)
      const cor = reservasMes.some(r => r.status === 'solicitada')
        ? corCelulaFrontlight('solicitada')
        : corCelulaFrontlight('ativa')

      const linhasTexto = reservasMes.flatMap(r => [
        `${r.data_inicio.slice(5).replace('-', '/')}–${r.data_fim.slice(5).replace('-', '/')}`,
        `${r.campanha?.cliente?.nome ?? '—'}`,
        r.vendedor?.nome?.split(' ')[0] ?? '',
      ])

      return <CelulaReserva key={`${col.ano}-${col.mes}`} cor={cor} linhas={linhasTexto} />
    })

    return {
      key: ponto.id,
      label: `${ponto.codigo} (${ponto.tipo})`,
      sublabel: ponto.endereco ?? ponto.nome,
      cells,
    }
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mapa Frontlight & Empena</h1>
      <FiltrosMapa
        mesInicio={mesInicio} anoInicio={anoInicio}
        mesFim={mesFim} anoFim={anoFim}
      />
      <MapaOcupacao
        colunas={colunasMes.map(c => ({ key: `${c.ano}-${c.mes}`, label: c.label }))}
        linhas={linhas}
      />
    </div>
  )
}
