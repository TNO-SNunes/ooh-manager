// Geração e parsing de Excel para pontos de mídia
import * as XLSX from 'xlsx'
import type { PontoMidia, TipoPonto, StatusPonto } from '@/types'

export interface LinhaImportacao {
  linha: number
  dados?: Partial<PontoMidia>
  erro?: string
}

const COLUNAS = [
  'tipo', 'nome', 'codigo', 'status', 'endereco', 'sentido', 'bairro',
  'municipio', 'cidade', 'estado', 'latitude', 'longitude',
  'largura_m', 'altura_m', 'iluminacao', 'numero_painel',
  'slots_totais', 'slot_duracao_s', 'resolucao', 'observacoes',
] as const

const TIPOS_VALIDOS: TipoPonto[] = ['outdoor', 'frontlight', 'empena', 'led']
const STATUS_VALIDOS: StatusPonto[] = ['ativo', 'inativo', 'manutencao']

export function gerarTemplateExcel(): string {
  const ws = XLSX.utils.aoa_to_sheet([COLUNAS as unknown as string[]])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pontos')
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
}

function parsearIluminacao(valor: unknown): boolean {
  if (typeof valor === 'number') return valor !== 0
  if (typeof valor === 'boolean') return valor
  const s = String(valor).toLowerCase().trim()
  return s === 'sim' || s === '1' || s === 'true'
}

export function parsearImportacao(buffer: ArrayBuffer): LinhaImportacao[] {
  const uint8array = new Uint8Array(buffer)
  const wb = XLSX.read(uint8array, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  return rows.map((row, index) => {
    const linha = index + 2 // +2 porque linha 1 é header

    const tipo = String(row['tipo'] ?? '').toLowerCase().trim() as TipoPonto
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return { linha, erro: `linha ${linha} — tipo inválido: "${row['tipo']}"` }
    }

    const nome = String(row['nome'] ?? '').trim()
    const endereco = String(row['endereco'] ?? '').trim()
    const municipio = String(row['municipio'] ?? '').trim()
    const cidade = String(row['cidade'] ?? '').trim()
    const estado = String(row['estado'] ?? '').trim()

    const ausentes = []
    if (!nome) ausentes.push('nome')
    if (!endereco) ausentes.push('endereco')
    if (!municipio) ausentes.push('municipio')
    if (!cidade) ausentes.push('cidade')
    if (!estado) ausentes.push('estado')

    if (ausentes.length > 0) {
      return { linha, erro: `linha ${linha} — campos obrigatórios ausentes: ${ausentes.join(', ')}` }
    }

    const statusRaw = String(row['status'] ?? 'ativo').toLowerCase().trim() as StatusPonto
    const status = STATUS_VALIDOS.includes(statusRaw) ? statusRaw : 'ativo'

    const dados: Partial<PontoMidia> = {
      tipo,
      nome,
      codigo: String(row['codigo'] ?? '').trim() || undefined,
      status,
      endereco,
      sentido: String(row['sentido'] ?? '').trim() || undefined,
      bairro: String(row['bairro'] ?? '').trim() || undefined,
      municipio,
      cidade,
      estado,
      latitude: row['latitude'] !== '' ? Number(row['latitude']) : undefined,
      longitude: row['longitude'] !== '' ? Number(row['longitude']) : undefined,
      largura_m: row['largura_m'] !== '' ? Number(row['largura_m']) : undefined,
      altura_m: row['altura_m'] !== '' ? Number(row['altura_m']) : undefined,
      iluminacao: parsearIluminacao(row['iluminacao']),
      numero_painel: row['numero_painel'] !== '' ? Number(row['numero_painel']) : undefined,
      slots_totais: row['slots_totais'] !== '' ? Number(row['slots_totais']) : undefined,
      slot_duracao_s: row['slot_duracao_s'] !== '' ? Number(row['slot_duracao_s']) : undefined,
      resolucao: String(row['resolucao'] ?? '').trim() || undefined,
      observacoes: String(row['observacoes'] ?? '').trim() || undefined,
    }

    return { linha, dados }
  })
}

export function gerarExportacao(pontos: PontoMidia[]): string {
  const header = [...COLUNAS, 'criado_em']
  const rows = pontos.map(p => [
    p.tipo, p.nome, p.codigo, p.status,
    p.endereco ?? '', p.sentido ?? '', p.bairro ?? '',
    p.municipio ?? '', p.cidade, p.estado,
    p.latitude ?? '', p.longitude ?? '',
    p.largura_m ?? '', p.altura_m ?? '',
    p.iluminacao ? 'sim' : 'não',
    p.numero_painel ?? '',
    p.slots_totais ?? '', p.slot_duracao_s ?? '',
    p.resolucao ?? '', p.observacoes ?? '',
    p.criado_em,
  ])
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pontos')
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
}
