import { describe, it, expect } from 'vitest'
import {
  gerarColunasBissemanas,
  gerarColunasMeses,
  labelBissemana,
  labelMes,
  corCelulaOutdoor,
  corCelulaFrontlight,
  corCelulaLed,
} from '@/lib/calendario/colunas'

describe('gerarColunasBissemanas', () => {
  it('gera 2 colunas para um único mês', () => {
    const cols = gerarColunasBissemanas(2026, 1, 2026, 1)
    expect(cols).toHaveLength(2)
    expect(cols[0]).toEqual({ ano: 2026, mes: 1, quinzena: 1, inicio: '2026-01-01', fim: '2026-01-15' })
    expect(cols[1]).toEqual({ ano: 2026, mes: 1, quinzena: 2, inicio: '2026-01-16', fim: '2026-01-31' })
  })

  it('gera 4 colunas para dois meses', () => {
    const cols = gerarColunasBissemanas(2026, 1, 2026, 2)
    expect(cols).toHaveLength(4)
    expect(cols[2].inicio).toBe('2026-02-01')
    expect(cols[3].fim).toBe('2026-02-28')
  })

  it('fim de fevereiro em ano não-bissexto = dia 28', () => {
    const cols = gerarColunasBissemanas(2026, 2, 2026, 2)
    expect(cols[1].fim).toBe('2026-02-28')
  })

  it('fim de fevereiro em ano bissexto = dia 29', () => {
    const cols = gerarColunasBissemanas(2024, 2, 2024, 2)
    expect(cols[1].fim).toBe('2024-02-29')
  })
})

describe('gerarColunasMeses', () => {
  it('gera 3 meses', () => {
    const cols = gerarColunasMeses(2026, 1, 2026, 3)
    expect(cols).toHaveLength(3)
    expect(cols[0]).toEqual({ ano: 2026, mes: 1, label: 'Jan/26' })
    expect(cols[2]).toEqual({ ano: 2026, mes: 3, label: 'Mar/26' })
  })

  it('atravessa ano corretamente', () => {
    const cols = gerarColunasMeses(2025, 11, 2026, 2)
    expect(cols).toHaveLength(4)
    expect(cols[2].ano).toBe(2026)
    expect(cols[2].mes).toBe(1)
  })
})

describe('labelBissemana', () => {
  it('retorna "1ª Jan/26" para quinzena 1 do mês 1', () => {
    expect(labelBissemana(2026, 1, 1)).toBe('1ª Jan/26')
  })
  it('retorna "2ª Dez/25" para quinzena 2 do mês 12', () => {
    expect(labelBissemana(2025, 12, 2)).toBe('2ª Dez/25')
  })
})

describe('labelMes', () => {
  it('retorna "Abr/26" para mês 4', () => {
    expect(labelMes(2026, 4)).toBe('Abr/26')
  })
})

describe('corCelulaOutdoor', () => {
  it('sem reserva → branco', () => {
    expect(corCelulaOutdoor(null)).toBe('livre')
  })
  it('status ativa → vermelho', () => {
    expect(corCelulaOutdoor('ativa')).toBe('ativa')
  })
  it('status solicitada → azul', () => {
    expect(corCelulaOutdoor('solicitada')).toBe('solicitada')
  })
})

describe('corCelulaLed', () => {
  it('sem reserva → livre', () => {
    expect(corCelulaLed(null, '2026-04-01', '2026-04-30', '2026-04-15')).toBe('livre')
  })
  it('ativa dentro do período → veiculando', () => {
    expect(corCelulaLed('ativa', '2026-04-01', '2026-04-30', '2026-04-15')).toBe('veiculando')
  })
  it('ativa fora do período (vencida) → vencida', () => {
    expect(corCelulaLed('ativa', '2026-01-01', '2026-02-28', '2026-04-15')).toBe('vencida')
  })
  it('solicitada → solicitada independente de data', () => {
    expect(corCelulaLed('solicitada', '2026-04-01', '2026-04-30', '2026-04-15')).toBe('solicitada')
  })
})
