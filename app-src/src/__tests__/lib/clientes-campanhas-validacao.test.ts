import { describe, it, expect } from 'vitest'

// Funções puras de validação — copiadas de actions/clientes.ts e actions/campanhas.ts
// para testar sem mock de servidor

function validarCliente(data: { nome?: string }): Record<string, string> | null {
  const errors: Record<string, string> = {}
  if (!data.nome?.trim()) errors.nome = 'Nome é obrigatório.'
  return Object.keys(errors).length ? errors : null
}

function validarCampanha(data: {
  nome?: string
  cliente_id?: string
  data_inicio?: string
  data_fim?: string
}): Record<string, string> | null {
  const errors: Record<string, string> = {}
  if (!data.nome?.trim()) errors.nome = 'Nome é obrigatório.'
  if (!data.cliente_id) errors.cliente_id = 'Cliente é obrigatório.'
  if (data.data_inicio && data.data_fim && data.data_fim < data.data_inicio) {
    errors.data_fim = 'Data de fim deve ser posterior à data de início.'
  }
  return Object.keys(errors).length ? errors : null
}

describe('validarCliente', () => {
  it('retorna null se nome preenchido', () => {
    expect(validarCliente({ nome: 'Acme Corp' })).toBeNull()
  })

  it('retorna erro se nome ausente', () => {
    expect(validarCliente({})).toEqual({ nome: 'Nome é obrigatório.' })
  })

  it('retorna erro se nome só tem espaços', () => {
    expect(validarCliente({ nome: '   ' })).toEqual({ nome: 'Nome é obrigatório.' })
  })
})

describe('validarCampanha', () => {
  it('retorna null se campos obrigatórios preenchidos', () => {
    expect(validarCampanha({ nome: 'Campanha Verão', cliente_id: 'uuid-123' })).toBeNull()
  })

  it('retorna erro se nome ausente', () => {
    const r = validarCampanha({ cliente_id: 'uuid-123' })
    expect(r?.nome).toBe('Nome é obrigatório.')
  })

  it('retorna erro se cliente_id ausente', () => {
    const r = validarCampanha({ nome: 'Campanha' })
    expect(r?.cliente_id).toBe('Cliente é obrigatório.')
  })

  it('retorna erro se data_fim anterior a data_inicio', () => {
    const r = validarCampanha({
      nome: 'Campanha',
      cliente_id: 'uuid-123',
      data_inicio: '2024-06-01',
      data_fim: '2024-05-01',
    })
    expect(r?.data_fim).toBe('Data de fim deve ser posterior à data de início.')
  })

  it('aceita campanha sem datas (datas são opcionais)', () => {
    expect(validarCampanha({ nome: 'Campanha', cliente_id: 'uuid-123' })).toBeNull()
  })
})
