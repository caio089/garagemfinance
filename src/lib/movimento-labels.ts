import { CATEGORIA_LABELS } from "@/types";
import type { Entrada, EntradaCategoria } from "@/types";

/** Extrai serviço extra gravado na descrição da lavagem. */
export function parseServicoExtra(descricao: string | null | undefined): {
  descricao: string;
  valor: number;
} | null {
  if (!descricao) return null;
  const match = descricao.match(
    /Extra:\s*(.+?)\s*\(\+?\s*R\$\s*([\d.]+(?:,\d{2})?)\)/i
  );
  if (!match) return null;

  const valorStr = match[2].replace(/\./g, "").replace(",", ".");
  const valor = Number(valorStr);
  if (!Number.isFinite(valor)) return null;

  return { descricao: match[1].trim(), valor };
}

export function labelEntrada(entrada: Entrada): string {
  if (entrada.tipo === "lavagem") {
    const desc = entrada.descricao?.trim();
    if (desc?.startsWith("Lavagem:")) {
      const resto = desc.slice("Lavagem:".length).trim();
      const nome = resto.split("·")[0]?.trim();
      const extra = parseServicoExtra(desc);
      const base = nome ? `Lavagem ${nome}` : "Lavagem";
      return extra ? `${base} + extra` : base;
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
