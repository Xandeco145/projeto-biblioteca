import React, { useState } from 'react';
import { Search, ChevronRight, Users, AlertTriangle } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';
import { addDaysToBrDate, shortBrDate } from '../../utils/format';
import { getBookAvailability, reservationHoldDays } from '../../utils/library';

const coverStyle = (color, large) => ({
  width: large ? '48px' : '34px',
  height: large ? '66px' : '46px',
  backgroundColor: color,
  color: '#FAF7F0',
  borderRadius: large ? '4px' : '3px',
  padding: large ? '6px' : '4px',
  fontSize: large ? '8px' : '7px',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  flexShrink: 0,
  borderLeft: '3px solid #D68C45',
});

const AlunoCatalogo = () => {
  const { currentUser, books, categories, reservations, loans, createReservation, today } =
    useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const [reserveModalBook, setReserveModalBook] = useState(null);
  const [queueModalBook, setQueueModalBook] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');

  const totalCopies = books.reduce((acc, b) => acc + b.copies.length, 0);
  const myActiveLoans = loans.filter((l) => l.userId === currentUser.id).length;
  const atLoanLimit = myActiveLoans >= BUSINESS_RULES.MAX_ACTIVE_LOANS;
  const isBlocked = currentUser.status === 'Suspenso';
  const pickupDeadline = addDaysToBrDate(today, reservationHoldDays());

  const filteredBooks = books.filter((book) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'Todas' || book.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'Todos' || getBookAvailability(book).statusLabel === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openModal = (setter, book) => {
    setFeedbackError('');
    setter(book);
  };

  const closeModals = () => {
    setReserveModalBook(null);
    setQueueModalBook(null);
    setFeedbackError('');
  };

  const handleConfirmReserve = (book) => {
    const res = createReservation({ bookId: book.id, userId: currentUser.id });
    if (!res.ok) {
      setFeedbackError(res.error);
    } else {
      closeModals();
    }
  };

  // Avisos de regra (a reserva é permitida, mas a retirada depende de RF04/RF05)
  const pickupWarnings = (
    <>
      {isBlocked && (
        <div className="form-warning" style={{ marginBottom: '12px' }}>
          <strong>Atenção (RF05):</strong> seu cadastro possui pendências ({currentUser.blockReason}).
          A retirada só será liberada após a regularização no balcão.
        </div>
      )}
      {!isBlocked && atLoanLimit && (
        <div className="form-warning" style={{ marginBottom: '12px' }}>
          <strong>Atenção (RF04):</strong> você já possui {myActiveLoans} de{' '}
          {BUSINESS_RULES.MAX_ACTIVE_LOANS} empréstimos ativos. Para retirar esta obra será
          necessário devolver um exemplar antes.
        </div>
      )}
    </>
  );

  const errorBox = feedbackError && (
    <div role="alert" className="form-error" style={{ marginBottom: '12px' }}>
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>{feedbackError}</span>
    </div>
  );

  return (
    <div className="panel-card">
      {/* Cabeçalho da Seção (Fiel ao Frame 4.3.1 com título serifado padronizado) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="serif-title" style={{ fontSize: '30px', marginBottom: '4px' }}>
            Livros do Acervo
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Consulte, organize e acompanhe a disponibilidade em tempo real das obras acadêmicas.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
            {books.length}
          </div>
          <div className="overline-label">OBRAS • {totalCopies} EXEMPLARES</div>
        </div>
      </div>

      {/* Barra de Busca e Filtros (RF11 e RF12) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px 190px',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            color="#525E62"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-field"
            style={{ width: '100%', paddingLeft: '36px' }}
            placeholder="Buscar por título, autor, categoria ou ISBN..."
            aria-label="Buscar obras"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-field"
          aria-label="Filtrar por categoria"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="Todas">Categorias: Todas</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          className="select-field"
          aria-label="Filtrar por disponibilidade"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="Todos">Status: Todos</option>
          <option value="Disponível">Disponível</option>
          <option value="Emprestado">Emprestado</option>
          <option value="Consulta local">Consulta local</option>
          <option value="Indisponível">Indisponível</option>
        </select>
      </div>

      {/* Tabela de Obras (Fiel ao Frame 4.3.1 do Figma) */}
      <div
        className="table-wrapper"
        style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Título e autoria</th>
              <th>Categoria / CDD</th>
              <th>Localização Física</th>
              <th>Disponibilidade</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.length === 0 && (
              <tr className="empty-row">
                <td colSpan="5">Nenhuma obra encontrada para os filtros informados.</td>
              </tr>
            )}
            {filteredBooks.map((book) => {
              const info = getBookAvailability(book);
              const myReservation = reservations.find(
                (r) => r.bookId === book.id && r.userId === currentUser.id
              );
              const hasLoan = loans.some((l) => l.bookId === book.id && l.userId === currentUser.id);

              return (
                <tr key={book.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={coverStyle(book.coverColor)}>{book.coverShort}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                          {book.title}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                          {book.author} • {book.publisher} • {book.year}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{book.category}</div>
                    <div className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                      {book.cdd}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{book.location}</div>
                    {info.available === 0 && !info.isLocalOnly ? (
                      <div style={{ fontSize: '12px', color: 'var(--color-danger-text)', fontWeight: 600 }}>
                        {info.nextReturnDate
                          ? `Devolução prev.: ${info.nextReturnDate}`
                          : 'Sem previsão de devolução'}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {book.sector}
                      </div>
                    )}
                  </td>

                  <td>
                    {info.isLocalOnly ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-info-text)', fontSize: '13px' }}>
                          • Consulta local
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {info.total} exemplares
                        </div>
                      </>
                    ) : info.available > 0 ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-success-text)', fontSize: '13px' }}>
                          • Disponível
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {info.available} de {info.total} exemplares
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-danger-text)', fontSize: '13px' }}>
                          • {info.statusLabel}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          0 de {info.total} exemplares
                        </div>
                      </>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {info.isLocalOnly ? (
                      <button type="button" className="btn btn-outline" disabled style={{ fontSize: '12.5px' }}>
                        Uso no Recinto
                      </button>
                    ) : hasLoan ? (
                      <span className="badge badge-neutral">Em sua posse</span>
                    ) : myReservation ? (
                      <span className="badge badge-info">
                        {myReservation.status === 'Em espera'
                          ? `Na fila (${myReservation.queuePosition}º)`
                          : 'Reservado para você'}
                      </span>
                    ) : info.available > 0 ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ minWidth: '126px', padding: '8px 14px' }}
                        onClick={() => openModal(setReserveModalBook, book)}
                      >
                        Reservar <ChevronRight size={15} />
                      </button>
                    ) : info.canQueue ? (
                      <button
                        type="button"
                        className="btn btn-teal"
                        style={{ minWidth: '126px', padding: '8px 14px' }}
                        onClick={() => openModal(setQueueModalBook, book)}
                      >
                        Entrar na Fila <ChevronRight size={15} />
                      </button>
                    ) : (
                      <button type="button" className="btn btn-outline" disabled style={{ fontSize: '12.5px' }}>
                        Indisponível
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Confirmar Reserva de Exemplar Disponível (Frame 4.4.1 com prazo 14 dias RF3) */}
      {reserveModalBook && (
        <div className="modal-backdrop" onClick={closeModals}>
          <div className="modal-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Confirmar Reserva de Exemplar
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Verifique os dados da obra e as condições de retirada no balcão.
            </p>

            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div style={coverStyle(reserveModalBook.coverColor, true)}>{reserveModalBook.coverShort}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-deep-teal)' }}>
                  {reserveModalBook.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {reserveModalBook.author} • Editora {reserveModalBook.publisher} • {reserveModalBook.year}
                </div>
                <div className="mono-code" style={{ marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                  Exemplar atribuído:{' '}
                  {reserveModalBook.copies.find((c) => c.status === 'Disponível')?.tombo} (Circulação Livre)
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success-text)', marginTop: '4px' }}>
                  Status: Disponível imediatamente para separação
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderRadius: '8px',
                padding: '16px 18px',
                marginBottom: '16px',
                fontSize: '13.5px',
                lineHeight: 1.7,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', marginBottom: '6px' }}>
                Informações de Retirada e Prazos:
              </div>
              <div>
                • Local de Retirada: <strong>Balcão da Biblioteca Central (Térreo)</strong>
              </div>
              <div>
                • Prazo para Retirada:{' '}
                <strong style={{ color: 'var(--color-warning-text)' }}>
                  Até {BUSINESS_RULES.RESERVATION_HOLD_HOURS} horas após a reserva ({shortBrDate(pickupDeadline)} às{' '}
                  {BUSINESS_RULES.PICKUP_CLOSING_HOUR}h)
                </strong>
              </div>
              <div>
                • Prazo de Empréstimo:{' '}
                <strong>{BUSINESS_RULES.LOAN_DAYS} dias corridos a partir da retirada (RF03)</strong>
              </div>
              <div>
                • Notificação: <strong>Enviada para {currentUser.email}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Nota: caso não retire no prazo, a reserva expira e a obra retorna ao acervo geral.
              </div>
            </div>

            {pickupWarnings}
            {errorBox}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-outline" onClick={closeModals}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleConfirmReserve(reserveModalBook)}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Entrar na Fila de Espera (Frame 4.4.1 / fila.PNG) */}
      {queueModalBook &&
        (() => {
          const info = getBookAvailability(queueModalBook);
          const position =
            reservations.filter((r) => r.bookId === queueModalBook.id && r.status === 'Em espera')
              .length + 1;
          return (
            <div className="modal-backdrop" onClick={closeModals}>
              <div
                className="modal-box teal-top"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
                  Entrar na Fila de Espera
                </h2>
                <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Nenhum exemplar desta obra está disponível no momento.
                </p>

                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div style={coverStyle(queueModalBook.coverColor, true)}>{queueModalBook.coverShort}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-deep-teal)' }}>
                      {queueModalBook.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {queueModalBook.author} • {queueModalBook.publisher} • {queueModalBook.year}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                      Total de exemplares: {info.total} (0 disponíveis no momento)
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-danger-text)', marginTop: '3px' }}>
                      • {info.loaned} emprestado(s)
                      {info.repair > 0 ? ` • ${info.repair} em restauração` : ''}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#F4F0E8',
                    borderRadius: '8px',
                    padding: '16px 18px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #185266',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} /> Sua posição na fila de espera:
                    </span>
                    <strong style={{ color: 'var(--color-warning-text)', fontSize: '16px' }}>
                      {position}º Lugar
                    </strong>
                  </div>

                  <div style={{ fontSize: '13.5px', lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', marginBottom: '4px' }}>
                      Condições e Notificação da Fila:
                    </div>
                    <div>
                      • Próxima Devolução Estimada:{' '}
                      <strong>
                        {info.nextReturnDate
                          ? `${info.nextReturnDate} às ${BUSINESS_RULES.PICKUP_CLOSING_HOUR}:00`
                          : 'sem previsão (exemplares em restauração)'}
                      </strong>
                    </div>
                    <div>
                      • Aviso de Liberação: <strong>Disparo automático via e-mail ({currentUser.email}) e portal</strong>
                    </div>
                    <div>
                      • Tempo de Garantia:{' '}
                      <strong style={{ color: 'var(--color-success-text)' }}>
                        {BUSINESS_RULES.RESERVATION_HOLD_HOURS} horas de reserva no balcão após a liberação
                      </strong>
                    </div>
                  </div>
                </div>

                {pickupWarnings}
                {errorBox}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-outline" onClick={closeModals}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-teal"
                    onClick={() => handleConfirmReserve(queueModalBook)}
                  >
                    Entrar na Fila
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default AlunoCatalogo;
