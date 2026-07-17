-- Catálogo de tipos de serviço do lava-jato (nome + valor)
CREATE TABLE IF NOT EXISTS servicos_lavagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicos_lavagem_ativo ON servicos_lavagem(ativo);

ALTER TABLE entradas
  ADD COLUMN IF NOT EXISTS servico_lavagem_id UUID REFERENCES servicos_lavagem(id) ON DELETE SET NULL;

-- Libera categorias fixas para aceitar serviços cadastrados
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_categoria_check;

ALTER TABLE servicos_lavagem ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Permitir tudo servicos_lavagem' AND tablename = 'servicos_lavagem'
  ) THEN
    CREATE POLICY "Permitir tudo servicos_lavagem"
      ON servicos_lavagem FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed a partir dos preços atuais (só se a tabela estiver vazia)
INSERT INTO servicos_lavagem (nome, valor, ativo)
SELECT v.nome, v.valor, true
FROM (
  VALUES
    ('Hatch/Sedan', 55::numeric),
    ('SUV', 70::numeric),
    ('Camionete', 80::numeric)
) AS v(nome, valor)
WHERE NOT EXISTS (SELECT 1 FROM servicos_lavagem LIMIT 1);
