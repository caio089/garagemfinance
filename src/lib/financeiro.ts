/**
 * Saldo diário = tudo que entrou − tudo que saiu.
 * Não inclui caixa inicial (isso entra no valor em caixa).
 */
export function calcularSaldoDiario(
  totalEntradas: number,
  totalSaidas: number
): number {
  return totalEntradas - totalSaidas;
}

/** @deprecated use calcularSaldoDiario */
export function calcularLucro(
  totalEntradas: number,
  totalSaidas: number
): number {
  return calcularSaldoDiario(totalEntradas, totalSaidas);
}

/** Valor em caixa = caixa inicial + saldo diário */
export function calcularValorEmCaixa(
  caixaInicial: number,
  totalEntradas: number,
  totalSaidas: number
): number {
  return caixaInicial + calcularSaldoDiario(totalEntradas, totalSaidas);
}

/** Dinheiro que deve estar no caixa ao fim do dia. */
export function calcularCaixaFinal(
  caixaInicial: number,
  totalEntradas: number,
  totalSaidas: number
): number {
  return calcularValorEmCaixa(caixaInicial, totalEntradas, totalSaidas);
}
