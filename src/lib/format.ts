export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formato curto para eixos/labels de gráficos (ex.: R$ 1,2 mil). */
export function formatCurrencyCompact(value: number): string {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1000) {
    return `R$ ${(n / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }
  return formatCurrency(n);
}

export function formatDate(date: string | Date): string {
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Data pura (YYYY-MM-DD) — meio-dia local evita virar o dia anterior
    d = new Date(`${date}T12:00:00`);
  } else {
    // Timestamp ISO completo (created_at / updated_at do Supabase)
    d = new Date(date);
  }

  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatDateLong(date: string | Date): string {
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    d = new Date(`${date}T12:00:00`);
  } else {
    d = new Date(date);
  }

  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatLiveClock(date: Date): {
  data: string;
  hora: string;
  weekday: string;
} {
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(date);

  const data = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

  return { data, hora, weekday };
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

/** Converte número (ex.: 350.5) para o mesmo formato do input mascarado. */
export function currencyNumberToInput(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return safe.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function maskCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  const number = parseInt(digits || "0", 10) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatWeekRange(inicio: Date, fim: Date): string {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  return `${fmt.format(inicio)} – ${fmt.format(fim)}`;
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function inicioSemana(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fimSemana(date: Date): Date {
  const inicio = inicioSemana(date);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  return fim;
}

export function inicioMes(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function fimMes(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
