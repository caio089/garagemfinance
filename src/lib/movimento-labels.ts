import { CATEGORIA_LABELS } from "@/types";
import type { Entrada, EntradaCategoria } from "@/types";

export function labelEntrada(entrada: Entrada): string {
  if (entrada.tipo === "lavagem") {
    const desc = entrada.descricao?.trim();
    if (desc?.startsWith("Lavagem:")) {
      const resto = desc.slice("Lavagem:".length).trim();
      const nome = resto.split("·")[0]?.trim();
      return nome ? `Lavagem ${nome}` : "Lavagem";
    }

    const cat = entrada.categoria as EntradaCategoria;
    if (cat in CATEGORIA_LABELS && cat !== "outro" && cat !== "avulsa") {
      return `Lavagem ${CATEGORIA_LABELS[cat]}`;
    }

    return "Lavagem";
  }

  if (entrada.tipo === "avulsa" || entrada.categoria === "avulsa") {
    const desc = entrada.descricao?.trim();
    if (desc?.startsWith("Avulsa:")) {
      const resto = desc.slice("Avulsa:".length).trim();
      return resto ? `Avulsa · ${resto}` : "Entrada avulsa";
    }
    if (desc && desc !== "Entrada avulsa") return `Avulsa · ${desc}`;
    return "Entrada avulsa";
  }

  const desc = entrada.descricao?.trim();
  if (!desc) return "Restaurante";
  if (desc.startsWith("Mesa ")) {
    return desc.split("·")[0]?.trim() || "Restaurante";
  }
  if (desc.includes(":")) {
    return desc.split(":").slice(1).join(":").trim() || "Restaurante";
  }
  return desc;
}
