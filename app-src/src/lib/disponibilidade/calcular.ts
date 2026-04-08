import type { PontoMidia, StatusDisponibilidade } from '@/types'

interface ReservaInfo {
  data_inicio: string
  data_fim: string
  slot_numero?: number | null
}

interface BloqueioInfo {
  data_inicio: string
  data_fim: string
}

export interface ResultadoDisponibilidade {
  status: StatusDisponibilidade
  slots_livres?: number
  slots_totais?: number
}

/**
 * Verifica se dois períodos de datas se sobrepõem (inclusive).
 * Datas em formato ISO 'YYYY-MM-DD'.
 */
function sobrepoe(
  inicioA: string,
  fimA: string,
  inicioB: string,
  fimB: string
): boolean {
  return inicioA <= fimB && fimA >= inicioB
}

/**
 * Calcula a disponibilidade de um ponto para um período de consulta,
 * dado o conjunto de reservas ativas e bloqueios de manutenção no período.
 */
export function calcularDisponibilidade(
  ponto: PontoMidia,
  reservas: ReservaInfo[],
  bloqueios: BloqueioInfo[],
  dataInicio: string,
  dataFim: string
): ResultadoDisponibilidade {
  // Bloqueio de manutenção tem prioridade máxima
  const temBloqueio = bloqueios.some((b) =>
    sobrepoe(b.data_inicio, b.data_fim, dataInicio, dataFim)
  )
  if (temBloqueio) return { status: 'ocupado' }

  // Filtra apenas reservas que se sobrepõem ao período consultado
  const reservasSobrepostas = reservas.filter((r) =>
    sobrepoe(r.data_inicio, r.data_fim, dataInicio, dataFim)
  )

  if (ponto.tipo === 'led') {
    const slotsTotais = ponto.slots_totais ?? 0
    if (slotsTotais <= 0) {
      return { status: 'ocupado', slots_livres: 0, slots_totais: 0 }
    }
    const slotsOcupados = new Set(
      reservasSobrepostas
        .map((r) => r.slot_numero)
        .filter((s): s is number => s != null)
    ).size

    const slotsLivres = Math.max(0, slotsTotais - slotsOcupados)

    if (slotsOcupados === 0) {
      return { status: 'livre', slots_livres: slotsTotais, slots_totais: slotsTotais }
    }
    if (slotsLivres === 0) {
      return { status: 'ocupado', slots_livres: 0, slots_totais: slotsTotais }
    }
    return { status: 'parcial', slots_livres: slotsLivres, slots_totais: slotsTotais }
  }

  // Outdoor, frontlight, empena: qualquer sobreposição = ocupado
  if (reservasSobrepostas.length > 0) return { status: 'ocupado' }
  return { status: 'livre' }
}
