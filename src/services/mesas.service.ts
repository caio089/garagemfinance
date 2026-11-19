import { getSupabase } from "@/lib/supabase";
import { criarEntrada } from "@/services/entradas.service";
import type {
  ItemAlimentacao,
  Mesa,
  MesaComStatus,
  MesaConsumo,
  MesaServico,
} from "@/types";

function mapMesa(row: Mesa): Mesa {
  return { ...row, numero: Number(row.numero) };
}

export async function listarMesas(): Promise<Mesa[]> {
  const { data, error } = await getSupabase()
    .from("mesas")
    .select("*")
    .order("numero", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapMesa);
}

export async function adicionarMesa(): Promise<Mesa> {
  const mesas = await listarMesas();
  const proximo =
    mesas.length === 0 ? 1 : Math.max(...mesas.map((m) => m.numero)) + 1;

  const { data, error } = await getSupabase()
    .from("mesas")
    .insert({ numero: proximo })
    .select()
    .single();

  if (error) throw error;
  return mapMesa(data);
}

export async function retirarMesa(mesaId: string): Promise<void> {
  const servico = await buscarServicoAbertoDaMesa(mesaId);
  if (servico) {
    throw new Error("Finalize o serviço desta mesa antes de removê-la.");
  }

  const { error } = await getSupabase().from("mesas").delete().eq("id", mesaId);
  if (error) throw error;
}

export async function buscarServicoAbertoDaMesa(
  mesaId: string
): Promise<MesaServico | null> {
  const { data, error } = await getSupabase()
    .from("mesa_servicos")
    .select("*")
    .eq("mesa_id", mesaId)
    .eq("status", "aberto")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listarMesasComStatus(): Promise<MesaComStatus[]> {
  const mesas = await listarMesas();
  if (mesas.length === 0) return [];

  const ids = mesas.map((m) => m.id);
  const { data: servicos, error: servicosError } = await getSupabase()
    .from("mesa_servicos")
    .select("*")
    .in("mesa_id", ids)
    .eq("status", "aberto");

  if (servicosError) throw servicosError;

  const servicosAbertos = servicos ?? [];
  const servicoIds = servicosAbertos.map((s) => s.id);

  let consumos: MesaConsumo[] = [];
  if (servicoIds.length > 0) {
    const { data, error } = await getSupabase()
      .from("mesa_consumo")
      .select("*")
      .in("servico_id", servicoIds);

    if (error) throw error;
    consumos = (data ?? []).map((c) => ({
      ...c,
      quantidade: Number(c.quantidade),
      valor_unitario: Number(c.valor_unitario),
    }));
  }

  return mesas.map((mesa) => {
    const servico = servicosAbertos.find((s) => s.mesa_id === mesa.id) ?? null;
    const itens = servico
      ? consumos.filter((c) => c.servico_id === servico.id)
      : [];
    const total = itens.reduce(
      (sum, c) => sum + c.quantidade * c.valor_unitario,
      0
    );

    return {
      ...mesa,
      servico,
      total,
      itensCount: itens.reduce((sum, c) => sum + c.quantidade, 0),
    };
  });
}

export async function iniciarServicoMesa(
  mesaId: string,
  diaId: string
): Promise<MesaServico> {
  const aberto = await buscarServicoAbertoDaMesa(mesaId);
  if (aberto) {
    throw new Error("Esta mesa já possui um serviço em andamento.");
  }

  const { data, error } = await getSupabase()
    .from("mesa_servicos")
    .insert({
      mesa_id: mesaId,
      dia_id: diaId,
      status: "aberto",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listarConsumoDoServico(
  servicoId: string
): Promise<(MesaConsumo & { item: ItemAlimentacao })[]> {
  const { data, error } = await getSupabase()
    .from("mesa_consumo")
    .select("*, item:itens_alimentacao(*)")
    .eq("servico_id", servicoId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const item = Array.isArray(row.item) ? row.item[0] : row.item;
    return {
      id: row.id,
      servico_id: row.servico_id,
      item_alimentacao_id: row.item_alimentacao_id,
      quantidade: Number(row.quantidade),
      valor_unitario: Number(row.valor_unitario),
      created_at: row.created_at,
      item: {
        ...item,
        valor: Number(item.valor),
      },
    };
  });
}

export async function adicionarItemNaMesa(params: {
  servicoId: string;
  item: ItemAlimentacao;
  quantidade?: number;
}): Promise<MesaConsumo> {
  const quantidade = Math.max(1, params.quantidade ?? 1);

  const { data: existentes, error: buscaError } = await getSupabase()
    .from("mesa_consumo")
    .select("*")
    .eq("servico_id", params.servicoId)
    .eq("item_alimentacao_id", params.item.id)
    .limit(1);

  if (buscaError) throw buscaError;

  const atual = existentes?.[0];
  if (atual) {
    const { data, error } = await getSupabase()
      .from("mesa_consumo")
      .update({ quantidade: Number(atual.quantidade) + quantidade })
      .eq("id", atual.id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      quantidade: Number(data.quantidade),
      valor_unitario: Number(data.valor_unitario),
    };
  }

  const { data, error } = await getSupabase()
    .from("mesa_consumo")
    .insert({
      servico_id: params.servicoId,
      item_alimentacao_id: params.item.id,
      quantidade,
      valor_unitario: params.item.valor,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    quantidade: Number(data.quantidade),
    valor_unitario: Number(data.valor_unitario),
  };
}

export async function alterarQuantidadeItem(
  consumoId: string,
  delta: number
): Promise<void> {
  const { data: atual, error: buscaError } = await getSupabase()
    .from("mesa_consumo")
    .select("*")
    .eq("id", consumoId)
    .single();

  if (buscaError) throw buscaError;

  const proxima = Number(atual.quantidade) + delta;
  if (proxima <= 0) {
    const { error } = await getSupabase()
      .from("mesa_consumo")
      .delete()
      .eq("id", consumoId);
    if (error) throw error;
    return;
  }

  const { error } = await getSupabase()
    .from("mesa_consumo")
    .update({ quantidade: proxima })
    .eq("id", consumoId);

  if (error) throw error;
}

export async function finalizarServicoMesa(params: {
  mesa: MesaComStatus;
  diaId: string;
}): Promise<{ total: number }> {
  if (!params.mesa.servico) {
    throw new Error("Esta mesa não possui serviço aberto.");
  }

  const consumos = await listarConsumoDoServico(params.mesa.servico.id);
  if (consumos.length === 0) {
    throw new Error("Adicione pelo menos um item antes de finalizar a mesa.");
  }

  const total = consumos.reduce(
    (sum, c) => sum + c.quantidade * c.valor_unitario,
    0
  );

  const itensDesc = consumos
    .map((c) => {
      const nome = c.item?.nome ?? "Item";
      return c.quantidade > 1 ? `${c.quantidade}x ${nome}` : nome;
    })
    .join(", ");

  const descricao = `Mesa ${params.mesa.numero} · ${itensDesc}`;

  await criarEntrada({
    diaId: params.diaId,
    tipo: "outro",
    categoria: "outro",
    polimento: false,
    valorPersonalizado: total,
    descricao,
  });

  const { error } = await getSupabase()
    .from("mesa_servicos")
    .update({
      status: "finalizado",
      finalizado_at: new Date().toISOString(),
    })
    .eq("id", params.mesa.servico.id)
    .eq("status", "aberto");

  if (error) throw error;

  return { total };
}
