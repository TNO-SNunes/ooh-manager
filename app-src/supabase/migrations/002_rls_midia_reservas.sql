-- app-src/supabase/migrations/002_rls_midia_reservas.sql
-- Atualiza policy de update de reservas para incluir perfil 'midia'
-- Mídia passou a poder aprovar/rejeitar reservas solicitadas por vendedores

DROP POLICY IF EXISTS "reservas_gerente_update" ON reservas;

CREATE POLICY "reservas_gerente_update" ON reservas
  FOR UPDATE
  USING (
    empresa_id = auth_empresa_id()
    AND auth_perfil() IN ('admin', 'gerente', 'midia')
  );
