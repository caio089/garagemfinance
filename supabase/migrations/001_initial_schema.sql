-- Garagem Finance - Schema inicial

-- Tabela de dias de operação
CREATE TABLE IF NOT EXISTS dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  caixa_inicial NUMERIC(12, 2) NOT NULL DEFAULT 0,
  caixa_final NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'iniciado' CHECK (status IN ('iniciado', 'finalizado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de entradas
CREATE TABLE IF NOT EXISTS entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_id UUID NOT NULL REFERENCES dias(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('lavagem', 'outro')),
  categoria TEXT NOT NULL CHECK (categoria IN ('hatch', 'sedan', 'suv', 'camionete', 'outro')),
  polimento BOOLEAN NOT NULL DEFAULT FALSE,
  valor NUMERIC(12, 2) NOT NULL,
  desconto NUMERIC(12, 2) NOT NULL DEFAULT 0,
  placa TEXT,
  modelo TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de saídas
CREATE TABLE IF NOT EXISTS saidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_id UUID NOT NULL REFERENCES dias(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('cozinha', 'funcionario', 'lava_jato')),
  valor NUMERIC(12, 2) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dias_status ON dias(status);
CREATE INDEX IF NOT EXISTS idx_dias_data ON dias(data DESC);
CREATE INDEX IF NOT EXISTS idx_entradas_dia_id ON entradas(dia_id);
CREATE INDEX IF NOT EXISTS idx_saidas_dia_id ON saidas(dia_id);

-- RLS habilitado (sem autenticação por enquanto - políticas permissivas)
ALTER TABLE dias ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE saidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura dias" ON dias FOR SELECT USING (true);
CREATE POLICY "Permitir inserção dias" ON dias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização dias" ON dias FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura entradas" ON entradas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção entradas" ON entradas FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura saidas" ON saidas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção saidas" ON saidas FOR INSERT WITH CHECK (true);
