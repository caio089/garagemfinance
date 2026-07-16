export type DiaStatus = "iniciado" | "finalizado";

export type EntradaTipo = "lavagem" | "outro";

export type EntradaCategoria =
  | "hatch"
  | "sedan"
  | "suv"
  | "camionete"
  | "outro";

export type SaidaCategoria = "cozinha" | "funcionario" | "lava_jato";

export interface Dia {
  id: string;
  data: string;
  caixa_inicial: number;
  caixa_final: number | null;
  status: DiaStatus;
  created_at: string;
}

export interface Entrada {
  id: string;
  dia_id: string;
  tipo: EntradaTipo;
  categoria: EntradaCategoria;
  polimento: boolean;
  valor: number;
  descricao: string | null;
  created_at: string;
}

export interface Saida {
  id: string;
  dia_id: string;
  categoria: SaidaCategoria;
  valor: number;
  descricao: string | null;
  created_at: string;
}

export interface ResumoDia {
  data: string;
  caixaInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  lucro: number;
  caixaFinal: number;
  lavagens: number;
  polimentos: number;
  outros: number;
}

export interface DashboardMetrics {
  caixaInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  lucro: number;
}

export type FiltroRelatorio = "dias" | "semanal" | "mensal";

export interface ResumoPeriodo {
  tipo: "semanal" | "mensal";
  periodoInicio: string;
  periodoFim: string;
  totalEntradas: number;
  totalSaidas: number;
  faturamento: number;
  lucro: number;
  diasOperados: number;
  lavagens: number;
  polimentos: number;
  outros: number;
}

export interface DiaComResumo extends Dia {
  totalEntradas: number;
  totalSaidas: number;
  lavagens: number;
  polimentos: number;
  outros: number;
}

export const PRECOS_LAVAGEM: Record<
  Exclude<EntradaCategoria, "outro">,
  number
> = {
  hatch: 50,
  sedan: 50,
  suv: 70,
  camionete: 80,
};

export const PRECO_POLIMENTO = 10;
export const PRECO_PF = 20;

export const CATEGORIA_LABELS: Record<EntradaCategoria, string> = {
  hatch: "Hatch/Sedan",
  sedan: "Sedan",
  suv: "SUV",
  camionete: "Camionete",
  outro: "PF",
};

export const SAIDA_CATEGORIA_LABELS: Record<SaidaCategoria, string> = {
  cozinha: "Cozinha",
  funcionario: "Funcionário",
  lava_jato: "Lava-jato",
};
