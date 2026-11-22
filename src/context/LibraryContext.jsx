import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import {
  BUSINESS_RULES,
  INITIAL_BOOKS,
  INITIAL_CATEGORIES,
  INITIAL_FINES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_LOANS,
  INITIAL_LOAN_HISTORY,
  INITIAL_NOTIFICATIONS,
  INITIAL_RESERVATIONS,
  INITIAL_USERS,
} from '../data/mockData';
import {
  addDaysToBrDate,
  compareBrDates,
  diffInDays,
  formatCurrency,
  nowTime,
  todayBr,
} from '../utils/format';
import {
  calculateFine,
  getBookAvailability,
  isPickupExpired,
  reservationHoldDays,
} from '../utils/library';

const LibraryContext = createContext(null);

export const ROLE_LABELS = {
  aluno: 'Estudante',
  bibliotecario: 'Bibliotecário',
  admin: 'Gestor / Admin',
};

export const INSTITUTIONAL_DOMAINS = ['@rede.ulbra.br', '@ulbra.br'];

const PICKUP_HOUR = BUSINESS_RULES.PICKUP_CLOSING_HOUR;
const COVER_COLORS = ['#0B303D', '#185266', '#1B4D3E', '#2E5B6B', '#0F4C81', '#8B1E1E', '#1E2528'];

const numericId = (id) => Number(String(id).replace(/\D/g, '')) || 0;
const maxNumeric = (ids) => ids.reduce((max, id) => Math.max(max, numericId(id)), 0);
const sumAmounts = (list) => list.reduce((acc, f) => acc + f.amount, 0);
const isbnDigits = (isbn) => String(isbn || '').replace(/[^0-9Xx]/g, '').toUpperCase();

// Ordem da fila de espera: data da solicitação e, no mesmo dia, ordem de registro
const sortQueue = (a, b) =>
  compareBrDates(a.requestDate, b.requestDate) || numericId(a.id) - numericId(b.id);

