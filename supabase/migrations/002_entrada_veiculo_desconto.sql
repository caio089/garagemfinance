-- Campos de veículo e desconto nas entradas
ALTER TABLE entradas
  ADD COLUMN IF NOT EXISTS placa TEXT,
  ADD COLUMN IF NOT EXISTS modelo TEXT,
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(12, 2) NOT NULL DEFAULT 0;
