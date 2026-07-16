export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
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
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
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
