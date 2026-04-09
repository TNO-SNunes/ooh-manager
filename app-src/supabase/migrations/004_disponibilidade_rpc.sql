-- app-src/supabase/migrations/004_disponibilidade_rpc.sql
-- Funções RPC para consulta de disponibilidade.
-- Usam SECURITY DEFINER para bypassar RLS de reservas/bloqueios
-- (vendedor só vê as próprias reservas via RLS, mas a disponibilidade
--  precisa ver todas as reservas ativas da empresa).

-- Retorna ocupações de pontos em um período
-- Colunas: ponto_id, total_ocupacoes, slots_em_uso (array de slot_numero)
CREATE OR REPLACE FUNCTION ocupacoes_periodo(
  p_empresa_id UUID,
  p_data_inicio DATE,
  p_data_fim DATE
)
RETURNS TABLE(
  ponto_id     UUID,
  total_ocupacoes BIGINT,
  slots_em_uso INT[]
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    r.ponto_id,
    COUNT(*)::BIGINT AS total_ocupacoes,
    array_agg(r.slot_numero ORDER BY r.slot_numero)::INT[] AS slots_em_uso
  FROM reservas r
  WHERE r.empresa_id = p_empresa_id
    AND r.status IN ('solicitada', 'ativa')
    AND r.data_inicio <= p_data_fim
    AND r.data_fim   >= p_data_inicio
  GROUP BY r.ponto_id
$$;

-- Retorna IDs de pontos com bloqueio de manutenção no período
CREATE OR REPLACE FUNCTION bloqueios_no_periodo(
  p_empresa_id UUID,
  p_data_inicio DATE,
  p_data_fim DATE
)
RETURNS TABLE(ponto_id UUID)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT DISTINCT b.ponto_id
  FROM bloqueios_manutencao b
  WHERE b.empresa_id = p_empresa_id
    AND b.data_inicio <= p_data_fim
    AND b.data_fim   >= p_data_inicio
$$;
