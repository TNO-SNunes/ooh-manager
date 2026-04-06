/**
 * Validações de negócio para reservas por tipo de ponto.
 * Centralizadas aqui para uso tanto no client quanto nas API Routes.
 */
import type { TipoPonto } from '@/types'

export interface PeriodoReserva {
  data_inicio: Date
  data_fim: Date
}

export interface ResultadoValidacao {
  valido: boolean
  erro?: string
}

// ============================================================
// Outdoor — bissemanas obrigatórias
// ============================================================

export function normalizarBissemana(data: Date): PeriodoReserva {
  const dia = data.getDate()
  const ano = data.getFullYear()
  const mes = data.getMonth()

  if (dia <= 15) {
    return {
      data_inicio: new Date(ano, mes, 1),
      data_fim: new Date(ano, mes, 15),
    }
  } else {
    const ultimoDia = new Date(ano, mes + 1, 0).getDate()
    return {
      data_inicio: new Date(ano, mes, 16),
      data_fim: new Date(ano, mes, ultimoDia),
    }
  }
}

export function validarOutdoor(periodo: PeriodoReserva): ResultadoValidacao {
  const inicio = periodo.data_inicio
  const fim = periodo.data_fim
  const diaInicio = inicio.getDate()
  const diaFim = fim.getDate()
  const ultimoDia = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate()

  // Deve começar no dia 1 ou 16
  if (diaInicio !== 1 && diaInicio !== 16) {
    return {
      valido: false,
      erro: 'Outdoor: reservas devem começar no dia 1 ou 16 do mês.',
    }
  }

  // Deve terminar no dia 15 ou no último dia do mês
  if (diaFim !== 15 && diaFim !== ultimoDia) {
    return {
      valido: false,
      erro: `Outdoor: reservas devem terminar no dia 15 ou ${ultimoDia} do mês.`,
    }
  }

  // Não pode cruzar meses
  if (inicio.getMonth() !== fim.getMonth() || inicio.getFullYear() !== fim.getFullYear()) {
    return {
      valido: false,
      erro: 'Outdoor: reservas não podem cruzar meses.',
    }
  }

  // Bissemana 1: 1→15, Bissemana 2: 16→último
  const bissemanaValida =
    (diaInicio === 1 && diaFim === 15) ||
    (diaInicio === 16 && diaFim === ultimoDia)

  if (!bissemanaValida) {
    return {
      valido: false,
      erro: 'Outdoor: bissemana inválida. Use dias 1-15 ou 16-último do mês.',
    }
  }

  return { valido: true }
}

// ============================================================
// Frontlight / Empena — mínimo 30 dias
// ============================================================

export function validarMinimo30Dias(periodo: PeriodoReserva): ResultadoValidacao {
  const diffMs = periodo.data_fim.getTime() - periodo.data_inicio.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDias < 29) {
    return {
      valido: false,
      erro: `Período mínimo é de 30 dias. Período selecionado: ${diffDias + 1} dias.`,
    }
  }

  return { valido: true }
}

// ============================================================
// Dispatcher por tipo
// ============================================================

export function validarPeriodoPorTipo(
  tipo: TipoPonto,
  periodo: PeriodoReserva
): ResultadoValidacao {
  if (periodo.data_fim < periodo.data_inicio) {
    return { valido: false, erro: 'Data de fim deve ser posterior à data de início.' }
  }

  switch (tipo) {
    case 'outdoor':
      return validarOutdoor(periodo)
    case 'frontlight':
    case 'empena':
      return validarMinimo30Dias(periodo)
    case 'led':
      return { valido: true } // LED: qualquer período
    default:
      return { valido: false, erro: 'Tipo de ponto desconhecido.' }
  }
}

// ============================================================
// Geração de bissemanas de um mês (para o calendário)
// ============================================================

export function getBissemanasMes(ano: number, mes: number): PeriodoReserva[] {
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  return [
    {
      data_inicio: new Date(ano, mes, 1),
      data_fim: new Date(ano, mes, 15),
    },
    {
      data_inicio: new Date(ano, mes, 16),
      data_fim: new Date(ano, mes, ultimoDia),
    },
  ]
}
