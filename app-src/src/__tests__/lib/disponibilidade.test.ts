import { describe, it, expect } from 'vitest'
import { calcularDisponibilidade } from '@/lib/disponibilidade/calcular'
import type { PontoMidia } from '@/types'

const pontoOutdoor: PontoMidia = {
  id: 'p1', empresa_id: 'e1', codigo: 'OUT-001', nome: 'Ponto Outdoor',
  tipo: 'outdoor', status: 'ativo', cidade: 'Rio de Janeiro', estado: 'RJ',
  iluminacao: false, criado_em: '2024-01-01',
}

const pontoFrontlight: PontoMidia = {
  ...pontoOutdoor, id: 'p2', codigo: 'FL-001', nome: 'Ponto Frontlight', tipo: 'frontlight',
}

const pontoLed: PontoMidia = {
  ...pontoOutdoor, id: 'p3', codigo: 'LED-001', nome: 'Ponto LED', tipo: 'led',
  slots_totais: 4,
}

describe('calcularDisponibilidade — sem reservas', () => {
  it('outdoor sem reservas → livre', () => {
    const r = calcularDisponibilidade(pontoOutdoor, [], [], '2024-05-01', '2024-05-15')
    expect(r.status).toBe('livre')
  })

  it('frontlight sem reservas → livre', () => {
    const r = calcularDisponibilidade(pontoFrontlight, [], [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('livre')
  })

  it('led sem reservas → livre, slots_livres = slots_totais', () => {
    const r = calcularDisponibilidade(pontoLed, [], [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('livre')
    expect(r.slots_livres).toBe(4)
    expect(r.slots_totais).toBe(4)
  })
})

describe('calcularDisponibilidade — com reservas sobrepostas', () => {
  it('outdoor com reserva no mesmo período → ocupado', () => {
    const reservas = [{ data_inicio: '2024-05-01', data_fim: '2024-05-15', slot_numero: null }]
    const r = calcularDisponibilidade(pontoOutdoor, reservas, [], '2024-05-01', '2024-05-15')
    expect(r.status).toBe('ocupado')
  })

  it('frontlight com reserva sobreposta → ocupado', () => {
    const reservas = [{ data_inicio: '2024-04-15', data_fim: '2024-05-20', slot_numero: null }]
    const r = calcularDisponibilidade(pontoFrontlight, reservas, [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('ocupado')
  })

  it('frontlight com reserva adjacente (não sobreposta) → livre', () => {
    // Reserva termina no dia anterior ao início da consulta
    const reservas = [{ data_inicio: '2024-04-01', data_fim: '2024-04-30', slot_numero: null }]
    const r = calcularDisponibilidade(pontoFrontlight, reservas, [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('livre')
  })

  it('led com 2/4 slots ocupados → parcial', () => {
    const reservas = [
      { data_inicio: '2024-05-01', data_fim: '2024-05-31', slot_numero: 1 },
      { data_inicio: '2024-05-01', data_fim: '2024-05-31', slot_numero: 2 },
    ]
    const r = calcularDisponibilidade(pontoLed, reservas, [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('parcial')
    expect(r.slots_livres).toBe(2)
  })

  it('led com todos os slots ocupados → ocupado', () => {
    const reservas = [1, 2, 3, 4].map((slot_numero) => ({
      data_inicio: '2024-05-01', data_fim: '2024-05-31', slot_numero,
    }))
    const r = calcularDisponibilidade(pontoLed, reservas, [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('ocupado')
    expect(r.slots_livres).toBe(0)
  })

  it('led com reserva fora do período consultado → livre', () => {
    const reservas = [{ data_inicio: '2024-06-01', data_fim: '2024-06-30', slot_numero: 1 }]
    const r = calcularDisponibilidade(pontoLed, reservas, [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('livre')
    expect(r.slots_livres).toBe(4)
  })

  it('empena com reserva sobreposta → ocupado', () => {
    const pontoEmpena: PontoMidia = {
      ...pontoOutdoor, id: 'p4', codigo: 'EMP-001', nome: 'Ponto Empena', tipo: 'empena',
    }
    const reservas = [{ data_inicio: '2024-05-01', data_fim: '2024-05-31', slot_numero: null }]
    const r = calcularDisponibilidade(pontoEmpena, reservas, [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('ocupado')
  })

  it('led com mesmo slot em sub-períodos sobrepostos conta como 1 slot ocupado', () => {
    const reservas = [
      { data_inicio: '2024-05-01', data_fim: '2024-05-15', slot_numero: 1 },
      { data_inicio: '2024-05-10', data_fim: '2024-05-31', slot_numero: 1 },
    ]
    const r = calcularDisponibilidade(pontoLed, reservas, [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('parcial')
    expect(r.slots_livres).toBe(3)
  })

  it('led com slots_totais não configurado → ocupado (dados inválidos)', () => {
    const pontoLedSemSlots: PontoMidia = {
      ...pontoOutdoor, id: 'p5', codigo: 'LED-002', nome: 'LED sem slots', tipo: 'led',
      // slots_totais undefined
    }
    const r = calcularDisponibilidade(pontoLedSemSlots, [], [], '2024-05-01', '2024-05-31')
    expect(r.status).toBe('ocupado')
  })
})

describe('calcularDisponibilidade — bloqueios de manutenção', () => {
  it('bloqueio no período → ocupado independente do tipo', () => {
    const bloqueios = [{ data_inicio: '2024-05-10', data_fim: '2024-05-20' }]
    const rOut = calcularDisponibilidade(pontoOutdoor, [], bloqueios, '2024-05-01', '2024-05-15')
    const rFl = calcularDisponibilidade(pontoFrontlight, [], bloqueios, '2024-05-01', '2024-05-31')
    const rLed = calcularDisponibilidade(pontoLed, [], bloqueios, '2024-05-01', '2024-05-31')
    expect(rOut.status).toBe('ocupado')
    expect(rFl.status).toBe('ocupado')
    expect(rLed.status).toBe('ocupado')
  })

  it('bloqueio fora do período → não afeta resultado', () => {
    const bloqueios = [{ data_inicio: '2024-06-01', data_fim: '2024-06-30' }]
    const r = calcularDisponibilidade(pontoOutdoor, [], bloqueios, '2024-05-01', '2024-05-15')
    expect(r.status).toBe('livre')
  })
})
