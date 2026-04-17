import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDadosMapa } from '@/app/actions/mapa'
import { gerarColunasBissemanas, labelBissemana, corCelulaOutdoor } from '@/lib/calendario/colunas'
import { MapaOcupacao } from '@/components/calendario/mapa-ocupacao'
import { CelulaReserva } from '@/components/calendario/celula-reserva'
import { FiltrosMapa } from '@/components/calendario/filtros-mapa'
import type { ReservaComJoins, PontoMidia } from '@/types'

interface SearchParams {
  mesInicio?: string; anoInicio?: string
  mesFim?: string;    anoFim?: string
  q?: string
}

export default async function CalendarioOutdoorPage({
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

  const { pontos, reservas } = await getDadosMapa('outdoor', dataInicio, dataFim, params.q)
  const colunasBissemanas = gerarColunasBissemanas(anoInicio, mesInicio, anoFim, mesFim)

  const linhas = pontos.map((ponto: PontoMidia) => {
    const cells = colunasBissemanas.map(col => {
      const reserva = reservas.find((r: ReservaComJoins) =>
        r.ponto_id === ponto.id &&
        r.data_inicio === col.inicio &&
        r.data_fim === col.fim
      )
      const cor = corCelulaOutdoor(reserva?.status ?? null)
      const vendedorNome = reserva?.vendedor?.nome?.split(' ')[0] ?? ''
      const linhasTexto = reserva ? [
        reserva.campanha?.cliente?.nome ?? '—',
        vendedorNome,
      ].filter(Boolean) : []
      return <CelulaReserva key={col.inicio} cor={cor} linhas={linhasTexto} />
    })

    return {
      key: ponto.id,
      label: ponto.codigo,
      sublabel: ponto.endereco ?? ponto.nome,
      cells,
    }
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mapa Outdoor</h1>
      <FiltrosMapa
        mesInicio={mesInicio} anoInicio={anoInicio}
        mesFim={mesFim} anoFim={anoFim}
      />
      <MapaOcupacao
        colunas={colunasBissemanas.map(c => ({
          key: c.inicio,
          label: labelBissemana(c.ano, c.mes, c.quinzena),
        }))}
        linhas={linhas}
      />
    </div>
  )
}
