-- Campos extras da fila para integrar com relatórios / entradas

ALTER TABLE fila_lavagem
  ADD COLUMN IF NOT EXISTS polimento BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE fila_lavagem
  ADD COLUMN IF NOT EXISTS servico_valor_base NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (servico_valor_base >= 0);

ALTER TABLE fila_lavagem
  ADD COLUMN IF NOT EXISTS servico_extra_valor NUMERIC(12, 2) NOT NULL DEFAULT 0
    CHECK (servico_extra_valor >= 0);

ALTER TABLE fila_lavagem
  ADD COLUMN IF NOT EXISTS servico_extra_descricao TEXT;

ALTER TABLE fila_lavagem
  ADD COLUMN IF NOT EXISTS entrada_id UUID REFERENCES entradas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fila_lavagem_entrada_id
  ON fila_lavagem (entrada_id)
  WHERE entrada_id IS NOT NULL;
