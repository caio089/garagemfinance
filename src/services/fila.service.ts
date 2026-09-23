import { getSupabase } from "@/lib/supabase";
import type { ClienteVeiculo, FilaLavagemItem, FilaLavagemStatus } from "@/types";

export type ModeloFila = "hatch" | "sedan" | "suv" | "camionete";

export const MODELO_FILA_OPCOES: { value: ModeloFila; label: string }[] = [
  { value: "hatch", label: "Hatch" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "camionete", label: "Caminhonete" },
];

export const MODELO_FILA_LABELS: Record<ModeloFila, string> = {
  hatch: "Hatch",
  sedan: "Sedan",
  suv: "SUV",
  camionete: "Caminhonete",
};

export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function normalizarWhatsapp(whatsapp: string): string {
  return whatsapp.replace(/\D/g, "").slice(0, 13);
}

export function formatarWhatsappInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function mapCliente(row: ClienteVeiculo): ClienteVeiculo {
  return { ...row, visitas: Number(row.visitas) || 1 };
}

function mapFila(row: FilaLavagemItem): FilaLavagemItem {
  return {
    ...row,
    servico_valor: Number(row.servico_valor) || 0,
    polimento: Boolean(row.polimento),
    servico_valor_base: Number(row.servico_valor_base) || 0,
    servico_extra_valor: Number(row.servico_extra_valor) || 0,
    servico_extra_descricao: row.servico_extra_descricao ?? null,
    entrada_id: row.entrada_id ?? null,
  };
}

export async function buscarClientePorPlaca(
  placa: string
): Promise<ClienteVeiculo | null> {
  const placaNorm = normalizarPlaca(placa);
  if (placaNorm.length < 7) return null;

  const { data, error } = await getSupabase()
    .from("clientes_veiculos")
    .select("*")
    .eq("placa", placaNorm)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCliente(data) : null;
}

/** Lista completa de clientes (só painel financeiro). */
export async function listarClientesVeiculos(): Promise<ClienteVeiculo[]> {
  const { data, error } = await getSupabase()
    .from("clientes_veiculos")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapCliente);
}

