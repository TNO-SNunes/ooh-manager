# Banco de Dados — OOH Manager

## Diagrama de entidades (resumido)

```
empresas
  └── usuarios
  └── pontos_midia
        └── reservas
              └── ordens_servico
                    └── os_fotos
  └── clientes
  └── campanhas
        └── reservas
```

---

## SQL de criação — migrations

### Extensões necessárias

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- para geolocalização
```

---

### empresas

```sql
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
```

---

### usuarios

```sql
CREATE TYPE perfil_usuario AS ENUM (
  'admin', 'gerente', 'vendedor', 'funcionario', 'checkin', 'midia'
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
```

---

### clientes

```sql
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
```

---

### campanhas

```sql
CREATE TABLE campanhas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id    UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  arte_url      TEXT,           -- arte da campanha para comparar no checkin
  data_inicio   DATE,
  data_fim      DATE,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campanhas_empresa ON campanhas(empresa_id);
CREATE INDEX idx_campanhas_cliente ON campanhas(cliente_id);
```

---

### pontos_midia

```sql
CREATE TYPE tipo_ponto AS ENUM ('outdoor', 'frontlight', 'empena', 'led');
CREATE TYPE status_ponto AS ENUM ('ativo', 'inativo', 'manutencao');

CREATE TABLE pontos_midia (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo          TEXT NOT NULL,          -- código interno (ex: "OUT-001")
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
  face            TEXT,                   -- Norte, Sul, Leste, Oeste
  -- LED-specific
  slot_duracao_s  INTEGER,                -- duração do slot em segundos (ex: 10)
  slots_totais    INTEGER,                -- total de slots no loop
  -- metadados
  fotos_urls      TEXT[],                 -- fotos do ponto em si
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE INDEX idx_pontos_empresa ON pontos_midia(empresa_id);
CREATE INDEX idx_pontos_tipo ON pontos_midia(empresa_id, tipo);
CREATE INDEX idx_pontos_cidade ON pontos_midia(empresa_id, cidade);
CREATE INDEX idx_pontos_status ON pontos_midia(empresa_id, status);
```

---

### bloqueios_manutencao

```sql
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
```

---

### reservas

```sql
CREATE TYPE status_reserva AS ENUM (
  'solicitada', 'ativa', 'rejeitada', 'cancelada', 'finalizada'
);

CREATE TABLE reservas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  ponto_id        UUID NOT NULL REFERENCES pontos_midia(id) ON DELETE RESTRICT,
  campanha_id     UUID NOT NULL REFERENCES campanhas(id) ON DELETE RESTRICT,
  vendedor_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  aprovador_id    UUID REFERENCES usuarios(id),           -- gerente que aprovou/rejeitou
  status          status_reserva NOT NULL DEFAULT 'solicitada',
  data_inicio     DATE NOT NULL,
  data_fim        DATE NOT NULL,
  -- LED-specific
  slot_numero     INTEGER,        -- qual slot do loop este cliente ocupa (LED only)
  -- fluxo de aprovação
  motivo_rejeicao TEXT,
  solicitado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aprovado_em     TIMESTAMPTZ,
  -- metadados
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
```

---

### ordens_servico

```sql
CREATE TYPE tipo_os AS ENUM (
  'colagem_lona', 'manutencao_eletrica', 'checkin_led',
  'instalacao', 'remocao', 'pintura_empena'
);

CREATE TYPE status_os AS ENUM (
  'criada', 'atribuida', 'em_execucao', 'aguardando_auditoria',
  'aprovada', 'reprovada', 'finalizada'
);

CREATE TABLE ordens_servico (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  reserva_id     UUID REFERENCES reservas(id) ON DELETE SET NULL,
  ponto_id       UUID NOT NULL REFERENCES pontos_midia(id) ON DELETE RESTRICT,
  tipo           tipo_os NOT NULL,
  status         status_os NOT NULL DEFAULT 'criada',
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  -- atribuição
  atribuido_para UUID REFERENCES usuarios(id),    -- funcionario ou checkin
  criado_por     UUID NOT NULL REFERENCES usuarios(id),
  -- auditoria
  auditado_por   UUID REFERENCES usuarios(id),
  motivo_reprovacao TEXT,
  -- datas
  data_prevista  DATE,
  iniciado_em    TIMESTAMPTZ,
  concluido_em   TIMESTAMPTZ,    -- quando campo marcou como concluído
  auditado_em    TIMESTAMPTZ,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_os_empresa ON ordens_servico(empresa_id);
CREATE INDEX idx_os_ponto ON ordens_servico(ponto_id);
CREATE INDEX idx_os_atribuido ON ordens_servico(atribuido_para);
CREATE INDEX idx_os_status ON ordens_servico(empresa_id, status);
CREATE INDEX idx_os_reserva ON ordens_servico(reserva_id);
```

---

### os_fotos

```sql
CREATE TYPE tipo_foto_os AS ENUM ('antes', 'durante', 'depois', 'checkin');
CREATE TYPE status_foto_os AS ENUM ('pendente', 'aprovada', 'reprovada');

CREATE TABLE os_fotos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  os_id           UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  enviado_por     UUID NOT NULL REFERENCES usuarios(id),
  storage_path    TEXT NOT NULL,      -- caminho no Supabase Storage
  url_publica     TEXT,               -- URL assinada (gerada sob demanda)
  tipo            tipo_foto_os NOT NULL DEFAULT 'checkin',
  status          status_foto_os NOT NULL DEFAULT 'pendente',
  -- geolocalização
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  precisao_m      DECIMAL(8,2),       -- precisão do GPS em metros
  -- timestamp
  capturado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- quando a foto foi tirada
  enviado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- quando chegou ao servidor
  -- upload offline
  device_id       TEXT,               -- ID do dispositivo (para reconciliar offline)
  sync_pendente   BOOLEAN DEFAULT false,
  -- auditoria
  reprovado_por   UUID REFERENCES usuarios(id),
  motivo_reprovacao TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fotos_os ON os_fotos(os_id);
CREATE INDEX idx_fotos_status ON os_fotos(os_id, status);
CREATE INDEX idx_fotos_enviado_por ON os_fotos(enviado_por);
```

---

### notificacoes

```sql
CREATE TYPE tipo_notificacao AS ENUM (
  'reserva_solicitada', 'reserva_aprovada', 'reserva_rejeitada',
  'os_atribuida', 'os_fotos_enviadas', 'os_aprovada', 'os_reprovada'
);

CREATE TABLE notificacoes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo           tipo_notificacao NOT NULL,
  titulo         TEXT NOT NULL,
  corpo          TEXT,
  lida           BOOLEAN NOT NULL DEFAULT false,
  entidade_tipo  TEXT,          -- 'reserva' | 'os'
  entidade_id    UUID,          -- ID da entidade relacionada
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON notificacoes(usuario_id, lida);
```

---

## Row Level Security (RLS)

### Princípio geral

Todas as tabelas têm RLS habilitado. Policies usam a função helper:

```sql
-- Helper: retorna empresa_id do usuário logado
CREATE OR REPLACE FUNCTION auth_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: retorna perfil do usuário logado
CREATE OR REPLACE FUNCTION auth_perfil()
RETURNS perfil_usuario AS $$
  SELECT perfil FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Policies — exemplos críticos

```sql
-- PONTOS: todos da empresa veem, apenas gerente/admin modificam
ALTER TABLE pontos_midia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pontos_select" ON pontos_midia
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "pontos_insert_update" ON pontos_midia
  FOR ALL USING (
    empresa_id = auth_empresa_id()
    AND auth_perfil() IN ('admin', 'gerente')
  );

-- RESERVAS: vendedor vê apenas as próprias
CREATE POLICY "reservas_select_vendedor" ON reservas
  FOR SELECT USING (
    empresa_id = auth_empresa_id()
    AND (
      auth_perfil() IN ('admin', 'gerente', 'midia')
      OR vendedor_id = auth.uid()
    )
  );

-- OS: funcionario/checkin veem apenas as atribuídas a eles
CREATE POLICY "os_select_campo" ON ordens_servico
  FOR SELECT USING (
    empresa_id = auth_empresa_id()
    AND (
      auth_perfil() IN ('admin', 'gerente', 'midia')
      OR atribuido_para = auth.uid()
      OR criado_por = auth.uid()
    )
  );

-- FOTOS: apenas quem enviou ou tem acesso à OS
CREATE POLICY "fotos_select" ON os_fotos
  FOR SELECT USING (
    empresa_id = auth_empresa_id()
    AND (
      auth_perfil() IN ('admin', 'gerente', 'midia')
      OR enviado_por = auth.uid()
    )
  );
```

---

## Triggers importantes

```sql
-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica em todas as tabelas principais
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- (repetir para pontos_midia, ordens_servico, etc.)

-- Ao aprovar OS: registra timestamp
CREATE OR REPLACE FUNCTION on_os_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'em_execucao' AND OLD.status = 'atribuida' THEN
    NEW.iniciado_em = NOW();
  END IF;
  IF NEW.status IN ('aguardando_auditoria') AND OLD.status = 'em_execucao' THEN
    NEW.concluido_em = NOW();
  END IF;
  IF NEW.status IN ('aprovada', 'reprovada') THEN
    NEW.auditado_em = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER os_status_change BEFORE UPDATE ON ordens_servico
  FOR EACH ROW EXECUTE FUNCTION on_os_status_change();
```
