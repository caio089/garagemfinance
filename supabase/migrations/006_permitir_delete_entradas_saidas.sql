-- Permite apagar entradas e saídas pelo app
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Permitir exclusão entradas' AND tablename = 'entradas'
  ) THEN
    CREATE POLICY "Permitir exclusão entradas" ON entradas FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Permitir exclusão saidas' AND tablename = 'saidas'
  ) THEN
    CREATE POLICY "Permitir exclusão saidas" ON saidas FOR DELETE USING (true);
  END IF;
END $$;
