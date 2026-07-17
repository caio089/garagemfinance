-- Mesas do restaurante (físicas)
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE CHECK (numero > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Serviço/comanda aberta em uma mesa
CREATE TABLE IF NOT EXISTS mesa_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id UUID NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
  dia_id UUID NOT NULL REFERENCES dias(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'finalizado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizado_at TIMESTAMPTZ
);

-- Só um serviço aberto por mesa
CREATE UNIQUE INDEX IF NOT EXISTS idx_mesa_servicos_aberta
  ON mesa_servicos (mesa_id)
  WHERE status = 'aberto';

CREATE INDEX IF NOT EXISTS idx_mesa_servicos_dia ON mesa_servicos(dia_id);
CREATE INDEX IF NOT EXISTS idx_mesa_servicos_mesa ON mesa_servicos(mesa_id);

-- Itens consumidos na comanda
CREATE TABLE IF NOT EXISTS mesa_consumo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES mesa_servicos(id) ON DELETE CASCADE,
  item_alimentacao_id UUID NOT NULL REFERENCES itens_alimentacao(id),
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  valor_unitario NUMERIC(12, 2) NOT NULL CHECK (valor_unitario >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mesa_consumo_servico ON mesa_consumo(servico_id);

ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesa_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesa_consumo ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir tudo mesas' AND tablename = 'mesas') THEN
    CREATE POLICY "Permitir tudo mesas" ON mesas FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir tudo mesa_servicos' AND tablename = 'mesa_servicos') THEN
    CREATE POLICY "Permitir tudo mesa_servicos" ON mesa_servicos FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir tudo mesa_consumo' AND tablename = 'mesa_consumo') THEN
    CREATE POLICY "Permitir tudo mesa_consumo" ON mesa_consumo FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed: 4 mesas iniciais
INSERT INTO mesas (numero)
SELECT n FROM generate_series(1, 4) AS n
WHERE NOT EXISTS (SELECT 1 FROM mesas LIMIT 1);
