/**
 * Lucro do período = tudo que entrou − tudo que saiu.
 * Não inclui caixa inicial (isso entra só no caixa final).
 */
export function calcularLucro(
  totalEntradas: number,
  totalSaidas: number
): number {
  return totalEntradas - totalSaidas;
}

/** Dinheiro que deve estar no caixa ao fim do dia. */
export function calcularCaixaFinal(
  caixaInicial: number,
  totalEntradas: number,
  totalSaidas: number
): number {
  return caixaInicial + calcularLucro(totalEntradas, totalSaidas);
}
