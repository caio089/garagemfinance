import { getSupabase } from "@/lib/supabase";
import type { ServicoLavagem } from "@/types";

function mapServico(row: ServicoLavagem): ServicoLavagem {
  return { ...row, valor: Number(row.valor) };
}

export async function listarServicosLavagem(
  apenasAtivos = true
): Promise<ServicoLavagem[]> {
  let query = getSupabase()
    .from("servicos_lavagem")
    .select("*")
    .order("nome", { ascending: true });

  if (apenasAtivos) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapServico);
}

export async function criarServicoLavagem(params: {
  nome: string;
  valor: number;
}): Promise<ServicoLavagem> {
  const nome = params.nome.trim();
  if (!nome) throw new Error("Informe o nome do serviço.");
  if (params.valor < 0) throw new Error("Valor inválido.");

  const { data, error } = await getSupabase()
    .from("servicos_lavagem")
    .insert({
      nome,
      valor: params.valor,
      ativo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return mapServico(data);
}

export async function atualizarServicoLavagem(
  id: string,
  params: {
    nome?: string;
    valor?: number;
    ativo?: boolean;
  }
): Promise<ServicoLavagem> {
  const payload: Record<string, unknown> = {};
  if (params.nome !== undefined) {
    const nome = params.nome.trim();
    if (!nome) throw new Error("Informe o nome do serviço.");
    payload.nome = nome;
  }
  if (params.valor !== undefined) {
    if (params.valor < 0) throw new Error("Valor inválido.");
    payload.valor = params.valor;
  }
  if (params.ativo !== undefined) payload.ativo = params.ativo;

  const { data, error } = await getSupabase()
    .from("servicos_lavagem")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapServico(data);
}

export async function desativarServicoLavagem(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("servicos_lavagem")
    .update({ ativo: false })
    .eq("id", id);

  if (error) throw error;
}
