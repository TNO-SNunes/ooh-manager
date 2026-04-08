export function validarCliente(data: { nome?: string }): Record<string, string> | null {
  const errors: Record<string, string> = {}
  if (!data.nome?.trim()) errors.nome = 'Nome é obrigatório.'
  return Object.keys(errors).length ? errors : null
}
