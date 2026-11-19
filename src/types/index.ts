export type DiaStatus = "iniciado" | "finalizado";

export type EntradaTipo = "lavagem" | "outro" | "avulsa";

export type EntradaCategoria =
  | "hatch"
  | "sedan"
  | "suv"
  | "camionete"
  | "outro"
  | "avulsa";

export type SaidaCategoria =
  | "cozinha"
  | "funcionario"
  | "lava_jato"
  | "custos_operacionais"
  | "manutencao";

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
  categoria: EntradaCategoria | string;
  polimento: boolean;
  valor: number;
  desconto: number;
  placa: string | null;
  modelo: string | null;
  descricao: string | null;
  item_alimentacao_id: string | null;
  servico_lavagem_id: string | null;
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
  /** Entradas − saídas do dia */
  saldoDiario: number;
  /** Saldo diário + caixa inicial */
  valorEmCaixa: number;
}

export type FiltroRelatorio = "dias" | "semanal" | "mensal" | "periodo";

export interface ResumoPeriodoItem {
  nome: string;
  quantidade: number;
  valor: number;
}

export interface ResumoPeriodo {
  tipo: "semanal" | "mensal" | "periodo";
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
  /** Valores separados por origem (igual ao diário). */
  valorLavagens: number;
  valorRestaurante: number;
  valorAvulsa: number;
  /** Quantidade e valor por tipo de lavagem (SUV, hatch…). */
  servicosLavagem: ResumoPeriodoItem[];
  /** Gastos por categoria (cozinha, funcionário…). */
  gastosPorCategoria: ResumoPeriodoItem[];
}

export interface DiaComResumo extends Dia {
  totalEntradas: number;
  totalSaidas: number;
  lavagens: number;
  polimentos: number;
  outros: number;
}

export const PRECOS_LAVAGEM_PADRAO: Record<
  Exclude<EntradaCategoria, "outro" | "avulsa">,
  number
> = {
  hatch: 55,
  sedan: 55,
  suv: 70,
  camionete: 80,
};

/** @deprecated use preços do banco via buscarPrecosLavagem */
export const PRECOS_LAVAGEM = PRECOS_LAVAGEM_PADRAO;

export const PRECO_POLIMENTO_PADRAO = 10;
export const PRECO_POLIMENTO = PRECO_POLIMENTO_PADRAO;

export type PrecoLavagemChave =
  | "hatch"
  | "sedan"
  | "suv"
  | "camionete"
  | "polimento";

export interface PrecoLavagem {
  chave: PrecoLavagemChave;
  valor: number;
  updated_at?: string;
}

export type ItemAlimentacaoTipo = "bebida" | "comida" | "outro";

export interface ItemAlimentacao {
  id: string;
  nome: string;
  tipo: ItemAlimentacaoTipo;
  valor: number;
  ativo: boolean;
  created_at: string;
}

export interface ServicoLavagem {
  id: string;
  nome: string;
  valor: number;
  ativo: boolean;
  created_at: string;
}

export type MesaServicoStatus = "aberto" | "finalizado";

export interface Mesa {
  id: string;
  numero: number;
  created_at: string;
}

export interface MesaServico {
  id: string;
  mesa_id: string;
  dia_id: string;
  status: MesaServicoStatus;
  created_at: string;
  finalizado_at: string | null;
}

export interface MesaConsumo {
  id: string;
  servico_id: string;
  item_alimentacao_id: string;
  quantidade: number;
  valor_unitario: number;
  created_at: string;
  item?: ItemAlimentacao;
}

export interface MesaComStatus extends Mesa {
  servico: MesaServico | null;
  total: number;
  itensCount: number;
}

export const PRECO_CHAVES_LABELS: Record<PrecoLavagemChave, string> = {
  hatch: "Hatch/Sedan",
  sedan: "Sedan",
  suv: "SUV",
  camionete: "Camionete",
  polimento: "Polimento",
};

export const ITEM_ALIMENTACAO_TIPO_LABELS: Record<ItemAlimentacaoTipo, string> =
  {
    bebida: "Bebida",
    comida: "Comida",
    outro: "Outro",
  };

export const CATEGORIA_LABELS: Record<EntradaCategoria, string> = {
  hatch: "Hatch/Sedan",
  sedan: "Sedan",
  suv: "SUV",
  camionete: "Camionete",
  outro: "Restaurante",
  avulsa: "Entrada avulsa",
};

export const SAIDA_CATEGORIA_LABELS: Record<SaidaCategoria, string> = {
  cozinha: "Cozinha",
  funcionario: "Funcionário",
  lava_jato: "Lava-jato",
  custos_operacionais: "Custos operacionais",
  manutencao: "Manutenção",
};

export type FilaLavagemStatus =
  | "aguardando"
  | "em_andamento"
  | "finalizado"
  | "cancelado";

export interface ClienteVeiculo {
  id: string;
  placa: string;
  nome_proprietario: string;
  whatsapp: string;
  servico_preferido_id: string | null;
  visitas: number;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string;
  created_at: string;
  updated_at: string;
}

export interface FilaLavagemItem {
  id: string;
  cliente_veiculo_id: string | null;
  placa: string;
  nome_proprietario: string;
  whatsapp: string;
  servico_lavagem_id: string | null;
  servico_nome: string;
  servico_valor: number;
  polimento?: boolean;
  servico_valor_base?: number;
  servico_extra_valor?: number;
  servico_extra_descricao?: string | null;
  entrada_id?: string | null;
  status: FilaLavagemStatus;
  created_at: string;
  iniciado_at: string | null;
  finalizado_at: string | null;
}

export const FILA_STATUS_LABELS: Record<FilaLavagemStatus, string> = {
  aguardando: "Aguardando",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};
