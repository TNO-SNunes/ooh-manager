import { describe, it, expect } from 'vitest'
import { validarCamposReserva } from '@/lib/reservas/validacoes-action'

describe('validarCamposReserva', () => {
  const base = {
    ponto_id: 'p1',
    campanha_id: 'c1',
    data_inicio: '2026-05-01',
    data_fim: '2026-05-15',
  }

  it('campos completos → null', () => {
    expect(validarCamposReserva(base)).toBeNull()
  })

  it('sem ponto_id → erro ponto_id', () => {
    const r = validarCamposReserva({ ...base, ponto_id: undefined })
    expect(r?.ponto_id).toBeDefined()
  })

  it('sem campanha_id → erro campanha_id', () => {
    const r = validarCamposReserva({ ...base, campanha_id: undefined })
    expect(r?.campanha_id).toBeDefined()
  })

  it('data_fim antes de data_inicio → erro data_fim', () => {
    const r = validarCamposReserva({ ...base, data_inicio: '2026-05-15', data_fim: '2026-05-01' })
    expect(r?.data_fim).toBeDefined()
  })
})
