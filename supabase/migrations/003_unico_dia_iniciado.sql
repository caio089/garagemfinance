-- Garante no máximo 1 dia com status 'iniciado'
CREATE UNIQUE INDEX IF NOT EXISTS idx_dias_unico_iniciado
  ON dias ((status))
  WHERE status = 'iniciado';
