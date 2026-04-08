import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import {
  gerarTemplateExcel,
  parsearImportacao,
  gerarExportacao,
  type LinhaImportacao,
} from '@/lib/pontos/excel'
import type { PontoMidia } from '@/types'

const COLUNAS_TEMPLATE = [
  'tipo', 'nome', 'codigo', 'status', 'endereco', 'sentido', 'bairro',
  'municipio', 'cidade', 'estado', 'latitude', 'longitude',
  'largura_m', 'altura_m', 'iluminacao', 'numero_painel',
  'slots_totais', 'slot_duracao_s', 'resolucao', 'observacoes',
]

describe('gerarTemplateExcel', () => {
  it('retorna string base64 não-vazia', () => {
    const base64 = gerarTemplateExcel()
    expect(typeof base64).toBe('string')
    expect(base64.length).toBeGreaterThan(100)
  })

  it('template contém todas as colunas esperadas na primeira linha', () => {
    const base64 = gerarTemplateExcel()
    const buffer = Buffer.from(base64, 'base64')
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
    expect(rows[0]).toEqual(COLUNAS_TEMPLATE)
  })
})

describe('parsearImportacao', () => {
  function criarBuffer(dados: unknown[][]): ArrayBuffer {
    const ws = XLSX.utils.aoa_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pontos')
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
    return Buffer.from(base64, 'base64') as any as ArrayBuffer
  }

  it('retorna linha válida para row completa de outdoor', () => {
    const header = COLUNAS_TEMPLATE
    const row = [
      'outdoor', 'Ponto Teste', 'RIO-001', 'ativo',
      'Rua X, 10', 'sentido RJ', 'Centro',
      'Rio de Janeiro', 'Rio de Janeiro', 'RJ',
      -22.9, -43.1, 3, 6, 'sim', 1, '', '', '', 'obs',
    ]
    const buffer = criarBuffer([header, row])
    const resultado = parsearImportacao(buffer)
    expect(resultado).toHaveLength(1)
    expect(resultado[0].erro).toBeUndefined()
    expect(resultado[0].dados?.tipo).toBe('outdoor')
    expect(resultado[0].dados?.nome).toBe('Ponto Teste')
    expect(resultado[0].dados?.iluminacao).toBe(true)
    expect(resultado[0].dados?.latitude).toBe(-22.9)
  })

  it('retorna erro para tipo inválido', () => {
    const buffer = criarBuffer([
      COLUNAS_TEMPLATE,
      ['banner', 'Ponto X', '', 'ativo', 'Rua X', '', '', 'RJ', 'RJ', 'RJ', '', '', '', '', '', '', '', '', '', ''],
    ])
    const resultado = parsearImportacao(buffer)
    expect(resultado[0].erro).toMatch(/tipo inválido/i)
  })

  it('retorna erro para campos obrigatórios ausentes', () => {
    const buffer = criarBuffer([
      COLUNAS_TEMPLATE,
      ['outdoor', '', '', 'ativo', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ])
    const resultado = parsearImportacao(buffer)
    expect(resultado[0].erro).toBeTruthy()
  })

  it('iluminacao aceita "sim", "não", "1", "0"', () => {
    const makeRow = (iluminacao: string | number) => [
      'outdoor', 'Ponto', '', 'ativo', 'Rua X', '', '',
      'Rio de Janeiro', 'Rio de Janeiro', 'RJ',
      '', '', 3, 6, iluminacao, 1, '', '', '', '',
    ]
    const buffer = criarBuffer([
      COLUNAS_TEMPLATE,
      makeRow('sim'),
      makeRow('não'),
      makeRow(1),
      makeRow(0),
    ])
    const resultado = parsearImportacao(buffer)
    expect(resultado[0].dados?.iluminacao).toBe(true)
    expect(resultado[1].dados?.iluminacao).toBe(false)
    expect(resultado[2].dados?.iluminacao).toBe(true)
    expect(resultado[3].dados?.iluminacao).toBe(false)
  })
})

describe('gerarExportacao', () => {
  const pontoMock: PontoMidia = {
    id: '1', empresa_id: 'e1', codigo: 'RIO-001', nome: 'Ponto A',
    tipo: 'outdoor', status: 'ativo', cidade: 'Rio de Janeiro', estado: 'RJ',
    endereco: 'Rua X', iluminacao: true, criado_em: '2026-01-01',
    municipio: 'Rio de Janeiro', numero_painel: 1,
  }

  it('retorna string base64 não-vazia para lista de pontos', () => {
    const base64 = gerarExportacao([pontoMock])
    expect(typeof base64).toBe('string')
    expect(base64.length).toBeGreaterThan(100)
  })

  it('Excel exportado contém os dados do ponto', () => {
    const base64 = gerarExportacao([pontoMock])
    const buffer = Buffer.from(base64, 'base64')
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
    expect(rows[0].codigo).toBe('RIO-001')
    expect(rows[0].nome).toBe('Ponto A')
  })
})
