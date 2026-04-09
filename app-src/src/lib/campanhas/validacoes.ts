export function validarCampanha(data: {
  nome?: string
  cliente_id?: string
  data_inicio?: string | null
  data_fim?: string | null
}): Record<string, string> | null {
  const errors: Record<string, string> = {}
  if (!data.nome?.trim()) errors.nome = 'Nome é obrigatório.'
  if (!data.cliente_id) errors.cliente_id = 'Cliente é obrigatório.'
  if (data.data_inicio && data.data_fim && data.data_fim < data.data_inicio) {
    errors.data_fim = 'Data de fim deve ser posterior à data de início.'
  }
  return Object.keys(errors).length ? errors : null
}