const makeCoverShort = (title) =>
  title
    .replace(/[:—–-].*$/, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ')
    .toUpperCase()
    .slice(0, 16);

const shelfState = (book, copy = {}) => ({
  type: 'Circulação Livre',
  location: copy.previousLocation || book.location,
  status: 'Disponível',
  holder: null,
  dueDate: null,
  previousType: undefined,
  previousLocation: undefined,
});

const reservedState = (userName, deadline) => ({
  type: 'Reserva Balcão',
  location: 'Armário Balcão A',
  status: 'Reservado',
  holder: userName,
  dueDate: deadline,
});

export function LibraryProvider({ children }) {
  // Sessão e navegação
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTabState] = useState('Dashboard');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [pageIntent, setPageIntent] = useState(null);

  // Dados (estado global em memória)
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [baseUsers, setBaseUsers] = useState(INITIAL_USERS);
  const [baseLoans, setBaseLoans] = useState(INITIAL_LOANS);
  const [loanHistory, setLoanHistory] = useState(INITIAL_LOAN_HISTORY);
  const [baseReservations, setBaseReservations] = useState(INITIAL_RESERVATIONS);
  const [fineRecords, setFineRecords] = useState(INITIAL_FINES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [extraInventory, setExtraInventory] = useState(INITIAL_INVENTORY_ITEMS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Sequências de identificadores (sem números aleatórios → sem códigos duplicados)
  const seq = useRef(null);
  if (seq.current === null) {
    seq.current = {
      reservation: maxNumeric(INITIAL_RESERVATIONS.map((r) => r.id)),
      fine: maxNumeric(INITIAL_FINES.map((f) => f.id)),
      loan: maxNumeric(INITIAL_LOANS.map((l) => l.id)),
      history: maxNumeric(INITIAL_LOAN_HISTORY.map((h) => h.id)),
      notification: maxNumeric(INITIAL_NOTIFICATIONS.map((n) => n.id)),
      user: maxNumeric(INITIAL_USERS.map((u) => u.id)),
      book: maxNumeric(INITIAL_BOOKS.map((b) => b.id)),
      category: maxNumeric(INITIAL_CATEGORIES.map((c) => c.id)),
    };
  }
  const nextSeq = (key) => {
    seq.current[key] += 1;
    return seq.current[key];
  };

  const today = todayBr();

  // ---------------------------------------------------------------------------
  // Dados derivados (calculados automaticamente a cada alteração)
  // ---------------------------------------------------------------------------

  // RF05/RF08: dias de atraso e situação calculados a partir da data de devolução
  const loans = useMemo(
    () =>
      baseLoans.map((loan) => {
        const daysOverdue = Math.max(0, diffInDays(loan.dueDate, today));
        return { ...loan, daysOverdue, status: daysOverdue > 0 ? 'Em Atraso' : 'No prazo' };
      }),
    [baseLoans, today]
  );

  // RF08: multa acumulada de empréstimos ainda em atraso (consolidada na devolução)
  const accruingFines = useMemo(
    () =>
      loans
        .filter((l) => l.daysOverdue > 0)
        .map((l) => ({
          id: `apuracao-${l.id}`,
          loanId: l.id,
          accruing: true,
          userId: l.userId,
          userName: l.userName,
          userMatricula: l.userMatricula,
          bookTitle: l.bookTitle,
          tombo: l.tombo,
          daysOverdue: l.daysOverdue,
          amount: calculateFine(l.daysOverdue),
          status: 'Pendente',
          date: l.dueDate,
          paidDate: null,
        })),
    [loans]
  );

  const fines = useMemo(() => [...accruingFines, ...fineRecords], [accruingFines, fineRecords]);

  // RF05: usuário suspenso enquanto houver devolução em atraso ou multa pendente
  const users = useMemo(
    () =>
      baseUsers.map((u) => {
        const userLoans = loans.filter((l) => l.userId === u.id);
        const overdueLoans = userLoans.filter((l) => l.daysOverdue > 0);
        const pendingRecords = fineRecords.filter((f) => f.userId === u.id && f.status === 'Pendente');
        const pendingAll = fines.filter((f) => f.userId === u.id && f.status === 'Pendente');
        const reasons = [];
        if (overdueLoans.length > 0) {
          reasons.push(
            overdueLoans.length === 1
              ? '1 devolução em atraso'
              : `${overdueLoans.length} devoluções em atraso`
          );
        }
        if (pendingRecords.length > 0) {
          reasons.push(`multa pendente de ${formatCurrency(sumAmounts(pendingRecords))}`);
        }
        return {
          ...u,
          status: reasons.length > 0 ? 'Suspenso' : 'Ativo',
          blockReason: reasons.length > 0 ? reasons.join(' e ') : null,
          activeLoansCount: userLoans.length,
          overdueLoansCount: overdueLoans.length,
          pendingFinesCount: pendingRecords.length,
          pendingAmount: sumAmounts(pendingAll),
        };
      }),
    [baseUsers, loans, fineRecords, fines]
  );

  // RF10: posição dinâmica na fila de espera de cada obra
  // ("today" nas dependências garante o recálculo da expiração na virada do dia)
  const reservations = useMemo(() => {
    const positions = {};
    const counters = {};
    baseReservations
      .filter((r) => r.status === 'Em espera')
      .sort(sortQueue)
      .forEach((r) => {
        counters[r.bookId] = (counters[r.bookId] || 0) + 1;
        positions[r.id] = counters[r.bookId];
      });
    return baseReservations.map((r) => ({
      ...r,
      queuePosition: r.status === 'Em espera' ? positions[r.id] : null,
      pickupExpired: r.status === 'Pronta para retirada' && isPickupExpired(r.pickupDeadline),
    }));
  }, [baseReservations, today]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || null,
    [users, currentUserId]
  );

  // Inventário patrimonial: todos os exemplares do catálogo + TCCs, periódicos e baixas
  const inventoryItems = useMemo(() => {
    const copyItems = books.flatMap((b) =>
      b.copies.map((c) => {
        let detail = `ISBN ${b.isbn}`;
        if (c.status === 'Emprestado') detail = `Emprestado para ${c.holder} (dev. ${c.dueDate})`;
        else if (c.status === 'Reservado') detail = `Reservado para ${c.holder} (retirada até ${c.dueDate})`;
        else if ((c.status === 'Em reparo' || c.status === 'Baixa contábil') && c.holder) detail = c.holder;
        return {
          tombo: c.tombo,
          materialType: 'Livro',
          bookId: b.id,
          title: `${b.title} (${b.edition})`,
          subtitle: `${b.author} • ${detail}`,
          location: c.location,
          status: c.status,
        };
      })
    );
    return [...extraInventory, ...copyItems];
  }, [books, extraInventory]);

  // Alertas operacionais automáticos da equipe (atualizados em tempo real)
  const staffAlerts = useMemo(() => {
    const overdue = loans
      .filter((l) => l.daysOverdue > 0)
      .map((l) => ({
        id: `alerta-atraso-${l.id}`,
        type: 'danger',
        title: 'Devolução em atraso detectada',
        message: `${l.bookTitle} (${l.userName}) está com ${l.daysOverdue} dia(s) de atraso. Multa acumulada: ${formatCurrency(calculateFine(l.daysOverdue))}.`,
      }));
    const pickups = reservations
      .filter((r) => r.status === 'Pronta para retirada')
      .map((r) => {
        let title = 'Reserva aguardando retirada';
        if (r.pickupExpired) title = 'Prazo de retirada expirado';
        else if (r.pickupDeadline === today) title = 'Retirada de reserva vence hoje';
        return {
          id: `alerta-retirada-${r.id}`,
          type: r.pickupExpired ? 'danger' : 'warning',
          title,
          message: `${r.bookTitle} (Exemplar ${r.tomboAllocated}) • ${r.userName} até ${r.pickupDeadline} às ${PICKUP_HOUR}h.`,
        };
      });
    const dueToday = loans
      .filter((l) => l.daysOverdue === 0 && l.dueDate === today)
      .map((l) => ({
        id: `alerta-hoje-${l.id}`,
        type: 'info',
        title: 'Devolução prevista para hoje',
        message: `${l.bookTitle} (${l.userName}) • Tombo ${l.tombo}.`,
      }));
    return [...overdue, ...pickups, ...dueToday];
  }, [loans, reservations, today]);

  // ---------------------------------------------------------------------------
  // Utilidades internas
  // ---------------------------------------------------------------------------

  const showToast = (message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  const userNote = (userId, type, title, message) => ({ targetRole: 'aluno', userId, type, title, message });
  const staffNote = (type, title, message) => ({ targetRole: 'staff', type, title, message });

  const pushNotifications = (items) => {
    if (!items.length) return;
    const stamped = items.map((n) => ({
      id: `notif-${nextSeq('notification')}`,
      time: `Hoje, ${nowTime()}`,
      read: false,
      ...n,
    }));
    setNotifications((prev) => [...stamped, ...prev]);
  };

  const patchCopy = (bookId, tombo, patch) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id !== bookId
          ? b
          : { ...b, copies: b.copies.map((c) => (c.tombo === tombo ? { ...c, ...patch } : c)) }
      )
    );
  };

  const getWaitingQueue = (bookId, excludeReservationId = null) =>
    reservations
      .filter((r) => r.bookId === bookId && r.status === 'Em espera' && r.id !== excludeReservationId)
      .sort((a, b) => a.queuePosition - b.queuePosition);

  // Encaminha um exemplar que voltou a circular para o 1º leitor da fila (RF10)
  const allocateToQueue = (book, tombo, excludeReservationId = null) => {
    const next = getWaitingQueue(book.id, excludeReservationId)[0];
    if (!next) return null;
    const deadline = addDaysToBrDate(today, reservationHoldDays());
    patchCopy(book.id, tombo, { ...reservedState(next.userName, deadline), previousType: undefined, previousLocation: undefined });
    setBaseReservations((prev) =>
      prev.map((r) =>
        r.id === next.id
          ? { ...r, status: 'Pronta para retirada', tomboAllocated: tombo, readyDate: today, pickupDeadline: deadline }
          : r
      )
    );
    return { ...next, tomboAllocated: tombo, pickupDeadline: deadline };
  };

  const readyNotification = (reservation, bookTitle, tombo) =>
    userNote(
      reservation.userId,
      'success',
      'Reserva disponível para retirada',
      `O exemplar ${tombo} de "${bookTitle}" está separado para você no Balcão da Biblioteca Central até ${reservation.pickupDeadline} às ${PICKUP_HOUR}h.`
    );

  // ---------------------------------------------------------------------------
  // Navegação e sessão
  // ---------------------------------------------------------------------------

  // Troca de aba. "intent" permite abrir diretamente um modal/filtro na tela de destino.
  const setActiveTab = (tab, intent = null) => {
    setActiveTabState(tab);
    setSelectedBookId(null);
    setPageIntent(intent);
  };

  const clearPageIntent = () => setPageIntent(null);

  const startSession = (userId) => {
    setCurrentUserId(userId);
    setActiveTabState('Dashboard');
    setSelectedBookId(null);
    setPageIntent(null);
  };

  // Autenticação institucional: apenas e-mails @rede.ulbra.br / @ulbra.br cadastrados
  const loginWithEmail = (emailInput) => {
    const cleanEmail = String(emailInput || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, error: 'Informe o seu e-mail institucional.' };
    }
    if (!INSTITUTIONAL_DOMAINS.some((domain) => cleanEmail.endsWith(domain))) {
      return {
        ok: false,
        error: 'Utilize uma credencial institucional válida (@rede.ulbra.br ou @ulbra.br).',
      };
    }
    const found = baseUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return {
        ok: false,
        error:
          'E-mail institucional não encontrado no cadastro da biblioteca. Solicite o seu cadastro no balcão de atendimento ou utilize o acesso rápido por perfil.',
      };
    }
    startSession(found.id);
    return { ok: true };
  };

  const loginAsUser = (userId) => {
    if (baseUsers.some((u) => u.id === userId)) startSession(userId);
  };

  const logout = () => {
    setCurrentUserId(null);
    setActiveTabState('Dashboard');
    setSelectedBookId(null);
    setPageIntent(null);
  };

  // ---------------------------------------------------------------------------
  // Circulação: renovação, reservas, empréstimos e devoluções
  // ---------------------------------------------------------------------------

  // RF09: Renovar empréstimo (+14 dias, até 5 vezes, sem fila de espera e sem pendências)
  const renewLoan = (loanId) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, error: 'Empréstimo não encontrado.' };
    const user = users.find((u) => u.id === loan.userId);

    if (loan.daysOverdue > 0) {
      return {
        ok: false,
        error: `Renovação bloqueada (RF05): este exemplar está com ${loan.daysOverdue} dia(s) de atraso. Regularize a devolução no balcão.`,
      };
    }
    if (user && user.status === 'Suspenso') {
      return {
        ok: false,
        error: `Renovação bloqueada (RF05): existem pendências no cadastro (${user.blockReason}).`,
      };
    }
    if (reservations.some((r) => r.bookId === loan.bookId && r.status === 'Em espera')) {
      return {
        ok: false,
        error: 'Renovação bloqueada (RF09): há leitores na fila de espera para esta obra.',
      };
    }
    if (loan.renewalsCount >= BUSINESS_RULES.MAX_RENEWALS) {
      return {
        ok: false,
        error: `Limite máximo de ${BUSINESS_RULES.MAX_RENEWALS} renovações atingido (RF09). Devolva o exemplar no balcão.`,
      };
    }

    const previousDueDate = loan.dueDate;
    const newDueDate = addDaysToBrDate(previousDueDate, BUSINESS_RULES.LOAN_DAYS);
    const nextCount = loan.renewalsCount + 1;

    setBaseLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, dueDate: newDueDate, renewalsCount: nextCount } : l))
    );
    patchCopy(loan.bookId, loan.tombo, { dueDate: newDueDate });
    pushNotifications([
      userNote(
        loan.userId,
        'success',
        'Renovação confirmada',
        `"${loan.bookTitle}" (${loan.tombo}) renovado até ${newDueDate}. Renovações utilizadas: ${nextCount} de ${BUSINESS_RULES.MAX_RENEWALS}.`
      ),
    ]);

    return {
      ok: true,
      data: {
        bookTitle: loan.bookTitle,
        tombo: loan.tombo,
        previousDueDate,
        newDueDate,
        renewalsCount: nextCount,
      },
    };
  };

  // RF10: Reservar obra disponível (retirada em 48h) ou entrar na fila de espera
  const createReservation = ({ bookId, userId, origin = 'portal' }) => {
    const book = books.find((b) => b.id === bookId);
    const user = users.find((u) => u.id === userId);
    const byStaff = origin === 'balcao';
    const subject = byStaff ? 'O leitor' : 'Você';

    if (!book || !user) return { ok: false, error: 'Selecione uma obra e um leitor válidos.' };
    if (user.role !== 'aluno') {
      return { ok: false, error: 'Reservas são exclusivas para leitores (estudantes e docentes).' };
    }

    const availability = getBookAvailability(book);
    if (availability.isLocalOnly) {
      return {
        ok: false,
        error: 'Obra de consulta local: uso exclusivo no recinto, não disponível para reserva.',
      };
    }
    if (reservations.some((r) => r.bookId === bookId && r.userId === userId)) {
      return { ok: false, error: `${subject} já possui uma reserva ou posição na fila para esta obra.` };
    }
    if (loans.some((l) => l.bookId === bookId && l.userId === userId)) {
      return { ok: false, error: `${subject} já está com um exemplar desta obra emprestado.` };
    }

    const availableCopy = book.copies.find((c) => c.status === 'Disponível');
    if (!availableCopy && !availability.canQueue) {
      return { ok: false, error: 'Não há exemplares circulantes desta obra no momento.' };
    }

    const id = `R-${String(nextSeq('reservation')).padStart(4, '0')}`;
    const base = {
      id,
      bookId,
      bookTitle: book.title,
      author: book.author,
      userId: user.id,
      userName: user.name,
      userMatricula: user.matricula,
      requestDate: today,
    };

    if (availableCopy) {
      const deadline = addDaysToBrDate(today, reservationHoldDays());
      patchCopy(bookId, availableCopy.tombo, reservedState(user.name, deadline));
      const newRes = {
        ...base,
        readyDate: today,
        pickupDeadline: deadline,
        status: 'Pronta para retirada',
        tomboAllocated: availableCopy.tombo,
      };
      setBaseReservations((prev) => [newRes, ...prev]);

      const notes = [
        userNote(
          user.id,
          'success',
          'Reserva confirmada',
          `O exemplar ${availableCopy.tombo} de "${book.title}" está separado no balcão até ${deadline} às ${PICKUP_HOUR}h (reserva ${id}).`
        ),
      ];
      if (!byStaff) {
        notes.push(
          staffNote(
            'info',
            'Nova reserva pelo portal',
            `${user.name} reservou "${book.title}" (${id}). Exemplar ${availableCopy.tombo} separado no Armário Balcão A.`
          )
        );
      }
      pushNotifications(notes);
      showToast(
        byStaff
          ? `Reserva ${id} registrada: exemplar ${availableCopy.tombo} separado para ${user.name}.`
          : `Reserva confirmada! Exemplar ${availableCopy.tombo} separado no balcão até ${deadline} às ${PICKUP_HOUR}h.`
      );
      return { ok: true, reservation: newRes };
    }

    const position = reservations.filter((r) => r.bookId === bookId && r.status === 'Em espera').length + 1;
    const newRes = { ...base, readyDate: null, pickupDeadline: null, status: 'Em espera', tomboAllocated: null };
    setBaseReservations((prev) => [newRes, ...prev]);
    const forecast = availability.nextReturnDate
      ? ` Previsão de liberação: ${availability.nextReturnDate}.`
      : '';
    pushNotifications([
      userNote(
        user.id,
        'info',
        'Entrada na fila de espera',
        `Você ocupa o ${position}º lugar na fila de espera para "${book.title}".${forecast}`
      ),
    ]);
    showToast(
      byStaff
        ? `${user.name} entrou na fila de espera (${position}º lugar) para "${book.title}".`
        : `Você entrou na fila de espera (${position}º lugar) para "${book.title}".`
    );
    return { ok: true, reservation: { ...newRes, queuePosition: position } };
  };

  // Cancelamento: o exemplar separado vai para o próximo da fila ou volta ao acervo
  const cancelReservation = (reservationId, { byStaff = false } = {}) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return { ok: false, error: 'Reserva não encontrada.' };
    const book = books.find((b) => b.id === target.bookId);

    setBaseReservations((prev) => prev.filter((r) => r.id !== reservationId));

    const notes = [];
    if (byStaff) {
      notes.push(
        userNote(
          target.userId,
          'warning',
          'Reserva cancelada pela biblioteca',
          `A reserva ${target.id} de "${target.bookTitle}" foi cancelada pelo balcão${target.pickupExpired ? ' (prazo de retirada expirado)' : ''}.`
        )
      );
    }

    if (target.status === 'Pronta para retirada' && target.tomboAllocated && book) {
      const next = allocateToQueue(book, target.tomboAllocated, reservationId);
      if (next) {
        notes.push(readyNotification(next, book.title, target.tomboAllocated));
        showToast(
          `Reserva ${reservationId} cancelada. Exemplar ${target.tomboAllocated} repassado para ${next.userName} (1º da fila).`
        );
      } else {
        const copy = book.copies.find((c) => c.tombo === target.tomboAllocated);
        patchCopy(book.id, target.tomboAllocated, shelfState(book, copy));
        showToast(`Reserva ${reservationId} cancelada e exemplar ${target.tomboAllocated} devolvido ao acervo.`);
      }
    } else {
      showToast(`Solicitação ${reservationId} removida da fila de espera.`);
    }

    pushNotifications(notes);
    return { ok: true };
  };

  // RF03, RF04, RF05: Registrar novo empréstimo (14 dias, limite de 2 livros, sem pendências)
  const registerLoan = ({ bookId, tombo = null, userId, reservationIdToFulfill = null }) => {
    const book = books.find((b) => b.id === bookId);
    const user = users.find((u) => u.id === userId);
    if (!book || !user) return { ok: false, error: 'Selecione uma obra e um leitor válidos.' };
    if (user.role !== 'aluno') {
      return { ok: false, error: 'Empréstimos são destinados a leitores (estudantes e docentes).' };
    }

    if (user.overdueLoansCount > 0) {
      return {
        ok: false,
        error: `RF05: Empréstimo bloqueado. ${user.name} possui devolução em atraso — registre a devolução e a multa antes de um novo empréstimo.`,
      };
    }
    if (user.pendingFinesCount > 0) {
      return {
        ok: false,
        error: `RF05: Empréstimo bloqueado. ${user.name} possui multa pendente de ${formatCurrency(user.pendingAmount)}. Quite o débito no balcão para liberar.`,
      };
    }
    if (user.activeLoansCount >= BUSINESS_RULES.MAX_ACTIVE_LOANS) {
      return {
        ok: false,
        error: `RF04: Limite atingido. ${user.name} já possui ${user.activeLoansCount} de ${BUSINESS_RULES.MAX_ACTIVE_LOANS} livros permitidos.`,
      };
    }
    if (loans.some((l) => l.userId === userId && l.bookId === bookId)) {
      return { ok: false, error: `${user.name} já está com um exemplar desta obra.` };
    }

    const reservation = reservationIdToFulfill
      ? reservations.find((r) => r.id === reservationIdToFulfill)
      : reservations.find(
          (r) => r.bookId === bookId && r.userId === userId && r.status === 'Pronta para retirada'
        );
    if (reservationIdToFulfill && (!reservation || reservation.status !== 'Pronta para retirada')) {
      return { ok: false, error: 'Reserva não encontrada ou ainda não está pronta para retirada.' };
    }

    let chosenCopy = null;
    if (reservation && reservation.status === 'Pronta para retirada') {
      // Leitor com reserva pronta: utiliza o exemplar que estava separado para ele
      chosenCopy = book.copies.find((c) => c.tombo === reservation.tomboAllocated) || null;
    } else if (tombo) {
      chosenCopy = book.copies.find((c) => c.tombo === tombo) || null;
      if (!chosenCopy || chosenCopy.status !== 'Disponível') {
        return { ok: false, error: `O exemplar ${tombo} não está disponível para empréstimo.` };
      }
    } else {
      chosenCopy = book.copies.find((c) => c.status === 'Disponível') || null;
    }

    if (!chosenCopy) {
      if (book.circulationType === 'Consulta Local') {
        return { ok: false, error: 'Obra de consulta local: uso exclusivo no recinto (não circula).' };
      }
      const queueSize = getWaitingQueue(bookId).length;
      return {
        ok: false,
        error: `Não há exemplar disponível para retirada${queueSize ? ` (${queueSize} leitor(es) na fila de espera)` : ''}. Registre uma reserva para incluir o leitor na fila.`,
      };
    }

    const checkoutDate = today;
    const dueDate = addDaysToBrDate(today, BUSINESS_RULES.LOAN_DAYS);

    patchCopy(bookId, chosenCopy.tombo, {
      type: 'Circulação Livre',
      location: 'Em circulação',
      status: 'Emprestado',
      holder: user.name,
      dueDate,
    });
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, totalLoans: (b.totalLoans || 0) + 1 } : b))
    );

    const newLoan = {
      id: `loan-${nextSeq('loan')}`,
      bookId,
      bookTitle: book.title,
      author: book.author,
      tombo: chosenCopy.tombo,
      userId: user.id,
      userName: user.name,
      userMatricula: user.matricula,
      userType: user.roleLabel === 'Docente' ? 'Docente' : 'Aluno',
      checkoutDate,
      dueDate,
      renewalsCount: 0,
    };
    setBaseLoans((prev) => [newLoan, ...prev]);

    // Reserva ou posição na fila do leitor para esta obra é concluída com o empréstimo
    setBaseReservations((prev) => prev.filter((r) => !(r.bookId === bookId && r.userId === userId)));

    pushNotifications([
      userNote(
        user.id,
        'info',
        'Empréstimo registrado',
        `"${book.title}" (${chosenCopy.tombo}) emprestado em ${checkoutDate}. Devolução até ${dueDate} (RF03).`
      ),
    ]);
    const reservationText = reservation ? ` Reserva ${reservation.id} efetivada.` : '';
    showToast(
      `Empréstimo registrado! Tombo ${chosenCopy.tombo} para ${user.name} (dev.: ${dueDate}).${reservationText}`
    );
    return { ok: true, loan: newLoan, reservation: reservation || null };
  };

  // RF06 e RF08: devolução, vistoria física, multa automática e encaminhamento para a fila
  const returnLoan = ({ loanId, condition = 'Em Perfeito Estado', fineAction = 'paid_now' }) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, error: 'Empréstimo não encontrado.' };
    const book = books.find((b) => b.id === loan.bookId);
    const notes = [];

    let fine = null;
    const fineAmount = calculateFine(loan.daysOverdue);
    if (fineAmount > 0) {
      const paid = fineAction === 'paid_now';
      fine = {
        id: `MUL-${String(nextSeq('fine')).padStart(3, '0')}`,
        userId: loan.userId,
        userName: loan.userName,
        userMatricula: loan.userMatricula,
        bookTitle: loan.bookTitle,
        tombo: loan.tombo,
        daysOverdue: loan.daysOverdue,
        amount: fineAmount,
        status: paid ? 'Quitada' : 'Pendente',
        date: today,
        paidDate: paid ? today : null,
      };
      setFineRecords((prev) => [fine, ...prev]);
      notes.push(
        paid
          ? userNote(
              loan.userId,
              'info',
              'Multa quitada no balcão',
              `Multa ${fine.id} de ${formatCurrency(fineAmount)} (${loan.daysOverdue} dia(s) de atraso) quitada na devolução de "${loan.bookTitle}".`
            )
          : userNote(
              loan.userId,
              'danger',
              'Multa pendente',
              `Multa ${fine.id} de ${formatCurrency(fineAmount)} lançada pela devolução em atraso de "${loan.bookTitle}". Novos empréstimos e renovações ficam bloqueados até a quitação (RF05).`
            )
      );
    }

    setBaseLoans((prev) => prev.filter((l) => l.id !== loanId));
    setLoanHistory((prev) => [
      {
        id: `hist-${nextSeq('history')}`,
        bookId: loan.bookId,
        bookTitle: loan.bookTitle,
        tombo: loan.tombo,
        userId: loan.userId,
        userName: loan.userName,
        checkoutDate: loan.checkoutDate,
        dueDate: loan.dueDate,
        returnDate: today,
        daysOverdue: loan.daysOverdue,
        fineId: fine ? fine.id : null,
        condition,
      },
      ...prev,
    ]);

    let nextReservation = null;
    if (book) {
      if (condition === 'Avariado / Danificado') {
        patchCopy(book.id, loan.tombo, {
          type: 'Restauração',
          previousType: 'Circulação Livre',
          previousLocation: book.location,
          location: 'Bancada de Restauro',
          status: 'Em reparo',
          holder: 'Avaria detectada na devolução',
          dueDate: null,
        });
      } else if (condition === 'Extraviado / Perda') {
        patchCopy(book.id, loan.tombo, {
          type: 'Baixa',
          location: '— Fora de estante',
          status: 'Baixa contábil',
          holder: 'Extraviado pelo leitor',
          dueDate: null,
        });
      } else {
        nextReservation = allocateToQueue(book, loan.tombo);
        if (!nextReservation) patchCopy(book.id, loan.tombo, shelfState(book));
      }
    }

    if (nextReservation) notes.push(readyNotification(nextReservation, loan.bookTitle, loan.tombo));
    pushNotifications(notes);

    const fineText = fine
      ? ` Multa de ${formatCurrency(fine.amount)} ${fine.status === 'Quitada' ? 'quitada' : 'lançada como pendente'}.`
      : '';
    if (nextReservation) {
      showToast(
        `Devolução concluída! Exemplar reservado automaticamente para ${nextReservation.userName} (1º da fila).${fineText}`
      );
    } else {
      showToast(`Devolução do tombo ${loan.tombo} registrada com sucesso.${fineText}`);
    }
    return { ok: true, fine, nextReservation };
  };

  const payFine = (fineId) => {
    const target = fineRecords.find((f) => f.id === fineId);
    if (!target) return { ok: false, error: 'Multa não encontrada.' };
    if (target.status !== 'Pendente') return { ok: false, error: 'Esta multa já está quitada.' };

    setFineRecords((prev) =>
      prev.map((f) => (f.id === fineId ? { ...f, status: 'Quitada', paidDate: today } : f))
    );
    pushNotifications([
      userNote(
        target.userId,
        'success',
        'Multa quitada',
        `Multa ${fineId} de ${formatCurrency(target.amount)} quitada no balcão. Obrigado por regularizar o seu cadastro.`
      ),
    ]);

    const user = users.find((u) => u.id === target.userId);
    const stillBlocked = user && (user.overdueLoansCount > 0 || user.pendingFinesCount > 1);
    showToast(
      `Multa ${fineId} (${formatCurrency(target.amount)}) quitada!${stillBlocked ? ' O leitor ainda possui outras pendências.' : ' Cadastro regularizado.'}`
    );
    return { ok: true };
  };

  // ---------------------------------------------------------------------------
  // Cadastros: obras, inventário, categorias e usuários
  // ---------------------------------------------------------------------------

  // RF01: Cadastrar nova obra e gerar os tombos dos exemplares
  const addBook = (bookData) => {
    const title = String(bookData.title || '').trim();
    const author = String(bookData.author || '').trim();
    const publisher = String(bookData.publisher || '').trim();
    const isbn = String(bookData.isbn || '').trim();
    if (!title || !author || !publisher || !isbn) {
      return { ok: false, error: 'Preencha título, autor(es), editora e ISBN.' };
    }
    const digits = isbnDigits(isbn);
    if (digits.length !== 10 && digits.length !== 13) {
      return { ok: false, error: 'ISBN inválido: informe 10 ou 13 dígitos.' };
    }
    if (books.some((b) => isbnDigits(b.isbn) === digits)) {
      return { ok: false, error: 'Já existe uma obra cadastrada com este ISBN.' };
    }
    const year = Number(bookData.year);
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isInteger(year) || year < 1450 || year > maxYear) {
      return { ok: false, error: `Ano de publicação inválido (informe um ano entre 1450 e ${maxYear}).` };
    }
    const qty = Number(bookData.copiesCount);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return { ok: false, error: 'A quantidade de exemplares deve estar entre 1 e 20.' };
    }

    const category = categories.find((c) => c.name === bookData.category);
    const allTombos = [
      ...books.flatMap((b) => b.copies.map((c) => c.tombo)),
      ...extraInventory.map((i) => i.tombo),
    ];
    const maxBase = allTombos.reduce((max, t) => {
      const match = /^TB-(\d+)-/.exec(t);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const baseTombo = `TB-${String(maxBase + 1).padStart(5, '0')}`;
    const isLocal = bookData.circulationType === 'Consulta Local';
    const location = String(bookData.location || '').trim() || 'Estante A • Prat. 1';

    const copies = Array.from({ length: qty }, (_, idx) => ({
      tombo: `${baseTombo}-${idx + 1}`,
      type: isLocal ? 'Consulta Local' : 'Circulação Livre',
      location,
      status: isLocal ? 'Consulta local' : 'Disponível',
      holder: isLocal ? 'Uso exclusivo no recinto' : null,
      dueDate: null,
    }));

    const newBook = {
      id: `book-${nextSeq('book')}`,
      title,
      author,
      publisher,
      year,
      edition: String(bookData.edition || '').trim() || '1ª Edição',
      isbn,
      category: bookData.category,
      cdd: String(bookData.cdd || '').trim() || category?.cdd || '000',
      location,
      sector: String(bookData.sector || '').trim() || 'Acervo Geral',
      coverColor: COVER_COLORS[books.length % COVER_COLORS.length],
      coverShort: makeCoverShort(title),
      circulationType: isLocal ? 'Consulta Local' : 'Circulação Livre',
      totalLoans: 0,
      copies,
    };

    setBooks((prev) => [newBook, ...prev]);
    pushNotifications([
      staffNote(
        'info',
        'Nova obra catalogada',
        `"${title}" cadastrada com ${qty} exemplar(es): ${copies[0].tombo}${qty > 1 ? ` a ${copies[qty - 1].tombo}` : ''}.`
      ),
    ]);
    showToast(`Obra "${title}" cadastrada com ${qty} exemplar(es)!`);
    return { ok: true, book: newBook };
  };

  const suggestNextTccTombo = () => {
    const year = new Date().getFullYear();
    const pattern = new RegExp(`^TCC-${year}-(\\d+)$`);
    const max = extraInventory.reduce((acc, item) => {
      const match = pattern.exec(item.tombo);
      return match ? Math.max(acc, Number(match[1])) : acc;
    }, 0);
    return `TCC-${year}-${String(max + 1).padStart(4, '0')}`;
  };

  const addInventoryItem = (item) => {
    const tombo = String(item.tombo || '').trim().toUpperCase();
    if (!tombo || !String(item.title || '').trim()) {
      return { ok: false, error: 'Informe o código do tombo e o título do trabalho.' };
    }
    if (inventoryItems.some((i) => i.tombo.toUpperCase() === tombo)) {
      return { ok: false, error: `O tombo ${tombo} já está registrado no inventário.` };
    }
    setExtraInventory((prev) => [{ ...item, tombo, title: item.title.trim() }, ...prev]);
    pushNotifications([
      staffNote('info', 'Novo item patrimonial', `${tombo} — "${item.title.trim()}" registrado (${item.materialType}).`),
    ]);
    showToast(`Item patrimonial ${tombo} registrado no inventário!`);
    return { ok: true };
  };

  // RF14: baixa patrimonial, envio para restauração e retorno ao acervo
  // action: 'baixa' | 'restauro' | 'retorno'
  const updateInventoryStatus = (tombo, action, note = '') => {
    const reason = String(note || '').trim();
    const book = books.find((b) => b.copies.some((c) => c.tombo === tombo));

    if (book) {
      const copy = book.copies.find((c) => c.tombo === tombo);
      if (copy.status === 'Emprestado') {
        return {
          ok: false,
          error: `O exemplar ${tombo} está emprestado para ${copy.holder}. Registre a devolução antes de alterar a situação patrimonial.`,
        };
      }
      if (copy.status === 'Reservado') {
        return {
          ok: false,
          error: `O exemplar ${tombo} está separado para a reserva de ${copy.holder}. Cancele ou efetive a reserva antes.`,
        };
      }

      if (action === 'baixa') {
        if (copy.status === 'Baixa contábil') {
          return { ok: false, error: `O tombo ${tombo} já possui baixa patrimonial.` };
        }
        patchCopy(book.id, tombo, {
          type: 'Baixa',
          location: '— Fora de estante',
          status: 'Baixa contábil',
          holder: reason || 'Baixa patrimonial registrada',
          dueDate: null,
        });
        showToast(`Baixa patrimonial do tombo ${tombo} registrada.`);
        return { ok: true };
      }

      if (action === 'restauro') {
        if (copy.status === 'Em reparo') return { ok: false, error: `O tombo ${tombo} já está em restauração.` };
        if (copy.status === 'Baixa contábil') {
          return { ok: false, error: `O tombo ${tombo} possui baixa patrimonial e não pode ser restaurado.` };
        }
        patchCopy(book.id, tombo, {
          type: 'Restauração',
          previousType: copy.type,
          previousLocation: copy.location,
          location: 'Bancada de Restauro',
          status: 'Em reparo',
          holder: reason || 'Encaminhado para restauração',
          dueDate: null,
        });
        showToast(`Tombo ${tombo} encaminhado para a Bancada de Restauro.`);
        return { ok: true };
      }

      if (action === 'retorno') {
        if (copy.status !== 'Em reparo') {
          return { ok: false, error: `O tombo ${tombo} não está em restauração.` };
        }
        if (copy.previousType === 'Consulta Local' || book.circulationType === 'Consulta Local') {
          patchCopy(book.id, tombo, {
            type: 'Consulta Local',
            location: copy.previousLocation || book.location,
            status: 'Consulta local',
            holder: 'Uso no recinto',
            dueDate: null,
            previousType: undefined,
            previousLocation: undefined,
          });
          showToast(`Restauração do tombo ${tombo} concluída: exemplar de volta à consulta local.`);
          return { ok: true };
        }
        const next = allocateToQueue(book, tombo);
        if (next) {
          pushNotifications([readyNotification(next, book.title, tombo)]);
          showToast(`Restauração concluída: tombo ${tombo} reservado para ${next.userName} (1º da fila).`);
        } else {
          patchCopy(book.id, tombo, shelfState(book, copy));
          showToast(`Restauração do tombo ${tombo} concluída: exemplar disponível no acervo.`);
        }
        return { ok: true };
      }
      return { ok: false, error: 'Ação patrimonial inválida.' };
    }

    // Itens patrimoniais avulsos (TCC, periódicos, baixas antigas)
    const item = extraInventory.find((i) => i.tombo === tombo);
    if (!item) return { ok: false, error: 'Tombo não encontrado no inventário.' };
    const patchItem = (patch) =>
      setExtraInventory((prev) => prev.map((i) => (i.tombo === tombo ? { ...i, ...patch } : i)));

    if (action === 'baixa') {
      if (item.status === 'Baixa contábil') {
        return { ok: false, error: `O tombo ${tombo} já possui baixa patrimonial.` };
      }
      patchItem({
        status: 'Baixa contábil',
        location: '— Fora de estante',
        subtitle: reason ? `${item.subtitle} • Baixa: ${reason}` : item.subtitle,
      });
      showToast(`Baixa patrimonial do tombo ${tombo} registrada.`);
      return { ok: true };
    }
    if (action === 'restauro') {
      if (item.status === 'Em reparo') return { ok: false, error: `O tombo ${tombo} já está em restauração.` };
      if (item.status === 'Baixa contábil') {
        return { ok: false, error: `O tombo ${tombo} possui baixa patrimonial e não pode ser restaurado.` };
      }
      patchItem({
        status: 'Em reparo',
        previousStatus: item.status,
        previousLocation: item.location,
        location: 'Bancada de Restauro',
      });
      showToast(`Tombo ${tombo} encaminhado para a Bancada de Restauro.`);
      return { ok: true };
    }
    if (action === 'retorno') {
      if (item.status !== 'Em reparo') return { ok: false, error: `O tombo ${tombo} não está em restauração.` };
      patchItem({
        status: item.previousStatus || 'Disponível',
        location: item.previousLocation || item.location,
        previousStatus: undefined,
        previousLocation: undefined,
      });
      showToast(`Restauração do tombo ${tombo} concluída.`);
      return { ok: true };
    }
    return { ok: false, error: 'Ação patrimonial inválida.' };
  };

  // RF15: categorias e gêneros
  const addCategory = (cat) => {
    const name = String(cat.name || '').trim();
    const cdd = String(cat.cdd || '').trim();
    if (!name || !cdd) return { ok: false, error: 'Informe o nome e o código CDD da categoria.' };
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: `A categoria "${name}" já está cadastrada.` };
    }
    setCategories((prev) => [
      ...prev,
      { id: `cat-${nextSeq('category')}`, name, cdd, description: String(cat.description || '').trim() },
    ]);
    showToast(`Categoria "${name}" adicionada ao catálogo.`);
    return { ok: true };
  };

  // Cadastro de usuários pela equipe (o Bibliotecário cadastra apenas leitores)
  const addUser = (userData) => {
    const name = String(userData.name || '').trim().replace(/\s+/g, ' ');
    const matricula = String(userData.matricula || '').trim().toUpperCase();
    const email = String(userData.email || '').trim().toLowerCase();
    const role = currentUser?.role === 'admin' ? userData.role || 'aluno' : 'aluno';
    const readerType = userData.readerType === 'Docente' ? 'Docente' : 'Estudante';

    if (name.split(' ').length < 2) {
      return { ok: false, error: 'Informe o nome completo (nome e sobrenome).' };
    }
    if (!matricula) return { ok: false, error: 'Informe a matrícula ou o código funcional.' };
    if (!INSTITUTIONAL_DOMAINS.some((d) => email.endsWith(d))) {
      return { ok: false, error: 'O e-mail deve ser institucional (@rede.ulbra.br ou @ulbra.br).' };
    }
    const isStudent = role === 'aluno' && readerType === 'Estudante';
    if (isStudent && !email.endsWith('@rede.ulbra.br')) {
      return { ok: false, error: 'Estudantes utilizam o e-mail institucional @rede.ulbra.br.' };
    }
    if (!isStudent && !email.endsWith('@ulbra.br')) {
      return { ok: false, error: 'Docentes e funcionários utilizam o e-mail institucional @ulbra.br.' };
    }
    if (baseUsers.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'Já existe um usuário cadastrado com este e-mail.' };
    }
    if (baseUsers.some((u) => u.matricula.toUpperCase() === matricula)) {
      return { ok: false, error: 'Já existe um usuário cadastrado com esta matrícula/código.' };
    }

    const parts = name.split(' ');
    const newUser = {
      id: `u-${nextSeq('user')}`,
      name,
      fullName: name,
      matricula,
      email,
      role,
      roleLabel: role === 'aluno' ? readerType : ROLE_LABELS[role],
      readerType,
      department: String(userData.department || '').trim() || 'Graduação • CEULP/ULBRA',
      avatarInitials: `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase(),
      registeredAt: today,
    };
    setBaseUsers((prev) => [newUser, ...prev]);
    showToast(`Usuário ${newUser.name} cadastrado! Acesso liberado com ${newUser.email}.`);
    return { ok: true, user: newUser };
  };

  // Critério 2 / Seção 4.5: Administrador promove/altera perfil de acesso (RBAC)
  const updateUserRole = (userId, newRole) => {
    if (currentUser?.role !== 'admin') {
      return { ok: false, error: 'Apenas o Gestor / Administrador pode alterar perfis de acesso.' };
    }
    if (userId === currentUserId) {
      return { ok: false, error: 'Por segurança, você não pode alterar o seu próprio perfil de acesso.' };
    }
    const target = baseUsers.find((u) => u.id === userId);
    if (!target || !ROLE_LABELS[newRole]) return { ok: false, error: 'Usuário ou perfil inválido.' };
    if (target.role === newRole) return { ok: true };

    const roleLabel = newRole === 'aluno' ? target.readerType || 'Estudante' : ROLE_LABELS[newRole];
    setBaseUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole, roleLabel } : u)));
    showToast(`Perfil de acesso de ${target.name} atualizado para ${roleLabel}.`);
    return { ok: true };
  };

  // ---------------------------------------------------------------------------
  // Notificações (cada leitor vê apenas as suas; a equipe vê as notificações da equipe)
  // ---------------------------------------------------------------------------

  const getVisibleNotifications = (user = currentUser) => {
    if (!user) return [];
    return user.role === 'aluno'
      ? notifications.filter((n) => n.targetRole === 'aluno' && n.userId === user.id)
      : notifications.filter((n) => n.targetRole === 'staff');
  };

  const markNotificationsRead = (ids) => {
    const idSet = new Set(ids);
    setNotifications((prev) => prev.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    const unread = getVisibleNotifications().filter((n) => !n.read);
    if (unread.length === 0) {
      showToast('Não há notificações não lidas.', 'info');
      return;
    }
    markNotificationsRead(unread.map((n) => n.id));
    showToast('Todas as notificações foram marcadas como lidas.');
  };

  return (
    <LibraryContext.Provider
      value={{
        today,
        currentUser,
        activeTab,
        setActiveTab,
        pageIntent,
        clearPageIntent,
        selectedBookId,
        setSelectedBookId,
        books,
        users,
        loans,
        loanHistory,
        reservations,
        fines,
        categories,
        inventoryItems,
        notifications,
        staffAlerts,
        toast,
        showToast,
        loginWithEmail,
        loginAsUser,
        logout,
        calculateFine,
        getWaitingQueue,
        renewLoan,
        createReservation,
        cancelReservation,
        registerLoan,
        returnLoan,
        payFine,
        addBook,
        suggestNextTccTombo,
        addInventoryItem,
        updateInventoryStatus,
        addCategory,
        addUser,
        updateUserRole,
        getVisibleNotifications,
        markNotificationsRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => useContext(LibraryContext);
