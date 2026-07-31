-- Novas categorias de saída e tipo de entrada avulsa

ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_categoria_check;
ALTER TABLE saidas
  ADD CONSTRAINT saidas_categoria_check
  CHECK (
    categoria IN (
      'cozinha',
      'funcionario',
      'lava_jato',
      'custos_operacionais',
      'manutencao'
    )
  );

ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_tipo_check;
ALTER TABLE entradas
  ADD CONSTRAINT entradas_tipo_check
  CHECK (tipo IN ('lavagem', 'outro', 'avulsa'));

ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_categoria_check;
ALTER TABLE entradas
  ADD CONSTRAINT entradas_categoria_check
  CHECK (
    categoria IN (
      'hatch',
      'sedan',
      'suv',
      'camionete',
      'outro',
      'avulsa'
    )
  );
