import { getSupabase } from "@/lib/supabase";
import {
  PRECOS_LAVAGEM_PADRAO,
  PRECO_POLIMENTO_PADRAO,
  type PrecoLavagem,
  type PrecoLavagemChave,
} from "@/types";

export type PrecosLavagemMap = Record<PrecoLavagemChave, number>;

export function precosPadrao(): PrecosLavagemMap {
  return {
    hatch: PRECOS_LAVAGEM_PADRAO.hatch,
    sedan: PRECOS_LAVAGEM_PADRAO.sedan,
    suv: PRECOS_LAVAGEM_PADRAO.suv,
    camionete: PRECOS_LAVAGEM_PADRAO.camionete,
    polimento: PRECO_POLIMENTO_PADRAO,
  };
}

export async function buscarPrecosLavagem(): Promise<PrecosLavagemMap> {
  const defaults = precosPadrao();

  try {
    const { data, error } = await getSupabase()
      .from("precos_lavagem")
      .select("chave, valor");

    if (error) throw error;

    const map = { ...defaults };
    for (const row of data ?? []) {
      const chave = row.chave as PrecoLavagemChave;
      if (chave in map) map[chave] = Number(row.valor);
    }
    // Hatch e sedan compartilham o valor do hatch na UI
    if (map.hatch) map.sedan = map.hatch;
    return map;
  } catch {
    return defaults;
  }
}

export async function salvarPrecoLavagem(
  chave: PrecoLavagemChave,
  valor: number
): Promise<PrecoLavagem> {
  if (valor < 0) throw new Error("Valor inválido.");

  const { data, error } = await getSupabase()
    .from("precos_lavagem")
    .upsert(
      {
        chave,
        valor,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chave" }
    )
    .select()
    .single();

  if (error) throw error;

  // Mantém sedan sincronizado com hatch
  if (chave === "hatch") {
    await getSupabase()
      .from("precos_lavagem")
      .upsert(
        {
          chave: "sedan",
          valor,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "chave" }
      );
  }

  return {
    chave: data.chave,
    valor: Number(data.valor),
    updated_at: data.updated_at,
  };
}

export async function salvarPrecosLavagem(
  precos: Partial<PrecosLavagemMap>
): Promise<PrecosLavagemMap> {
  const entries = Object.entries(precos).filter(
    ([, valor]) => typeof valor === "number" && valor >= 0
  ) as [PrecoLavagemChave, number][];

  for (const [chave, valor] of entries) {
    await salvarPrecoLavagem(chave, valor);
  }

  return buscarPrecosLavagem();
}
