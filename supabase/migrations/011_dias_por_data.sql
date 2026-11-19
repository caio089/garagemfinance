-- Dias passam a ser agrupados por data (sem abrir/fechar caixa).
-- Um registro por dia civil; movimentos usam data/hora do registro.

DROP INDEX IF EXISTS idx_dias_unico_iniciado;

-- Consolida datas duplicadas: aponta movimentos para o dia mais recente
-- e remove os demais.
DO $$
DECLARE
  r RECORD;
  keep_id UUID;
BEGIN
  FOR r IN
    SELECT data
    FROM dias
    GROUP BY data
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id
    FROM dias
    WHERE data = r.data
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT 1;

    UPDATE entradas
    SET dia_id = keep_id
    WHERE dia_id IN (
      SELECT id FROM dias WHERE data = r.data AND id <> keep_id
    );

    UPDATE saidas
    SET dia_id = keep_id
    WHERE dia_id IN (
      SELECT id FROM dias WHERE data = r.data AND id <> keep_id
    );

    -- Mesas (se existir a tabela)
    BEGIN
      UPDATE mesa_servicos
      SET dia_id = keep_id
      WHERE dia_id IN (
        SELECT id FROM dias WHERE data = r.data AND id <> keep_id
      );
    EXCEPTION
      WHEN undefined_table THEN
        NULL;
    END;

    DELETE FROM dias
    WHERE data = r.data
      AND id <> keep_id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dias_unico_data ON dias (data);
