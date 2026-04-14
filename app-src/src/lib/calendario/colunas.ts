import { StatusReserva } from '@/types'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'] as const

export interface ColunaBissemana {
  ano: number
  mes: number      // 1-12
  quinzena: number // 1 ou 2
  inicio: string   // YYYY-MM-DD
  fim: string      // YYYY-MM-DD
}

export interface ColunaMes {
  ano: number
  mes: number // 1-12
  label: string
}

function ultimoDiaMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate() // mes já é 1-based, Date usa 0-based
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function gerarColunasBissemanas(
  anoInicio: number, mesInicio: number,
  anoFim: number, mesFim: number
): ColunaBissemana[] {
  const cols: ColunaBissemana[] = []
  let ano = anoInicio
  let mes = mesInicio
  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    const ultimo = ultimoDiaMes(ano, mes)
    cols.push({
      ano, mes, quinzena: 1,
      inicio: `${ano}-${pad(mes)}-01`,
      fim: `${ano}-${pad(mes)}-15`,
    })
    cols.push({
      ano, mes, quinzena: 2,
      inicio: `${ano}-${pad(mes)}-16`,
      fim: `${ano}-${pad(mes)}-${pad(ultimo)}`,
    })
    mes++
    if (mes > 12) { mes = 1; ano++ }
  }
  return cols
}

export function gerarColunasMeses(
  anoInicio: number, mesInicio: number,
  anoFim: number, mesFim: number
): ColunaMes[] {
  const cols: ColunaMes[] = []
  let ano = anoInicio
  let mes = mesInicio
  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    cols.push({ ano, mes, label: labelMes(ano, mes) })
    mes++
    if (mes > 12) { mes = 1; ano++ }
  }
  return cols
}

export function labelBissemana(ano: number, mes: number, quinzena: number): string {
  return `${quinzena}ª ${MESES[mes - 1]}/${String(ano).slice(2)}`
}

export function labelMes(ano: number, mes: number): string {
  return `${MESES[mes - 1]}/${String(ano).slice(2)}`
}

export type CorCelula = 'livre' | 'ativa' | 'solicitada' | 'veiculando' | 'vencida'

export function corCelulaOutdoor(status: StatusReserva | null): CorCelula {
  if (!status) return 'livre'
  if (status === 'solicitada') return 'solicitada'
  if (status === 'ativa') return 'ativa'
  return 'livre' // rejeitada, cancelada, finalizada
}

export function corCelulaFrontlight(status: StatusReserva | null): CorCelula {
  return corCelulaOutdoor(status)
}

export function corCelulaLed(
  status: StatusReserva | null,
  dataInicio: string,
  dataFim: string,
  hoje: string
): CorCelula {
  if (!status) return 'livre'
  if (status === 'solicitada') return 'solicitada'
  // ativa: veiculando se hoje está dentro do período, vencida se passou
  if (dataFim < hoje) return 'vencida'
  return 'veiculando'
}
