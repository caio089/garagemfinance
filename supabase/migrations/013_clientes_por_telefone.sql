CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clientes_nome_nao_vazio CHECK (length(trim(nome)) > 0),
  CONSTRAINT clientes_whatsapp_valido CHECK (whatsapp ~ '^[0-9]{10,11}$')
);

INSERT INTO clientes (nome, whatsapp, created_at, updated_at)
SELECT trim(nome_proprietario), regexp_replace(whatsapp, '\\D', '', 'g'), min(created_at), max(updated_at)
FROM clientes_veiculos
WHERE length(regexp_replace(whatsapp, '\\D', '', 'g')) BETWEEN 10 AND 11
  AND length(trim(nome_proprietario)) > 0
GROUP BY regexp_replace(whatsapp, '\\D', '', 'g'), trim(nome_proprietario)
ON CONFLICT (whatsapp) DO UPDATE SET nome = EXCLUDED.nome, updated_at = GREATEST(clientes.updated_at, EXCLUDED.updated_at);

ALTER TABLE fila_lavagem ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fila_lavagem_cliente_id ON fila_lavagem (cliente_id) WHERE cliente_id IS NOT NULL;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir tudo clientes' AND tablename = 'clientes') THEN
    CREATE POLICY "Permitir tudo clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
