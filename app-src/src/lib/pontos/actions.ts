// Lógica de negócio pura para pontos de mídia
// Funções sem side-effects — testáveis com vitest
import type { PontoMidia, TipoPonto } from '@/types'

export function normalizarMunicipio(municipio: string): string {
  throw new Error('not implemented')
}

export function gerarCodigo(municipio: string, existentes: string[]): string {
  throw new Error('not implemented')
}

export function nomeLegivel(ponto: Pick<PontoMidia, 'nome' | 'tipo' | 'numero_painel'>): string {
  throw new Error('not implemented')
}

export interface ErroValidacao {
  campo: string
  mensagem: string
}

export function validarPonto(data: Partial<PontoMidia>): ErroValidacao[] {
  throw new Error('not implemented')
}
