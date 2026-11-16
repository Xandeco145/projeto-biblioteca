import React, { createContext, useContext, useState } from 'react';
import {
  BUSINESS_RULES,
  INITIAL_BOOKS,
  INITIAL_CATEGORIES,
  INITIAL_FINES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_LOANS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RESERVATIONS,
  INITIAL_USERS,
} from '../data/mockData';

const LibraryContext = createContext(null);

function addDaysToBrDate(brDateStr, daysToAdd) {
  const [day, month, year] = brDateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function LibraryProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedBookId, setSelectedBookId] = useState(null);

  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [loans, setLoans] = useState(INITIAL_LOANS);
  const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
  const [fines, setFines] = useState(INITIAL_FINES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [inventoryItems, setInventoryItems] = useState(INITIAL_INVENTORY_ITEMS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 4200);
  };

  // Autenticação institucional (@rede.ulbra.br ou @ulbra.br)
  const loginWithEmail = (emailInput) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) {
      setCurrentUser(found);
      setActiveTab('Dashboard');
      setSelectedBookId(null);
      return { ok: true };
    }
    if (cleanEmail.endsWith('@rede.ulbra.br')) {
      setCurrentUser(users[0]); // Mariana Costa (Aluno)
      setActiveTab('Dashboard');
      return { ok: true };
    }
    if (cleanEmail.endsWith('@ulbra.br')) {
      setCurrentUser(users[5]); // Ana Paula (Bibliotecário)
      setActiveTab('Dashboard');
      return { ok: true };
    }
    return {
      ok: false,
      error: 'Utilize uma credencial institucional válida (@rede.ulbra.br ou @ulbra.br).',
    };
  };

  const loginAsUser = (userId) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setActiveTab('Dashboard');
      setSelectedBookId(null);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('Dashboard');
    setSelectedBookId(null);
  };

  // Cálculo oficial de multa (RF8: R$ 5,00 fixo + R$ 2,00 por dia de atraso)
  const calculateFine = (daysOverdue) => {
    if (!daysOverdue || daysOverdue <= 0) return 0;
    return BUSINESS_RULES.FINE_BASE + daysOverdue * BUSINESS_RULES.FINE_PER_DAY;
  };

  // RF9: Renovar empréstimo (+14 dias, até 5 vezes, sem reserva ativa na obra)
  const renewLoan = (loanId) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return { ok: false, error: 'Empréstimo não encontrado.' };

    const hasPendingFines = fines.some(
      (f) => f.userId === targetLoan.userId && f.status === 'Pendente'
    );
    if (hasPendingFines || targetLoan.daysOverdue > 0) {
      return { ok: false, error: 'Renovação bloqueada: existem pendências financeiras ou atraso.' };
    }

    const hasWaitingQueue = reservations.some(
      (r) => r.bookId === targetLoan.bookId && r.status === 'Em espera'
    );
    if (hasWaitingQueue) {
      return { ok: false, error: 'Renovação bloqueada: há alunos na fila de espera para esta obra.' };
    }

    if (targetLoan.renewalsCount >= BUSINESS_RULES.MAX_RENEWALS) {
      return { ok: false, error: `Limite máximo de ${BUSINESS_RULES.MAX_RENEWALS} renovações atingido.` };
    }

    const previousDueDate = targetLoan.dueDate;
    const newDueDate = addDaysToBrDate(previousDueDate, BUSINESS_RULES.LOAN_DAYS);
    const nextCount = targetLoan.renewalsCount + 1;

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId ? { ...l, dueDate: newDueDate, renewalsCount: nextCount } : l
      )
    );

    setBooks((prev) =>
      prev.map((b) =>
        b.id === targetLoan.bookId
          ? {
              ...b,
              copies: b.copies.map((c) =>
                c.tombo === targetLoan.tombo ? { ...c, dueDate: newDueDate } : c
              ),
            }
          : b
      )
    );

    return {
      ok: true,
      data: {
        bookTitle: targetLoan.bookTitle,
        tombo: targetLoan.tombo,
        previousDueDate,
        newDueDate,
        renewalsCount: nextCount,
      },
    };
  };

  // RF10: Reservar obra disponível ou entrar na fila de espera
  const createReservation = ({ bookId, userId }) => {
    const book = books.find((b) => b.id === bookId);
    const user = users.find((u) => u.id === userId);
    if (!book || !user) return { ok: false, error: 'Obra ou usuário inválido.' };

    const alreadyReserved = reservations.some(
      (r) => r.bookId === bookId && r.userId === userId
    );
    if (alreadyReserved) {
      return { ok: false, error: 'Você já possui uma reserva ou posição na fila para esta obra.' };
    }

    const availableCopy = book.copies.find((c) => c.status === 'Disponível');
    const newId = `R-0${Math.floor(264 + Math.random() * 700)}`;

    if (availableCopy) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? {
                ...b,
                copies: b.copies.map((c) =>
                  c.tombo === availableCopy.tombo
                    ? {
                        ...c,
                        type: 'Reserva Balcão',
                        location: 'Armário Balcão A',
                        status: 'Reservado',
                        holder: user.name,
                        dueDate: '21/10/2026',
                      }
                    : c
                ),
              }
            : b
        )
      );

      const newRes = {
        id: newId,
        bookId,
        bookTitle: book.title,
        author: book.author,
        userId: user.id,
        userName: user.name,
        userMatricula: user.matricula,
        requestDate: '19/10/2026',
        pickupDeadline: 'Até 21/10/2026 • 18h',
        status: 'Pronta para retirada',
        tomboAllocated: availableCopy.tombo,
        queuePosition: null,
      };
      setReservations((prev) => [newRes, ...prev]);
      showToast(`Reserva confirmada! Exemplar ${availableCopy.tombo} separado no balcão.`);
      return { ok: true, reservation: newRes };
    } else {
      const currentQueue = reservations.filter(
        (r) => r.bookId === bookId && r.status === 'Em espera'
      ).length;
      const newRes = {
        id: newId,
        bookId,
        bookTitle: book.title,
        author: book.author,
        userId: user.id,
        userName: user.name,
        userMatricula: user.matricula,
        requestDate: '19/10/2026',
        pickupDeadline: `Prev. ${book.nextReturnDate || '22/10/2026'}`,
        status: 'Em espera',
        tomboAllocated: null,
        queuePosition: currentQueue + 1,
      };
      setReservations((prev) => [newRes, ...prev]);
      showToast(`Você entrou na fila de espera (${currentQueue + 1}º lugar) para "${book.title}".`);
      return { ok: true, reservation: newRes };
    }
  };

  const cancelReservation = (reservationId) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return;

    if (target.tomboAllocated) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === target.bookId
            ? {
                ...b,
                copies: b.copies.map((c) =>
                  c.tombo === target.tomboAllocated
                    ? {
                        ...c,
                        type: 'Circulação Livre',
                        location: b.location,
                        status: 'Disponível',
                        holder: null,
                        dueDate: null,
                      }
                    : c
                ),
              }
            : b
        )
      );
    }

    setReservations((prev) => prev.filter((r) => r.id !== reservationId));
    showToast(`Reserva ${reservationId} cancelada e exemplar devolvido ao acervo.`);
  };

  // RF3, RF4, RF5: Registrar novo empréstimo (14 dias, limite 2 livros, sem multas pendentes)
  const registerLoan = ({ bookId, tombo, userId, reservationIdToFulfill = null }) => {
    const book = books.find((b) => b.id === bookId);
    const user = users.find((u) => u.id === userId);
    if (!book || !user) return { ok: false, error: 'Selecione um livro e um leitor válidos.' };

    const userPendingFines = fines.filter(
      (f) => f.userId === user.id && f.status === 'Pendente'
    );
    if (userPendingFines.length > 0 || user.status === 'Suspenso') {
      return {
        ok: false,
        error: 'RF05: Empréstimo bloqueado. Leitor possui multa ou pendência financeira em aberto.',
      };
    }

    const userActiveLoans = loans.filter((l) => l.userId === user.id);
    if (userActiveLoans.length >= BUSINESS_RULES.MAX_ACTIVE_LOANS) {
      return {
        ok: false,
        error: `RF04: Limite atingido. O leitor já possui ${userActiveLoans.length} de ${BUSINESS_RULES.MAX_ACTIVE_LOANS} livros permitidos.`,
      };
    }

    const chosenCopy =
      book.copies.find((c) => c.tombo === tombo) ||
      book.copies.find((c) => c.status === 'Disponível' || c.status === 'Reservado');

    if (!chosenCopy) {
      return { ok: false, error: 'Não há exemplar disponível para retirada.' };
    }

    const checkoutDate = '19/10/2026';
    const dueDate = addDaysToBrDate(checkoutDate, BUSINESS_RULES.LOAN_DAYS);

    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              copies: b.copies.map((c) =>
                c.tombo === chosenCopy.tombo
                  ? {
                      ...c,
                      type: 'Circulação Livre',
                      location: 'Em circulação',
                      status: 'Emprestado',
                      holder: user.name,
                      dueDate,
                    }
                  : c
              ),
            }
          : b
      )
    );

    const newLoan = {
      id: `loan-${Date.now()}`,
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
      daysOverdue: 0,
      renewalsCount: 0,
      status: 'No prazo',
    };

    setLoans((prev) => [newLoan, ...prev]);

    if (reservationIdToFulfill) {
      setReservations((prev) => prev.filter((r) => r.id !== reservationIdToFulfill));
    }

    showToast(`Empréstimo registrado! Tombo ${chosenCopy.tombo} para ${user.name} (Dev.: ${dueDate}).`);
    return { ok: true, loan: newLoan };
  };

  // RF6 e RF8: Registrar devolução, vistoria física, cálculo de multa e encaminhamento para fila
  const returnLoan = ({ loanId, condition = 'Em Perfeito Estado', fineAction = 'paid_now' }) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;

    const fineAmount = calculateFine(targetLoan.daysOverdue);
    const nextInQueue = reservations.find(
      (r) => r.bookId === targetLoan.bookId && r.status === 'Em espera'
    );

    if (fineAmount > 0) {
      const fineStatus = fineAction === 'paid_now' ? 'Quitada' : 'Pendente';
      setFines((prev) => [
        {
          id: `FINE-${Math.floor(105 + Math.random() * 890)}`,
          userId: targetLoan.userId,
          userName: targetLoan.userName,
          userMatricula: targetLoan.userMatricula,
          bookTitle: targetLoan.bookTitle,
          tombo: targetLoan.tombo,
          daysOverdue: targetLoan.daysOverdue,
          amount: fineAmount,
          status: fineStatus,
          date: '19/10/2026',
        },
        ...prev,
      ]);

      if (fineStatus === 'Quitada') {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetLoan.userId ? { ...u, status: 'Ativo' } : u))
        );
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetLoan.userId ? { ...u, status: 'Suspenso' } : u))
        );
      }
    }

    setLoans((prev) => prev.filter((l) => l.id !== loanId));

    // Atualiza o status do exemplar conforme vistoria e fila de espera
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== targetLoan.bookId) return b;
        return {
          ...b,
          copies: b.copies.map((c) => {
            if (c.tombo !== targetLoan.tombo) return c;
            if (condition === 'Avariado / Danificado') {
              return {
                ...c,
                type: 'Restauração',
                location: 'Bancada de Restauro',
                status: 'Em reparo',
                holder: 'Avaria detectada na devolução',
                dueDate: null,
              };
            }
            if (condition === 'Extraviado / Perda') {
              return {
                ...c,
                type: 'Baixa',
                location: '— Fora de estante',
                status: 'Baixa contábil',
                holder: 'Extraviado pelo leitor',
                dueDate: null,
              };
            }
            if (nextInQueue) {
              return {
                ...c,
                type: 'Reserva Balcão',
                location: 'Armário Balcão A',
                status: 'Reservado',
                holder: nextInQueue.userName,
                dueDate: '21/10/2026',
              };
            }
            return {
              ...c,
              type: 'Circulação Livre',
              location: b.location,
              status: 'Disponível',
              holder: null,
              dueDate: null,
            };
          }),
        };
      })
    );

    if (condition === 'Em Perfeito Estado' && nextInQueue) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === nextInQueue.id
            ? {
                ...r,
                status: 'Pronta para retirada',
                pickupDeadline: 'Até 21/10/2026 • 18h',
                tomboAllocated: targetLoan.tombo,
                queuePosition: null,
              }
            : r
        )
      );
      showToast(
        `Devolução concluída! Exemplar reservado automaticamente para ${nextInQueue.userName} (1º da fila).`
      );
    } else {
      showToast(`Devolução do tombo ${targetLoan.tombo} registrada com sucesso.`);
    }
  };

  const payFine = (fineId) => {
    const target = fines.find((f) => f.id === fineId);
    if (!target) return;
    setFines((prev) =>
      prev.map((f) => (f.id === fineId ? { ...f, status: 'Quitada' } : f))
    );
    setUsers((prev) =>
      prev.map((u) => (u.id === target.userId ? { ...u, status: 'Ativo' } : u))
    );
    showToast(`Multa ${fineId} (R$ ${target.amount.toFixed(2).replace('.', ',')}) quitada!`);
  };

  // RF1: Cadastrar nova obra e exemplares no acervo
  const addBook = (bookData) => {
    const qty = Math.max(1, Number(bookData.copiesCount) || 1);
    const baseTombo = `TB-0${Math.floor(1300 + Math.random() * 8000)}`;
    const copies = Array.from({ length: qty }, (_, idx) => ({
      tombo: `${baseTombo}-${idx + 1}`,
      type: bookData.circulationType || 'Circulação Livre',
      location: bookData.location || 'Estante A • Prat. 1',
      status: bookData.circulationType === 'Consulta Local' ? 'Consulta local' : 'Disponível',
      holder: bookData.circulationType === 'Consulta Local' ? 'Uso exclusivo no recinto' : null,
      dueDate: null,
    }));

    const newBook = {
      id: `book-${Date.now()}`,
      title: bookData.title,
      author: bookData.author,
      publisher: bookData.publisher,
      year: Number(bookData.year) || 2026,
      edition: bookData.edition || '1ª Edição',
      isbn: bookData.isbn,
      category: bookData.category,
      cdd: bookData.cdd || '000.0',
      location: bookData.location || 'Estante A • Prat. 1',
      sector: bookData.sector || 'Acervo Geral',
      coverColor: '#0B303D',
      coverShort: bookData.title.slice(0, 12).toUpperCase(),
      circulationType: bookData.circulationType || 'Circulação Livre',
      copies,
    };

    setBooks((prev) => [newBook, ...prev]);
    setInventoryItems((prev) => [
      {
        tombo: copies[0].tombo,
        materialType: 'Livro',
        title: `${newBook.title} (${newBook.edition})`,
        subtitle: `${newBook.author} • ISBN ${newBook.isbn}`,
        location: newBook.location,
        status: copies[0].status,
      },
      ...prev,
    ]);
    showToast(`Obra "${newBook.title}" cadastrada com ${qty} exemplar(es)!`);
  };

  const addInventoryItem = (item) => {
    setInventoryItems((prev) => [item, ...prev]);
    showToast(`Item patrimonial ${item.tombo} registrado no inventário!`);
  };

  const updateInventoryStatus = (tombo, newStatus, newLocation) => {
    setInventoryItems((prev) =>
      prev.map((item) =>
        item.tombo === tombo
          ? { ...item, status: newStatus, location: newLocation || item.location }
          : item
      )
    );
    showToast(`Situação patrimonial do tombo ${tombo} atualizada para "${newStatus}".`);
  };

  const addCategory = (cat) => {
    setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, ...cat }]);
    showToast(`Categoria "${cat.name}" adicionada ao catálogo.`);
  };

  const addUser = (userData) => {
    const initials = userData.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    const newUser = {
      id: `u-${Date.now()}`,
      name: userData.name,
      fullName: userData.name,
      matricula: userData.matricula,
      email: userData.email,
      role: userData.role || 'aluno',
      roleLabel:
        userData.role === 'admin'
          ? 'Gestor / Admin'
          : userData.role === 'bibliotecario'
          ? 'Bibliotecário'
          : userData.roleLabel || 'Estudante',
      department: userData.department || 'Graduação • CEULP/ULBRA',
      status: 'Ativo',
      avatarInitials: initials,
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast(`Usuário ${newUser.name} cadastrado com sucesso!`);
  };

  // Critério 2 / Seção 4.5: Administrador promove/altera perfil de acesso (RBAC)
  const updateUserRole = (userId, newRole) => {
    const labelMap = {
      aluno: 'Estudante',
      bibliotecario: 'Bibliotecário',
      admin: 'Gestor / Admin',
    };
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: newRole, roleLabel: labelMap[newRole] } : u
      )
    );
    showToast(`Perfil de acesso atualizado para ${labelMap[newRole]}.`);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Todas as notificações foram marcadas como lidas.');
  };

  return (
    <LibraryContext.Provider
      value={{
        currentUser,
        activeTab,
        setActiveTab,
        selectedBookId,
        setSelectedBookId,
        books,
        users,
        loans,
        reservations,
        fines,
        categories,
        inventoryItems,
        notifications,
        toast,
        showToast,
        loginWithEmail,
        loginAsUser,
        logout,
        calculateFine,
        renewLoan,
        createReservation,
        cancelReservation,
        registerLoan,
        returnLoan,
        payFine,
        addBook,
        addInventoryItem,
        updateInventoryStatus,
        addCategory,
        addUser,
        updateUserRole,
        markAllNotificationsRead,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => useContext(LibraryContext);