export async function upsertClienteVeiculo(params: {
  placa: string;
  nomeProprietario: string;
  whatsapp: string;
  servicoPreferidoId?: string | null;
}): Promise<ClienteVeiculo> {
  const placa = normalizarPlaca(params.placa);
  const nome = params.nomeProprietario.trim();
  const whatsapp = normalizarWhatsapp(params.whatsapp);

  if (placa.length < 7) throw new Error("Informe uma placa válida.");
  if (!nome) throw new Error("Informe o nome do proprietário.");
  if (whatsapp.length < 10) throw new Error("Informe um WhatsApp válido.");

  const existente = await buscarClientePorPlaca(placa);

  if (existente) {
    const { data, error } = await getSupabase()
      .from("clientes_veiculos")
      .update({
        nome_proprietario: nome,
        whatsapp,
        servico_preferido_id: params.servicoPreferidoId ?? existente.servico_preferido_id,
        visitas: Number(existente.visitas) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existente.id)
      .select()
      .single();

    if (error) throw error;
    return mapCliente(data);
  }

  const { data, error } = await getSupabase()
    .from("clientes_veiculos")
    .insert({
      placa,
      nome_proprietario: nome,
      whatsapp,
      servico_preferido_id: params.servicoPreferidoId ?? null,
      visitas: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCliente(data);
}

/** Monta o rótulo do serviço com polimento / extra (igual ao financeiro). */
export function montarDescricaoServicoFila(params: {
  servicoNome: string;
  polimento?: boolean;
  servicoExtraValor?: number;
  servicoExtraDescricao?: string;
}): string {
  const partes = [params.servicoNome.trim()];
  if (params.polimento) partes.push("Polimento");
  const extra = Math.max(0, params.servicoExtraValor ?? 0);
  if (extra > 0) {
    const label = params.servicoExtraDescricao?.trim() || "Serviço extra";
    partes.push(label);
  }
  return partes.join(" + ");
}

export async function adicionarNaFila(params: {
  /** Modelo do veículo (substitui a placa na fila operacional). */
  modelo: ModeloFila;
  nomeProprietario: string;
  whatsapp: string;
  servicoLavagemId?: string | null;
  servicoNome: string;
  /** Valor do serviço cadastrado (sem polimento/extra). */
  servicoValorBase?: number;
  /** Valor total já calculado (serviço + polimento + extra − desconto). */
  servicoValor: number;
  polimento?: boolean;
  servicoExtraValor?: number;
  servicoExtraDescricao?: string;
}): Promise<FilaLavagemItem> {
  const nome = params.nomeProprietario.trim();
  const whatsapp = normalizarWhatsapp(params.whatsapp);
  const modeloLabel = MODELO_FILA_LABELS[params.modelo];

  if (!nome) throw new Error("Informe o nome do proprietário.");
  if (whatsapp.length < 10) throw new Error("Informe um WhatsApp válido.");
  if (!modeloLabel) throw new Error("Selecione o modelo do veículo.");

  const agora = new Date().toISOString();
  const servicoNome = montarDescricaoServicoFila({
    servicoNome: params.servicoNome,
    polimento: params.polimento,
    servicoExtraValor: params.servicoExtraValor,
    servicoExtraDescricao: params.servicoExtraDescricao,
  });

  const extraValor = Math.max(0, params.servicoExtraValor ?? 0);
  const valorBase = Math.max(
    0,
    params.servicoValorBase ?? params.servicoValor - extraValor
  );

  const payloadBase = {
    cliente_veiculo_id: null as string | null,
    placa: modeloLabel.toUpperCase(),
    nome_proprietario: nome,
    whatsapp,
    servico_lavagem_id: params.servicoLavagemId || null,
    servico_nome: servicoNome,
    servico_valor: Math.max(0, params.servicoValor),
    status: "em_andamento" as const,
    iniciado_at: agora,
  };

  const payloadCompleto = {
    ...payloadBase,
    polimento: Boolean(params.polimento),
    servico_valor_base: valorBase,
    servico_extra_valor: extraValor,
    servico_extra_descricao:
      extraValor > 0 ? params.servicoExtraDescricao?.trim() || null : null,
  };

  let insertResult = await getSupabase()
    .from("fila_lavagem")
    .insert(payloadCompleto)
    .select()
    .single();

  if (insertResult.error) {
    insertResult = await getSupabase()
      .from("fila_lavagem")
      .insert(payloadBase)
      .select()
      .single();
  }

  if (insertResult.error) throw insertResult.error;
  return mapFila(insertResult.data);
}

function inicioDoDiaLocalIso(): string {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  return inicio.toISOString();
}

/** Só carros do dia civil atual (agrupa por data/hora do registro). */
export async function listarFilaAtiva(): Promise<FilaLavagemItem[]> {
  const { data, error } = await getSupabase()
    .from("fila_lavagem")
    .select("*")
    .in("status", ["aguardando", "em_andamento"])
    .gte("created_at", inicioDoDiaLocalIso())
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapFila);
}

/** Finalizados de hoje (para avisar o cliente no WhatsApp). */
export async function listarFilaFinalizadosHoje(): Promise<FilaLavagemItem[]> {
  const { data, error } = await getSupabase()
    .from("fila_lavagem")
    .select("*")
    .eq("status", "finalizado")
    .gte("finalizado_at", inicioDoDiaLocalIso())
    .order("finalizado_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFila);
}

/** Link do WhatsApp com mensagem pronta: carro liberado. */
export function linkWhatsappCarroPronto(item: FilaLavagemItem): string {
  const digitos = normalizarWhatsapp(item.whatsapp);
  const telefone = digitos.startsWith("55") ? digitos : `55${digitos}`;
  const mensagem = [
    `Olá, ${item.nome_proprietario}!`,
    "",
    `Seu veículo *${item.placa}* (${item.servico_nome}) já está pronto para retirada.`,
    "",
    "Garagem Federal — obrigado pela preferência!",
  ].join("\n");

  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

export async function atualizarStatusFila(
  id: string,
  status: FilaLavagemStatus
): Promise<FilaLavagemItem> {
  const payload: Record<string, unknown> = { status };

  if (status === "em_andamento") {
    payload.iniciado_at = new Date().toISOString();
  }
  if (status === "finalizado" || status === "cancelado") {
    payload.finalizado_at = new Date().toISOString();
  }

  const { data, error } = await getSupabase()
    .from("fila_lavagem")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapFila(data);
}

/**
 * Finaliza o carro na fila e lança a entrada no dia civil da compra
 * (data/hora do registro — sem precisar abrir caixa).
 */
export async function finalizarItemFila(id: string): Promise<{
  item: FilaLavagemItem;
  entrouNoRelatorio: boolean;
}> {
  const { data: atual, error: erroBusca } = await getSupabase()
    .from("fila_lavagem")
    .select("*")
    .eq("id", id)
    .single();

  if (erroBusca) throw erroBusca;

  const itemAtual = mapFila(atual);

  if (itemAtual.status === "finalizado") {
    return {
      item: itemAtual,
      entrouNoRelatorio: Boolean(itemAtual.entrada_id),
    };
  }

  const item = await atualizarStatusFila(id, "finalizado");

  if (itemAtual.entrada_id) {
    return { item, entrouNoRelatorio: true };
  }

  const { dataCivilLocal, obterOuCriarDiaPorData } = await import(
    "@/services/dias.service"
  );
  const { criarEntrada } = await import("@/services/entradas.service");

  // Usa a data em que o protocolo entrou na fila (dia da compra)
  const dataCompra = dataCivilLocal(new Date(itemAtual.created_at));
  const dia = await obterOuCriarDiaPorData(dataCompra);

  const temPolimento =
    Boolean(itemAtual.polimento) ||
    itemAtual.servico_nome.toLowerCase().includes("polimento");

  const entrada = await criarEntrada({
    diaId: dia.id,
    tipo: "lavagem",
    polimento: temPolimento,
    placa: item.placa,
    modelo: item.nome_proprietario,
    descricao: `Fila · ${item.nome_proprietario}`,
    servicoLavagemId: item.servico_lavagem_id ?? undefined,
    nomeServico: item.servico_nome,
    valorFixo: item.servico_valor,
  });

  const { error: erroLink } = await getSupabase()
    .from("fila_lavagem")
    .update({ entrada_id: entrada.id })
    .eq("id", id);

  // Coluna entrada_id é opcional até rodar a migration 010
  if (erroLink && !String(erroLink.message).includes("entrada_id")) {
    throw erroLink;
  }

  return { item, entrouNoRelatorio: true };
}

/**
 * Remove um carro finalizado da fila.
 * Se estiver ligado a uma entrada do caixa, remove do relatório também.
 */
export async function excluirItemFilaFinalizado(id: string): Promise<void> {
  const { data: atual, error: erroBusca } = await getSupabase()
    .from("fila_lavagem")
    .select("*")
    .eq("id", id)
    .single();

  if (erroBusca) throw erroBusca;

  const item = mapFila(atual);
  if (item.status !== "finalizado") {
    throw new Error("Só é possível excluir carros finalizados.");
  }

  if (item.entrada_id) {
    const { excluirEntrada } = await import("@/services/entradas.service");
    try {
      await excluirEntrada(item.entrada_id);
    } catch {
      // Continua excluindo da fila mesmo se a entrada já não existir
    }
  } else {
    // Fallback: remove entrada do dia da compra pela placa + descrição da fila
    try {
      const { dataCivilLocal, buscarDiaPorData } = await import(
        "@/services/dias.service"
      );
      const dataCompra = dataCivilLocal(new Date(item.created_at));
      const dia = await buscarDiaPorData(dataCompra);
      if (dia) {
        const { data: entradas } = await getSupabase()
          .from("entradas")
          .select("id, placa, descricao")
          .eq("dia_id", dia.id)
          .eq("placa", item.placa)
          .eq("tipo", "lavagem");

        const candidata = (entradas ?? []).find(
          (e) =>
            String(e.descricao ?? "").includes("Fila ·") &&
            String(e.descricao ?? "").includes(item.nome_proprietario)
        );
        if (candidata?.id) {
          const { excluirEntrada } = await import("@/services/entradas.service");
          await excluirEntrada(candidata.id);
        }
      }
    } catch {
      // ignore
    }
  }

  const { error } = await getSupabase()
    .from("fila_lavagem")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
