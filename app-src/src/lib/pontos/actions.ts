// Lógica de negócio pura para pontos de mídia
// Funções sem side-effects — testáveis com vitest
import type { PontoMidia, TipoPonto } from '@/types'

export function normalizarMunicipio(municipio: string): string {
  const normalizado = municipio
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove diacríticos
    .toUpperCase()
    .replace(/[^A-Z]/g, '')           // só letras

  return normalizado.slice(0, 3).padEnd(3, 'X')
}

export function gerarCodigo(municipio: string, existentes: string[]): string {
  const prefixo = normalizarMunicipio(municipio)
  const doMesmoPrefixo = existentes.filter(c => c.startsWith(`${prefixo}-`))

  let maximo = 0
  for (const codigo of doMesmoPrefixo) {
    const partes = codigo.split('-')
    const num = parseInt(partes[partes.length - 1], 10)
    if (!isNaN(num) && num > maximo) maximo = num
  }

  const proximo = maximo + 1
  return `${prefixo}-${String(proximo).padStart(3, '0')}`
}

export function nomeLegivel(
  ponto: Pick<PontoMidia, 'nome' | 'tipo' | 'numero_painel'>
): string {
  const painel = ponto.numero_painel ?? 1
  switch (ponto.tipo) {
    case 'outdoor':
      return `${ponto.nome} - Tab. ${painel}`
    case 'frontlight':
    case 'empena':
      return `${ponto.nome} - Painel ${painel}`
    case 'led':
      return ponto.nome
  }
}

export interface ErroValidacao {
  campo: string
  mensagem: string
}

export function validarPonto(data: Partial<PontoMidia>): ErroValidacao[] {
  const erros: ErroValidacao[] = []

  if (!data.tipo) erros.push({ campo: 'tipo', mensagem: 'Tipo é obrigatório' })
  if (!data.nome?.trim()) erros.push({ campo: 'nome', mensagem: 'Nome é obrigatório' })
  if (!data.endereco?.trim()) erros.push({ campo: 'endereco', mensagem: 'Endereço é obrigatório' })
  if (!data.municipio?.trim()) erros.push({ campo: 'municipio', mensagem: 'Município é obrigatório' })
  if (!data.cidade?.trim()) erros.push({ campo: 'cidade', mensagem: 'Cidade é obrigatória' })
  if (!data.estado?.trim()) erros.push({ campo: 'estado', mensagem: 'Estado é obrigatório' })

  if (data.estado && data.estado.replace(/[^A-Za-z]/g, '').length !== 2) {
    erros.push({ campo: 'estado', mensagem: 'Estado deve ter 2 letras (ex: RJ)' })
  }

  if (data.tipo === 'led') {
    if (!data.slots_totais || data.slots_totais < 1) {
      erros.push({ campo: 'slots_totais', mensagem: 'Cotas totais deve ser pelo menos 1' })
    }
    if (!data.slot_duracao_s || ![10, 15].includes(data.slot_duracao_s)) {
      erros.push({ campo: 'slot_duracao_s', mensagem: 'Duração deve ser 10 ou 15 segundos' })
    }
  }

  const temLat = data.latitude !== undefined && data.latitude !== null
  const temLng = data.longitude !== undefined && data.longitude !== null
  if (temLat && !temLng) erros.push({ campo: 'longitude', mensagem: 'Longitude obrigatória quando latitude é preenchida' })
  if (temLng && !temLat) erros.push({ campo: 'latitude', mensagem: 'Latitude obrigatória quando longitude é preenchida' })

  return erros
}
