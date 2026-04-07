// Geração e parsing de Excel para pontos de mídia
import type { PontoMidia } from '@/types'

export interface LinhaImportacao {
  linha: number
  dados?: Partial<PontoMidia>
  erro?: string
}

export function gerarTemplateExcel(): string {
  throw new Error('not implemented')
}

export function parsearImportacao(buffer: ArrayBuffer): LinhaImportacao[] {
  throw new Error('not implemented')
}

export function gerarExportacao(pontos: PontoMidia[]): string {
  throw new Error('not implemented')
}
