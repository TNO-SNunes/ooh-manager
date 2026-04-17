export interface CamposReserva {
  ponto_id?: string
  campanha_id?: string
  data_inicio?: string
  data_fim?: string
  slot_numero?: number | null
  observacoes?: string | null
}

export function validarCamposReserva(campos: CamposReserva): Record<string, string> | null {
  const erros: Record<string, string> = {}

  if (!campos.ponto_id) erros.ponto_id = 'Ponto é obrigatório.'
  if (!campos.campanha_id) erros.campanha_id = 'Campanha é obrigatória.'
  if (!campos.data_inicio) erros.data_inicio = 'Data de início é obrigatória.'
  if (!campos.data_fim) erros.data_fim = 'Data de fim é obrigatória.'

  if (campos.data_inicio && campos.data_fim && campos.data_fim < campos.data_inicio) {
    erros.data_fim = 'Data de fim deve ser posterior à data de início.'
  }

  return Object.keys(erros).length > 0 ? erros : null
}
