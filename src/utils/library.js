// Regras puras do domínio (sem estado), reutilizadas pelo contexto e pelas telas.
import { BUSINESS_RULES } from '../data/mockData';
import { compareBrDates, parseBrDate, todayBr } from './format';

// RF08: R$ 5,00 fixo + R$ 2,00 por dia de atraso
export function calculateFine(daysOverdue) {
  if (!daysOverdue || daysOverdue <= 0) return 0;
  return BUSINESS_RULES.FINE_BASE + daysOverdue * BUSINESS_RULES.FINE_PER_DAY;
}

// RF10: prazo de retirada da reserva convertido em dias (48h = 2 dias)
export function reservationHoldDays() {
  return Math.max(1, Math.ceil(BUSINESS_RULES.RESERVATION_HOLD_HOURS / 24));
}

// Reserva pronta cujo prazo (data + horário de fechamento do balcão) já passou
export function isPickupExpired(deadlineBr) {
  if (!deadlineBr) return false;
  const limit = parseBrDate(deadlineBr);
  limit.setHours(BUSINESS_RULES.PICKUP_CLOSING_HOUR, 0, 0, 0);
  return new Date() > limit;
}

// Resumo de disponibilidade de uma obra a partir da situação de cada exemplar (tombo)
export function getBookAvailability(book) {
  const count = (status) => book.copies.filter((c) => c.status === status).length;
  const available = count('Disponível');
  const loaned = count('Emprestado');
  const reserved = count('Reservado');
  const repair = count('Em reparo');
  const local = count('Consulta local');
  const writtenOff = count('Baixa contábil');
  const total = book.copies.length;
  const isLocalOnly = book.circulationType === 'Consulta Local';

  // A fila de espera só faz sentido se algum exemplar voltará a circular
  const canQueue = !isLocalOnly && available === 0 && loaned + reserved + repair > 0;

  const dueDates = book.copies
    .filter((c) => c.status === 'Emprestado' && c.dueDate)
    .map((c) => c.dueDate)
    .sort(compareBrDates);
  const today = todayBr();
  const upcoming = dueDates.filter((d) => compareBrDates(d, today) >= 0);
  const nextReturnDate = upcoming[0] || dueDates[0] || null;

  let statusLabel = 'Indisponível';
  if (isLocalOnly) statusLabel = 'Consulta local';
  else if (available > 0) statusLabel = 'Disponível';
  else if (loaned + reserved > 0) statusLabel = 'Emprestado';

  return {
    available,
    loaned,
    reserved,
    repair,
    local,
    writtenOff,
    total,
    isLocalOnly,
    canQueue,
    nextReturnDate,
    statusLabel,
  };
}
