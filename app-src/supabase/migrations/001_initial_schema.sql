-- ============================================================
-- OOH Manager — Schema inicial
-- Migration 001
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE perfil_usuario AS ENUM (
  'admin', 'gerente', 'vendedor', 'funcionario', 'checkin', 'midia'
);

CREATE TYPE tipo_ponto AS ENUM ('outdoor', 'frontlight', 'empena', 'led');
CREATE TYPE status_ponto AS ENUM ('ativo', 'inativo', 'manutencao');

CREATE TYPE status_reserva AS ENUM (
  'solicitada', 'ativa', 'rejeitada', 'cancelada', 'finalizada'
);

CREATE TYPE tipo_os AS ENUM (
  'colagem_lona', 'manutencao_eletrica', 'checkin_led',
  'instalacao', 'remocao', 'pintura_empena'
);

CREATE TYPE status_os AS ENUM (
  'criada', 'atribuida', 'em_execucao', 'aguardando_auditoria',
  'aprovada', 'reprovada', 'finalizada'
);

CREATE TYPE tipo_foto_os AS ENUM ('antes', 'durante', 'depois', 'checkin');
CREATE TYPE status_foto_os AS ENUM ('pendente', 'aprovada', 'reprovada');

CREATE TYPE tipo_notificacao AS ENUM (
  'reserva_solicitada', 'reserva_aprovada', 'reserva_rejeitada',
  'os_atribuida', 'os_fotos_enviadas', 'os_aprovada', 'os_reprovada'
);

-- ============================================================
-- Tabelas
-- ============================================================

CREATE TABLE empresas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          TEXT NOT NULL,
  cnpj          TEXT UNIQUE,
  logo_url      TEXT,
  plano         TEXT NOT NULL DEFAULT 'starter' CHECK (plano IN ('starter','pro','enterprise')),
  ativo         BOOLEAN NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL,
  perfil        perfil_usuario NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, email)
);

CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_perfil ON usuarios(empresa_id, perfil);

CREATE TABLE clientes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  vendedor_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nome          TEXT NOT NULL,
  cnpj          TEXT,
  contato       TEXT,
  telefone      TEXT,
  email         TEXT,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_vendedor ON clientes(vendedor_id);

CREATE TABLE campanhas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id    UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  arte_url      TEXT,
  data_inicio   DATE,
  data_fim      DATE,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campanhas_empresa ON campanhas(empresa_id);
CREATE INDEX idx_campanhas_cliente ON campanhas(cliente_id);

