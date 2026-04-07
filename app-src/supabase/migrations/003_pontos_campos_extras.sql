-- app-src/supabase/migrations/003_pontos_campos_extras.sql
-- Campos adicionados ao pontos_midia para o Sprint 2
-- ATENÇÃO: sentido, bairro, municipio, numero_painel e resolucao
-- já foram aplicados manualmente no Supabase. Esta migration é
-- apenas documentação — NÃO executar novamente.

ALTER TABLE pontos_midia
  ADD COLUMN IF NOT EXISTS sentido       TEXT,
  ADD COLUMN IF NOT EXISTS bairro        TEXT,
  ADD COLUMN IF NOT EXISTS municipio     TEXT,
  ADD COLUMN IF NOT EXISTS numero_painel INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS resolucao     TEXT;
