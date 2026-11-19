-- Preços editáveis das lavagens
CREATE TABLE IF NOT EXISTS precos_lavagem (
  chave TEXT PRIMARY KEY CHECK (chave IN ('hatch', 'sedan', 'suv', 'camionete', 'polimento')),
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO precos_lavagem (chave, valor) VALUES
  ('hatch', 55),
  ('sedan', 55),
  ('suv', 70),
  ('camionete', 80),
  ('polimento', 10)
ON CONFLICT (chave) DO NOTHING;

-- Catálogo de alimentação (bebida, comida, etc.)
CREATE TABLE IF NOT EXISTS itens_alimentacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('bebida', 'comida', 'outro')),
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itens_alimentacao_ativo ON itens_alimentacao(ativo);

-- Vínculo opcional da entrada com item do catálogo
ALTER TABLE entradas
  ADD COLUMN IF NOT EXISTS item_alimentacao_id UUID REFERENCES itens_alimentacao(id) ON DELETE SET NULL;

ALTER TABLE precos_lavagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_alimentacao ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir leitura precos_lavagem' AND tablename = 'precos_lavagem') THEN
    CREATE POLICY "Permitir leitura precos_lavagem" ON precos_lavagem FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir atualização precos_lavagem' AND tablename = 'precos_lavagem') THEN
    CREATE POLICY "Permitir atualização precos_lavagem" ON precos_lavagem FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir inserção precos_lavagem' AND tablename = 'precos_lavagem') THEN
    CREATE POLICY "Permitir inserção precos_lavagem" ON precos_lavagem FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir leitura itens_alimentacao' AND tablename = 'itens_alimentacao') THEN
    CREATE POLICY "Permitir leitura itens_alimentacao" ON itens_alimentacao FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir inserção itens_alimentacao' AND tablename = 'itens_alimentacao') THEN
    CREATE POLICY "Permitir inserção itens_alimentacao" ON itens_alimentacao FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir atualização itens_alimentacao' AND tablename = 'itens_alimentacao') THEN
    CREATE POLICY "Permitir atualização itens_alimentacao" ON itens_alimentacao FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir exclusão itens_alimentacao' AND tablename = 'itens_alimentacao') THEN
    CREATE POLICY "Permitir exclusão itens_alimentacao" ON itens_alimentacao FOR DELETE USING (true);
  END IF;
END $$;

-- Item padrão: PF R$20
INSERT INTO itens_alimentacao (nome, tipo, valor, ativo)
SELECT 'PF', 'outro', 20, true
WHERE NOT EXISTS (
  SELECT 1 FROM itens_alimentacao WHERE lower(nome) = 'pf' AND ativo = true
);