CREATE TABLE pontos_midia (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo          TEXT NOT NULL,
  nome            TEXT NOT NULL,
  tipo            tipo_ponto NOT NULL,
  status          status_ponto NOT NULL DEFAULT 'ativo',
  cidade          TEXT NOT NULL,
  estado          CHAR(2) NOT NULL,
  endereco        TEXT,
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  largura_m       DECIMAL(6,2),
  altura_m        DECIMAL(6,2),
  iluminacao      BOOLEAN DEFAULT false,
  face            TEXT,
  slot_duracao_s  INTEGER,
  slots_totais    INTEGER,
  fotos_urls      TEXT[],
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE INDEX idx_pontos_empresa ON pontos_midia(empresa_id);
CREATE INDEX idx_pontos_tipo ON pontos_midia(empresa_id, tipo);
CREATE INDEX idx_pontos_cidade ON pontos_midia(empresa_id, cidade);
CREATE INDEX idx_pontos_status ON pontos_midia(empresa_id, status);

CREATE TABLE bloqueios_manutencao (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ponto_id     UUID NOT NULL REFERENCES pontos_midia(id) ON DELETE CASCADE,
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_inicio  DATE NOT NULL,
  data_fim     DATE NOT NULL,
  motivo       TEXT,
  criado_por   UUID REFERENCES usuarios(id),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bloqueio_datas_validas CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_bloqueios_ponto ON bloqueios_manutencao(ponto_id);

CREATE TABLE reservas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  ponto_id        UUID NOT NULL REFERENCES pontos_midia(id) ON DELETE RESTRICT,
  campanha_id     UUID NOT NULL REFERENCES campanhas(id) ON DELETE RESTRICT,
  vendedor_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  aprovador_id    UUID REFERENCES usuarios(id),
  status          status_reserva NOT NULL DEFAULT 'solicitada',
  data_inicio     DATE NOT NULL,
  data_fim        DATE NOT NULL,
  slot_numero     INTEGER,
  slots_quantidade INTEGER NOT NULL DEFAULT 1,
  motivo_rejeicao TEXT,
  solicitado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aprovado_em     TIMESTAMPTZ,
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reserva_datas_validas CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_reservas_empresa ON reservas(empresa_id);
CREATE INDEX idx_reservas_ponto ON reservas(ponto_id);
CREATE INDEX idx_reservas_campanha ON reservas(campanha_id);
CREATE INDEX idx_reservas_vendedor ON reservas(vendedor_id);
CREATE INDEX idx_reservas_status ON reservas(empresa_id, status);
CREATE INDEX idx_reservas_periodo ON reservas(ponto_id, data_inicio, data_fim);

-- Unicidade para pontos não-LED (impede double-booking)
CREATE UNIQUE INDEX idx_reserva_exclusiva_nao_led
  ON reservas (ponto_id, data_inicio, data_fim)
  WHERE status IN ('solicitada', 'ativa') AND slot_numero IS NULL;

-- Unicidade por slot para LED
CREATE UNIQUE INDEX idx_reserva_led_slot
  ON reservas (ponto_id, slot_numero, data_inicio, data_fim)
  WHERE status IN ('solicitada', 'ativa') AND slot_numero IS NOT NULL;

CREATE TABLE ordens_servico (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  reserva_id     UUID REFERENCES reservas(id) ON DELETE SET NULL,
  ponto_id       UUID NOT NULL REFERENCES pontos_midia(id) ON DELETE RESTRICT,
  tipo           tipo_os NOT NULL,
  status         status_os NOT NULL DEFAULT 'criada',
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  atribuido_para UUID REFERENCES usuarios(id),
  criado_por     UUID NOT NULL REFERENCES usuarios(id),
  auditado_por   UUID REFERENCES usuarios(id),
  motivo_reprovacao TEXT,
  data_prevista  DATE,
  iniciado_em    TIMESTAMPTZ,
  concluido_em   TIMESTAMPTZ,
  auditado_em    TIMESTAMPTZ,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_os_empresa ON ordens_servico(empresa_id);
CREATE INDEX idx_os_ponto ON ordens_servico(ponto_id);
CREATE INDEX idx_os_atribuido ON ordens_servico(atribuido_para);
CREATE INDEX idx_os_status ON ordens_servico(empresa_id, status);
CREATE INDEX idx_os_reserva ON ordens_servico(reserva_id);

CREATE TABLE os_fotos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  os_id           UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  enviado_por     UUID NOT NULL REFERENCES usuarios(id),
  storage_path    TEXT NOT NULL,
  url_publica     TEXT,
  tipo            tipo_foto_os NOT NULL DEFAULT 'checkin',
  status          status_foto_os NOT NULL DEFAULT 'pendente',
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  precisao_m      DECIMAL(8,2),
  capturado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enviado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id       TEXT,
  sync_pendente   BOOLEAN DEFAULT false,
  reprovado_por   UUID REFERENCES usuarios(id),
  motivo_reprovacao TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fotos_os ON os_fotos(os_id);
CREATE INDEX idx_fotos_status ON os_fotos(os_id, status);
CREATE INDEX idx_fotos_enviado_por ON os_fotos(enviado_por);

CREATE TABLE notificacoes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo           tipo_notificacao NOT NULL,
  titulo         TEXT NOT NULL,
  corpo          TEXT,
  lida           BOOLEAN NOT NULL DEFAULT false,
  entidade_tipo  TEXT,
  entidade_id    UUID,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON notificacoes(usuario_id, lida);

-- ============================================================
-- Helpers e Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_campanhas_updated BEFORE UPDATE ON campanhas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pontos_updated BEFORE UPDATE ON pontos_midia FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reservas_updated BEFORE UPDATE ON reservas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_os_updated BEFORE UPDATE ON ordens_servico FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION on_os_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'em_execucao' AND OLD.status = 'atribuida' THEN
    NEW.iniciado_em = NOW();
  END IF;
  IF NEW.status = 'aguardando_auditoria' AND OLD.status = 'em_execucao' THEN
    NEW.concluido_em = NOW();
  END IF;
  IF NEW.status IN ('aprovada', 'reprovada') THEN
    NEW.auditado_em = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_os_status_change BEFORE UPDATE ON ordens_servico FOR EACH ROW EXECUTE FUNCTION on_os_status_change();

-- ============================================================
-- Row Level Security
-- ============================================================

CREATE OR REPLACE FUNCTION auth_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_perfil()
RETURNS perfil_usuario AS $$
  SELECT perfil FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- empresas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresas_select" ON empresas FOR SELECT USING (id = auth_empresa_id());

-- usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (empresa_id = auth_empresa_id());
CREATE POLICY "usuarios_admin" ON usuarios FOR ALL USING (empresa_id = auth_empresa_id() AND auth_perfil() IN ('admin', 'gerente'));

-- clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_select" ON clientes FOR SELECT USING (
  empresa_id = auth_empresa_id()
  AND (auth_perfil() IN ('admin', 'gerente', 'midia') OR vendedor_id = auth.uid())
);
CREATE POLICY "clientes_write" ON clientes FOR ALL USING (
  empresa_id = auth_empresa_id()
  AND auth_perfil() IN ('admin', 'gerente', 'vendedor')
);

-- campanhas
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campanhas_select" ON campanhas FOR SELECT USING (empresa_id = auth_empresa_id());
CREATE POLICY "campanhas_write" ON campanhas FOR ALL USING (
  empresa_id = auth_empresa_id() AND auth_perfil() IN ('admin', 'gerente', 'vendedor')
);

-- pontos_midia
ALTER TABLE pontos_midia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pontos_select" ON pontos_midia FOR SELECT USING (empresa_id = auth_empresa_id());
CREATE POLICY "pontos_write" ON pontos_midia FOR ALL USING (
  empresa_id = auth_empresa_id() AND auth_perfil() IN ('admin', 'gerente')
);

-- bloqueios
ALTER TABLE bloqueios_manutencao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bloqueios_select" ON bloqueios_manutencao FOR SELECT USING (empresa_id = auth_empresa_id());
CREATE POLICY "bloqueios_write" ON bloqueios_manutencao FOR ALL USING (
  empresa_id = auth_empresa_id() AND auth_perfil() IN ('admin', 'gerente')
);

-- reservas
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservas_select" ON reservas FOR SELECT USING (
  empresa_id = auth_empresa_id()
  AND (auth_perfil() IN ('admin', 'gerente', 'midia') OR vendedor_id = auth.uid())
);
CREATE POLICY "reservas_vendedor_insert" ON reservas FOR INSERT WITH CHECK (
  empresa_id = auth_empresa_id()
  AND auth_perfil() IN ('admin', 'gerente', 'vendedor')
);
CREATE POLICY "reservas_gerente_update" ON reservas FOR UPDATE USING (
  empresa_id = auth_empresa_id() AND auth_perfil() IN ('admin', 'gerente')
);

-- ordens_servico
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "os_select" ON ordens_servico FOR SELECT USING (
  empresa_id = auth_empresa_id()
  AND (
    auth_perfil() IN ('admin', 'gerente', 'midia')
    OR atribuido_para = auth.uid()
    OR criado_por = auth.uid()
  )
);
CREATE POLICY "os_write" ON ordens_servico FOR ALL USING (
  empresa_id = auth_empresa_id() AND auth_perfil() IN ('admin', 'gerente')
);
CREATE POLICY "os_campo_update" ON ordens_servico FOR UPDATE USING (
  empresa_id = auth_empresa_id()
  AND atribuido_para = auth.uid()
  AND auth_perfil() IN ('funcionario', 'checkin')
);

-- os_fotos
ALTER TABLE os_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fotos_select" ON os_fotos FOR SELECT USING (
  empresa_id = auth_empresa_id()
  AND (auth_perfil() IN ('admin', 'gerente', 'midia') OR enviado_por = auth.uid())
);
CREATE POLICY "fotos_insert" ON os_fotos FOR INSERT WITH CHECK (
  empresa_id = auth_empresa_id()
  AND auth_perfil() IN ('funcionario', 'checkin', 'gerente', 'admin')
);
CREATE POLICY "fotos_midia_update" ON os_fotos FOR UPDATE USING (
  empresa_id = auth_empresa_id() AND auth_perfil() IN ('admin', 'gerente', 'midia')
);

-- notificacoes
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select" ON notificacoes FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "notif_update" ON notificacoes FOR UPDATE USING (usuario_id = auth.uid());
