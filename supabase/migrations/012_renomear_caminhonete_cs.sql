-- Padroniza o serviço de camionetes de cabine simples já cadastrado.
UPDATE public.servicos_lavagem
SET nome = 'Caminhonete (CS)'
WHERE lower(nome) IN (
  'camionete médio porte (strada/saveiro) cabine simples',
  'caminhonete médio porte (strada/saveiro) cabine simples'
);
