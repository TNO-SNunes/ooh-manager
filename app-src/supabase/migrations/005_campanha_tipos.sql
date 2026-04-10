-- Adiciona campo tipos[] à tabela campanhas
-- Armazena quais tipos de veículo a campanha contempla
-- Valores possíveis: 'outdoor', 'frontlight_empena', 'led'

ALTER TABLE campanhas
  ADD COLUMN IF NOT EXISTS tipos text[] DEFAULT '{}';
