import { describe, it, expect } from 'vitest'
import {
  normalizarMunicipio,
  gerarCodigo,
  nomeLegivel,
  validarPonto,
} from '@/lib/pontos/actions'

describe('normalizarMunicipio', () => {
  it('retorna 3 letras maiúsculas sem acentos', () => {
    expect(normalizarMunicipio('Rio de Janeiro')).toBe('RIO')
    expect(normalizarMunicipio('São Paulo')).toBe('SAO')
    expect(normalizarMunicipio('Niterói')).toBe('NIT')
    expect(normalizarMunicipio('Brasília')).toBe('BRA')
  })

  it('funciona com município de 2 letras preenchendo com X', () => {
    expect(normalizarMunicipio('Oi')).toBe('OIX')
  })

  it('funciona com município de exatamente 3 letras', () => {
    expect(normalizarMunicipio('Sul')).toBe('SUL')
  })
})

describe('gerarCodigo', () => {
  it('outdoor gera T-MUN-001 quando não há existentes', () => {
    expect(gerarCodigo('Rio de Janeiro', 'outdoor', [])).toBe('T-RIO-001')
  })

  it('frontlight gera F-MUN-001 quando não há existentes', () => {
    expect(gerarCodigo('Rio de Janeiro', 'frontlight', [])).toBe('F-RIO-001')
  })

  it('empena gera F-MUN-002 quando há F-RIO-001 existente (sequência compartilhada com frontlight)', () => {
    expect(gerarCodigo('Rio de Janeiro', 'empena', ['F-RIO-001'])).toBe('F-RIO-002')
  })

  it('led gera L-MUN-001 e não conflita com F-MUN-001', () => {
    expect(gerarCodigo('Rio de Janeiro', 'led', ['F-RIO-001'])).toBe('L-RIO-001')
  })

  it('outdoor gera T-MUN-001 e não conflita com F-MUN-001 ou L-MUN-001', () => {
    expect(gerarCodigo('Rio de Janeiro', 'outdoor', ['F-RIO-001', 'L-RIO-001'])).toBe('T-RIO-001')
  })

  it('incrementa a partir do maior existente do mesmo prefixo-município', () => {
    expect(gerarCodigo('Rio de Janeiro', 'outdoor', ['T-RIO-001', 'T-RIO-002'])).toBe('T-RIO-003')
    expect(gerarCodigo('São Paulo', 'led', ['L-SAO-001', 'L-SAO-003'])).toBe('L-SAO-004')
  })

  it('ignora códigos de outros municípios', () => {
    expect(gerarCodigo('Niterói', 'outdoor', ['T-RIO-001', 'T-SAO-002'])).toBe('T-NIT-001')
  })

  it('formata sequencial com 3 dígitos e zeros à esquerda', () => {
    const existentes = Array.from({ length: 9 }, (_, i) => `F-RIO-00${i + 1}`)
    expect(gerarCodigo('Rio de Janeiro', 'frontlight', existentes)).toBe('F-RIO-010')
  })
})

describe('nomeLegivel', () => {
  it('outdoor: adiciona "Tab. N"', () => {
    expect(nomeLegivel({ nome: 'Ponto X', tipo: 'outdoor', numero_painel: 2 }))
      .toBe('Ponto X - Tab. 2')
  })

  it('outdoor sem numero_painel usa 1', () => {
    expect(nomeLegivel({ nome: 'Ponto X', tipo: 'outdoor' }))
      .toBe('Ponto X - Tab. 1')
  })

  it('frontlight: adiciona "Painel N"', () => {
    expect(nomeLegivel({ nome: 'Ponto Y', tipo: 'frontlight', numero_painel: 1 }))
      .toBe('Ponto Y - Painel 1')
  })

  it('empena: adiciona "Painel N"', () => {
    expect(nomeLegivel({ nome: 'Ponto Z', tipo: 'empena', numero_painel: 3 }))
      .toBe('Ponto Z - Painel 3')
  })

  it('led: retorna só o nome', () => {
    expect(nomeLegivel({ nome: 'Painel LED Centro', tipo: 'led' }))
      .toBe('Painel LED Centro')
  })
})

describe('validarPonto', () => {
  const base = {
    tipo: 'outdoor' as const,
    nome: 'Ponto Teste',
    endereco: 'Rua X, 10',
    municipio: 'Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
  }

  it('retorna array vazio para dados válidos de outdoor', () => {
    expect(validarPonto({ ...base, numero_painel: 1 })).toHaveLength(0)
  })

  it('exige campos obrigatórios', () => {
    const erros = validarPonto({})
    const campos = erros.map(e => e.campo)
    expect(campos).toContain('tipo')
    expect(campos).toContain('nome')
    expect(campos).toContain('endereco')
    expect(campos).toContain('municipio')
    expect(campos).toContain('cidade')
    expect(campos).toContain('estado')
  })

  it('LED: exige slots_totais >= 1 e slot_duracao_s em [10, 15]', () => {
    const errosSlots = validarPonto({ ...base, tipo: 'led', slots_totais: 0 })
    expect(errosSlots.map(e => e.campo)).toContain('slots_totais')

    const errosDuracao = validarPonto({ ...base, tipo: 'led', slots_totais: 4, slot_duracao_s: 7 })
    expect(errosDuracao.map(e => e.campo)).toContain('slot_duracao_s')

    expect(validarPonto({ ...base, tipo: 'led', slots_totais: 4, slot_duracao_s: 10 })).toHaveLength(0)
  })

  it('LED: exige slot_duracao_s quando tipo é led', () => {
    const errosSemDuracao = validarPonto({ ...base, tipo: 'led', slots_totais: 4 })
    expect(errosSemDuracao.map(e => e.campo)).toContain('slot_duracao_s')
  })

  it('se latitude preenchida, longitude também deve ser e vice-versa', () => {
    const erros = validarPonto({ ...base, latitude: -22.9 })
    expect(erros.map(e => e.campo)).toContain('longitude')

    const erros2 = validarPonto({ ...base, longitude: -43.1 })
    expect(erros2.map(e => e.campo)).toContain('latitude')

    expect(validarPonto({ ...base, latitude: -22.9, longitude: -43.1 })).toHaveLength(0)
  })

  it('estado deve ter exatamente 2 letras', () => {
    const erros = validarPonto({ ...base, estado: 'RJX' })
    expect(erros.map(e => e.campo)).toContain('estado')
  })
})
