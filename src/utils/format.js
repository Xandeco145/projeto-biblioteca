// Utilitários de data (formato dd/mm/aaaa) e moeda (R$) usados em todo o sistema.
// Todas as datas do protótipo são calculadas a partir da data real do computador,
// garantindo que prazos, atrasos e multas sejam sempre coerentes entre si.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const pad2 = (n) => String(n).padStart(2, '0');

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatBrDate(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function parseBrDate(brDateStr) {
  const [day, month, year] = String(brDateStr).split('/').map(Number);
  return new Date(year, month - 1, day);
}

export function todayBr() {
  return formatBrDate(startOfDay());
}

export function addDaysToBrDate(brDateStr, daysToAdd) {
  const date = parseBrDate(brDateStr);
  date.setDate(date.getDate() + daysToAdd);
  return formatBrDate(date);
}

// Data relativa a hoje (ex.: -3 = três dias atrás; +14 = daqui a 14 dias)
export function dateFromToday(offsetDays) {
  const date = startOfDay();
  date.setDate(date.getDate() + offsetDays);
  return formatBrDate(date);
}

// Diferença em dias corridos entre duas datas dd/mm/aaaa (to - from)
export function diffInDays(fromBr, toBr) {
  return Math.round((parseBrDate(toBr) - parseBrDate(fromBr)) / MS_PER_DAY);
}

export function compareBrDates(a, b) {
  return parseBrDate(a) - parseBrDate(b);
}

// "dd/mm" a partir de "dd/mm/aaaa"
export function shortBrDate(brDateStr) {
  return brDateStr ? String(brDateStr).slice(0, 5) : '—';
}

export function nowTime() {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

// R$ 1.234,56
export function formatCurrency(value) {
  const safe = Number(value) || 0;
  const [intPart, decPart] = Math.abs(safe).toFixed(2).split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${safe < 0 ? '-' : ''}R$ ${withThousands},${decPart}`;
}

// 72,4%
export function formatPercent(value, digits = 1) {
  return `${(Number(value) || 0).toFixed(digits).replace('.', ',')}%`;
}

// Converte "Hoje"/"Amanhã"/"dd/mm/aaaa" para exibição amigável
export function friendlyBrDate(brDateStr) {
  if (!brDateStr) return '—';
  const diff = diffInDays(todayBr(), brDateStr);
  if (diff === 0) return `hoje (${shortBrDate(brDateStr)})`;
  if (diff === 1) return `amanhã (${shortBrDate(brDateStr)})`;
  if (diff === -1) return `ontem (${shortBrDate(brDateStr)})`;
  return brDateStr;
}
