// ============================================================
// OOH Manager — tipos TypeScript centrais
// ============================================================

export type PerfilUsuario =
  | 'admin'
  | 'gerente'
  | 'vendedor'
  | 'funcionario'
  | 'checkin'
  | 'midia'

export type TipoPonto = 'outdoor' | 'frontlight' | 'empena' | 'led'
export type StatusPonto = 'ativo' | 'inativo' | 'manutencao'

export type StatusReserva =
  | 'solicitada'
  | 'ativa'
  | 'rejeitada'
  | 'cancelada'
  | 'finalizada'

export type TipoOS =
  | 'colagem_lona'
  | 'manutencao_eletrica'
  | 'checkin_led'
  | 'instalacao'
  | 'remocao'
  | 'pintura_empena'

export type StatusOS =
  | 'criada'
  | 'atribuida'
  | 'em_execucao'
  | 'aguardando_auditoria'
  | 'aprovada'
  | 'reprovada'
  | 'finalizada'

export type TipoFotoOS = 'antes' | 'durante' | 'depois' | 'checkin'
export type StatusFotoOS = 'pendente' | 'aprovada' | 'reprovada'

// ============================================================
// Entidades principais
// ============================================================

export interface Empresa {
  id: string
  nome: string
  cnpj?: string
  logo_url?: string
  plano: 'starter' | 'pro' | 'enterprise'
  ativo: boolean
  criado_em: string
}

export interface Usuario {
  id: string
  empresa_id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  ativo: boolean
  criado_em: string
}

export interface PontoMidia {
  id: string
  empresa_id: string
  codigo: string
  nome: string
  tipo: TipoPonto
  status: StatusPonto
  cidade: string
  estado: string
  endereco?: string
  sentido?: string
  bairro?: string
  municipio?: string
  latitude?: number
  longitude?: number
  largura_m?: number
  altura_m?: number
  iluminacao: boolean
  face?: string
  numero_painel?: number
  // LED-specific
  slot_duracao_s?: number
  slots_totais?: number
  resolucao?: string
  fotos_urls?: string[]
  observacoes?: string
  criado_em: string
}

export interface Cliente {
  id: string
  empresa_id: string
  vendedor_id?: string
  nome: string
  cnpj?: string
  contato?: string
  telefone?: string
  email?: string
  ativo: boolean
  criado_em: string
}

export interface Campanha {
  id: string
  empresa_id: string
  cliente_id: string
  nome: string
  descricao?: string
  arte_url?: string
  data_inicio?: string
  data_fim?: string
  tipos?: string[]
  ativo: boolean
  criado_em: string
  // joins
  cliente?: Cliente
}

export interface Reserva {
  id: string
  empresa_id: string
  ponto_id: string
  campanha_id: string
  vendedor_id: string
  aprovador_id?: string
  status: StatusReserva
  data_inicio: string
  data_fim: string
  slot_numero?: number
  motivo_rejeicao?: string
  solicitado_em: string
  aprovado_em?: string
  observacoes?: string
  criado_em: string
  // joins
  ponto?: PontoMidia
  campanha?: Campanha
  vendedor?: Usuario
}

export interface ReservaComJoins extends Reserva {
  ponto: PontoMidia
  campanha: Campanha & { cliente: Cliente }
  vendedor: Usuario
}

export interface OrdemServico {
  id: string
  empresa_id: string
  reserva_id?: string
  ponto_id: string
  tipo: TipoOS
  status: StatusOS
  titulo: string
  descricao?: string
  atribuido_para?: string
  criado_por: string
  auditado_por?: string
  motivo_reprovacao?: string
  data_prevista?: string
  iniciado_em?: string
  concluido_em?: string
  auditado_em?: string
  criado_em: string
  // joins
  ponto?: PontoMidia
  reserva?: Reserva
  atribuido?: Usuario
  fotos?: FotoOS[]
}

export interface FotoOS {
  id: string
  os_id: string
  empresa_id: string
  enviado_por: string
  storage_path: string
  url_publica?: string
  tipo: TipoFotoOS
  status: StatusFotoOS
  latitude?: number
  longitude?: number
  precisao_m?: number
  capturado_em: string
  enviado_em: string
  device_id?: string
  sync_pendente: boolean
  motivo_reprovacao?: string
  criado_em: string
}

export interface BloqueioManutencao {
  id: string
  ponto_id: string
  empresa_id: string
  data_inicio: string
  data_fim: string
  motivo?: string
  criado_por?: string
  criado_em: string
}

// ============================================================
// Helpers de disponibilidade
// ============================================================

export type StatusDisponibilidade = 'livre' | 'parcial' | 'ocupado'

export interface DisponibilidadePonto {
  ponto: PontoMidia
  status: StatusDisponibilidade
  slots_livres?: number   // LED only
  slots_totais?: number   // LED only
}

// ============================================================
// Upload offline (Checkin)
// ============================================================

export interface FotoOffline {
  id: string           // uuid local
  os_id: string
  storage_path_local?: string
  blob: Blob
  tipo: TipoFotoOS
  latitude?: number
  longitude?: number
  precisao_m?: number
  capturado_em: string
  device_id: string
  tentativas: number
}
