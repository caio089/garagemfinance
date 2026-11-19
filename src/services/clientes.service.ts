import { getSupabase } from "@/lib/supabase";
import type { Cliente } from "@/types";

export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
}

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await getSupabase().from("clientes").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function salvarCliente(params: { nome: string; whatsapp: string }): Promise<Cliente> {
  const nome = params.nome.trim();
  const whatsapp = normalizarTelefone(params.whatsapp);
  if (!nome) throw new Error("Informe o nome do cliente.");
  if (whatsapp.length < 10) throw new Error("Informe um WhatsApp válido.");
  const { data, error } = await getSupabase().from("clientes").upsert(
    { nome, whatsapp, updated_at: new Date().toISOString() }, { onConflict: "whatsapp" }
  ).select().single();
  if (error) throw error;
  return data;
}
