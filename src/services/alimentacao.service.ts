import { getSupabase } from "@/lib/supabase";
import type { ItemAlimentacao, ItemAlimentacaoTipo } from "@/types";

export async function listarItensAlimentacao(
  apenasAtivos = true
): Promise<ItemAlimentacao[]> {
  let query = getSupabase()
    .from("itens_alimentacao")
    .select("*")
    .order("tipo", { ascending: true })
    .order("nome", { ascending: true });

  if (apenasAtivos) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((item) => ({
    ...item,
    valor: Number(item.valor),
  }));
}

export async function criarItemAlimentacao(params: {
  nome: string;
  tipo: ItemAlimentacaoTipo;
  valor: number;
}): Promise<ItemAlimentacao> {
  const nome = params.nome.trim();
  if (!nome) throw new Error("Informe o nome do item.");
  if (params.valor < 0) throw new Error("Valor inválido.");

  const { data, error } = await getSupabase()
    .from("itens_alimentacao")
    .insert({
      nome,
      tipo: params.tipo,
      valor: params.valor,
      ativo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, valor: Number(data.valor) };
}

export async function atualizarItemAlimentacao(
  id: string,
  params: {
    nome?: string;
    tipo?: ItemAlimentacaoTipo;
    valor?: number;
    ativo?: boolean;
  }
): Promise<ItemAlimentacao> {
  const payload: Record<string, unknown> = {};
  if (params.nome !== undefined) payload.nome = params.nome.trim();
  if (params.tipo !== undefined) payload.tipo = params.tipo;
  if (params.valor !== undefined) payload.valor = params.valor;
  if (params.ativo !== undefined) payload.ativo = params.ativo;

  const { data, error } = await getSupabase()
    .from("itens_alimentacao")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, valor: Number(data.valor) };
}

export async function desativarItemAlimentacao(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("itens_alimentacao")
    .update({ ativo: false })
    .eq("id", id);

  if (error) throw error;
}
