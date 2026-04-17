import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDadosMapa } from '@/app/actions/mapa'
import { gerarColunasMeses, corCelulaLed } from '@/lib/calendario/colunas'
import { MapaOcupacao } from '@/components/calendario/mapa-ocupacao'
import { CelulaReserva } from '@/components/calendario/celula-reserva'
import { FiltrosMapa } from '@/components/calendario/filtros-mapa'
import type { ReservaComJoins, PontoMidia } from '@/types'

interface SearchParams {
  mesInicio?: string; anoInicio?: string
  mesFim?: string;    anoFim?: string
  q?: string
}

export default async function CalendarioLedPage({
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
  const hojeStr    = hoje.toISOString().slice(0, 10)

  const { pontos, reservas } = await getDadosMapa('led', dataInicio, dataFim, params.q)
  const colunasMes = gerarColunasMeses(anoInicio, mesInicio, anoFim, mesFim)

  // Montar linhas: um ponto pode ter N slots
  const linhas = pontos.flatMap((ponto: PontoMidia) => {
    const slots = ponto.slots_totais ?? 1
    return Array.from({ length: slots }, (_, i) => {
      const slotNum = i + 1
      const cells = colunasMes.map(col => {
        const reserva = reservas.find((r: ReservaComJoins) =>
          r.ponto_id === ponto.id &&
          r.slot_numero === slotNum &&
          r.data_inicio.slice(0, 7) <= `${col.ano}-${String(col.mes).padStart(2, '0')}` &&
          r.data_fim.slice(0, 7) >= `${col.ano}-${String(col.mes).padStart(2, '0')}`
        )
        const cor = corCelulaLed(
          reserva?.status ?? null,
          reserva?.data_inicio ?? '',
          reserva?.data_fim ?? '',
          hojeStr
        )
        const vendedorNome = reserva?.vendedor?.nome?.split(' ')[0] ?? ''
        const linhasTexto = reserva ? [
          `${reserva.campanha?.cliente?.nome ?? '—'}`,
          reserva.campanha?.nome ?? '',
          `${reserva.data_inicio.slice(8)}/${reserva.data_inicio.slice(5, 7)} – ${reserva.data_fim.slice(8)}/${reserva.data_fim.slice(5, 7)}`,
          vendedorNome,
        ].filter(Boolean) : []
        return <CelulaReserva key={`${col.ano}-${col.mes}`} cor={cor} linhas={linhasTexto} />
      })
      return {
        key: `${ponto.id}-slot${slotNum}`,
        label: `${ponto.codigo} — Slot ${slotNum}`,
        sublabel: ponto.endereco ?? ponto.nome,
        cells,
      }
    })
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mapa LED</h1>
      <FiltrosMapa
        mesInicio={mesInicio} anoInicio={anoInicio}
        mesFim={mesFim} anoFim={anoFim}
      />
      <MapaOcupacao
        titulo="Ponto / Slot"
        colunas={colunasMes.map(c => ({ key: `${c.ano}-${c.mes}`, label: c.label }))}
        linhas={linhas}
      />
    </div>
  )
}
