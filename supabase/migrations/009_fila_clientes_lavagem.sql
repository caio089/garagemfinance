-- Clientes/veículos recorrentes + fila de lavagem (rota pública /fila)

CREATE TABLE IF NOT EXISTS clientes_veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL,
  nome_proprietario TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  servico_preferido_id UUID REFERENCES servicos_lavagem(id) ON DELETE SET NULL,
  visitas INTEGER NOT NULL DEFAULT 1 CHECK (visitas >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clientes_veiculos_placa_unique UNIQUE (placa)
);

CREATE INDEX IF NOT EXISTS idx_clientes_veiculos_placa
  ON clientes_veiculos (placa);

CREATE TABLE IF NOT EXISTS fila_lavagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_veiculo_id UUID REFERENCES clientes_veiculos(id) ON DELETE SET NULL,
  placa TEXT NOT NULL,
  nome_proprietario TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  servico_lavagem_id UUID REFERENCES servicos_lavagem(id) ON DELETE SET NULL,
  servico_nome TEXT NOT NULL,
  servico_valor NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (servico_valor >= 0),
  status TEXT NOT NULL DEFAULT 'aguardando'
    CHECK (status IN ('aguardando', 'em_andamento', 'finalizado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  iniciado_at TIMESTAMPTZ,
  finalizado_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fila_lavagem_status_created
  ON fila_lavagem (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_fila_lavagem_placa
  ON fila_lavagem (placa);

ALTER TABLE clientes_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_lavagem ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Permitir tudo clientes_veiculos'
      AND tablename = 'clientes_veiculos'
  ) THEN
    CREATE POLICY "Permitir tudo clientes_veiculos"
      ON clientes_veiculos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Permitir tudo fila_lavagem'
      AND tablename = 'fila_lavagem'
  ) THEN
    CREATE POLICY "Permitir tudo fila_lavagem"
      ON fila_lavagem FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
