import React, { useEffect, useState } from 'react';
import { Search, Plus, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';
import { addDaysToBrDate, formatCurrency } from '../../utils/format';
import { getBookAvailability } from '../../utils/library';

const CONDITIONS = ['Em Perfeito Estado', 'Avariado / Danificado', 'Extraviado / Perda'];

const Emprestimos = () => {
  const {
    loans,
    books,
    users,
    reservations,
    today,
    calculateFine,
    getWaitingQueue,
    registerLoan,
    returnLoan,
    pageIntent,
    clearPageIntent,
  } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modais
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [returnTargetLoan, setReturnTargetLoan] = useState(null);

  // Estado do Modal Novo Empréstimo
  const [loanBookId, setLoanBookId] = useState('book-1');
  const [loanUserId, setLoanUserId] = useState('u-2');
  const [loanFormError, setLoanFormError] = useState('');

  // Estado do Modal Devolução
  const [bookCondition, setBookCondition] = useState('Em Perfeito Estado');
  const [finePaymentOption, setFinePaymentOption] = useState('paid_now');

  const readers = users.filter((u) => u.role === 'aluno');

  const openNewLoanModal = (bookId) => {
    if (bookId) setLoanBookId(bookId);
    if (!readers.some((u) => u.id === loanUserId) && readers[0]) setLoanUserId(readers[0].id);
    setLoanFormError('');
    setShowNewLoanModal(true);
  };

  // Atalhos vindos de outras telas (Dashboard, Catálogo, Usuários)
  useEffect(() => {
    if (!pageIntent) return;
    if (pageIntent.type === 'new-loan') openNewLoanModal(pageIntent.bookId);
    if (pageIntent.type === 'filter-status') setStatusFilter(pageIntent.status);
    if (pageIntent.type === 'search') setSearchTerm(pageIntent.query || '');
    clearPageIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIntent]);

  const filteredLoans = loans.filter((loan) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      loan.bookTitle.toLowerCase().includes(q) ||
      loan.userName.toLowerCase().includes(q) ||
      loan.userMatricula.toLowerCase().includes(q) ||
      loan.tombo.toLowerCase().includes(q);

    const isLate = loan.daysOverdue > 0;
    const matchesStatus =
      statusFilter === 'Todos' ||
      (statusFilter === 'Regular' && !isLate) ||
      (statusFilter === 'Em Atraso' && isLate);

    return matchesSearch && matchesStatus;
  });

  // Validação em tempo real do leitor e da obra selecionados (RF04, RF05, RF10)
  const selectedUserObj = users.find((u) => u.id === loanUserId);
  const selectedBookObj = books.find((b) => b.id === loanBookId);
  const selectedBookInfo = selectedBookObj ? getBookAvailability(selectedBookObj) : null;
  const userReadyReservation = reservations.find(
    (r) => r.userId === loanUserId && r.bookId === loanBookId && r.status === 'Pronta para retirada'
  );
  const userHasThisBook = loans.some((l) => l.userId === loanUserId && l.bookId === loanBookId);
  const waitingForBook = selectedBookObj ? getWaitingQueue(selectedBookObj.id).length : 0;

  let validation = null;
  if (selectedUserObj) {
    if (selectedUserObj.status === 'Suspenso') {
      validation = { ok: false, text: `⚠ Cadastro suspenso (RF05): ${selectedUserObj.blockReason}.` };
    } else if (selectedUserObj.activeLoansCount >= BUSINESS_RULES.MAX_ACTIVE_LOANS) {
      validation = {
        ok: false,
        text: `⚠ Limite atingido (RF04): ${selectedUserObj.activeLoansCount} de ${BUSINESS_RULES.MAX_ACTIVE_LOANS} empréstimos em posse.`,
      };
    } else if (userHasThisBook) {
      validation = { ok: false, text: '⚠ O leitor já está com um exemplar desta obra.' };
    } else {
      validation = {
        ok: true,
        text: `✓ Cadastro regular: sem pendências • ${selectedUserObj.activeLoansCount} empréstimo(s) em posse (limite: ${BUSINESS_RULES.MAX_ACTIVE_LOANS})`,
      };
    }
  }

  const handleConfirmNewLoan = (e) => {
    e.preventDefault();
    const res = registerLoan({ bookId: loanBookId, userId: loanUserId });
    if (!res.ok) {
      setLoanFormError(res.error);
    } else {
      setLoanFormError('');
      setShowNewLoanModal(false);
    }
  };

  const closeReturnModal = () => {
    setReturnTargetLoan(null);
    setBookCondition('Em Perfeito Estado');
    setFinePaymentOption('paid_now');
  };

  const handleConfirmReturn = () => {
    if (!returnTargetLoan) return;
    returnLoan({
      loanId: returnTargetLoan.id,
      condition: bookCondition,
      fineAction: finePaymentOption,
    });
    closeReturnModal();
  };

  // Sempre usa os dados atualizados do empréstimo selecionado
  const returnLoanData = returnTargetLoan
    ? loans.find((l) => l.id === returnTargetLoan.id) || returnTargetLoan
    : null;

  return (
    <div className="panel-card">
      {/* Cabeçalho */}
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
            Empréstimos Ativos
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Acompanhe retiradas, prazos de {BUSINESS_RULES.LOAN_DAYS} dias e registre devoluções ou liquidação de multas.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
            {loans.length}
          </div>
          <div className="overline-label">EM CIRCULAÇÃO</div>
        </div>
      </div>

      {/* Barra de Ferramentas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 200px',
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
            placeholder="Buscar por obra, leitor, tombo ou matrícula..."
            aria-label="Buscar empréstimos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button type="button" className="btn btn-primary" onClick={() => openNewLoanModal()}>
          <Plus size={16} /> Novo Empréstimo
        </button>

        <select
          className="select-field"
          aria-label="Filtrar por situação"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos os estados</option>
          <option value="Regular">Regular</option>
          <option value="Em Atraso">Em Atraso</option>
        </select>
      </div>

      {/* Tabela de Empréstimos (Frame 4.5 / emprestimos.PNG) */}
      <div
        className="table-wrapper"
        style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Obra / Tombo</th>
              <th>Leitor / Matrícula</th>
              <th>Devolução Prevista</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.length === 0 && (
              <tr className="empty-row">
                <td colSpan="5">
                  {loans.length === 0
                    ? 'Nenhum empréstimo ativo no momento.'
                    : 'Nenhum empréstimo encontrado para os filtros informados.'}
                </td>
              </tr>
            )}
            {filteredLoans.map((loan) => {
              const fineValue = calculateFine(loan.daysOverdue);
              const isLate = loan.daysOverdue > 0;

              return (
                <tr key={loan.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                      {loan.bookTitle}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                      {loan.author} • <span className="mono-code">{loan.tombo}</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{loan.userName}</div>
                    {isLate ? (
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-danger-text)' }}>
                        Multa RF08: {formatCurrency(fineValue)} ({loan.daysOverdue} dia(s))
                      </div>
                    ) : (
                      <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                        <span className="mono-code">{loan.userMatricula}</span> • {loan.userType}
                      </div>
                    )}
                  </td>

                  <td>
                    <strong
                      style={{
                        color: isLate ? 'var(--color-danger-text)' : 'var(--color-text-primary)',
                      }}
                    >
                      {loan.dueDate}
                    </strong>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Retirada: {loan.checkoutDate} • {loan.renewalsCount} renov.
                    </div>
                  </td>

                  <td>
                    {isLate ? (
                      <span className="badge badge-danger">• Em Atraso</span>
                    ) : (
                      <span className="badge badge-success">• Regular</span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{
                        fontWeight: 700,
                        color: isLate ? 'var(--color-warning-text)' : 'var(--color-deep-teal)',
                      }}
                      onClick={() => setReturnTargetLoan(loan)}
                    >
                      {isLate ? 'Baixa / Multa' : 'Devolver'} <ChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Novo Empréstimo / Retirada no Balcão (Frame 4.4.2 corrigido: +14 dias e Limite: 2) */}
      {showNewLoanModal && (
        <div className="modal-backdrop" onClick={() => setShowNewLoanModal(false)}>
          <div className="modal-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Novo Empréstimo / Retirada no Balcão
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Selecione a obra e o leitor acadêmico para validar as regras RF03, RF04 e RF05.
            </p>

            <form onSubmit={handleConfirmNewLoan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="loan-book" style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  Obra do Acervo *
                </label>
                <select
                  id="loan-book"
                  className="select-field"
                  style={{ width: '100%' }}
                  value={loanBookId}
                  onChange={(e) => {
                    setLoanBookId(e.target.value);
                    setLoanFormError('');
                  }}
                >
                  {books.map((b) => {
                    const info = getBookAvailability(b);
                    const label = info.isLocalOnly
                      ? 'consulta local'
                      : `${info.available} disponível(is)`;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.title} — {b.author} ({label})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="loan-user" style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  Selecionar Leitor (Aluno / Docente) *
                </label>
                <select
                  id="loan-user"
                  className="select-field"
                  style={{ width: '100%' }}
                  value={loanUserId}
                  onChange={(e) => {
                    setLoanUserId(e.target.value);
                    setLoanFormError('');
                  }}
                >
                  {readers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.matricula} — {u.fullName} ({u.roleLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cartão de Validação em Tempo Real do Leitor (RF04 e RF05) */}
              {selectedUserObj && validation && (
                <div
                  style={{
                    backgroundColor: validation.ok ? '#F4F0E8' : 'var(--color-danger-bg)',
                    borderLeft: `4px solid ${validation.ok ? '#1B6B4A' : '#A62626'}`,
                    borderRadius: '6px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', fontSize: '14.5px' }}>
                    {selectedUserObj.fullName} (Matrícula: {selectedUserObj.matricula})
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {selectedUserObj.department} • E-mail: {selectedUserObj.email}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      marginTop: '6px',
                      color: validation.ok ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                    }}
                  >
                    {validation.text}
                  </div>
                  {userReadyReservation && (
                    <div style={{ fontSize: '12.5px', marginTop: '6px', color: 'var(--color-info-text)', fontWeight: 600 }}>
                      Reserva {userReadyReservation.id} pronta para retirada: será efetivada com o exemplar{' '}
                      {userReadyReservation.tomboAllocated}.
                    </div>
                  )}
                  {!userReadyReservation && selectedBookInfo && selectedBookInfo.available === 0 && (
                    <div style={{ fontSize: '12.5px', marginTop: '6px', color: 'var(--color-warning-text)', fontWeight: 600 }}>
                      {selectedBookInfo.isLocalOnly
                        ? 'Obra de consulta local: uso exclusivo no recinto (não circula).'
                        : `Nenhum exemplar disponível${waitingForBook ? ` • ${waitingForBook} leitor(es) na fila de espera` : ''}. Use “Reservas” para incluir o leitor na fila.`}
                    </div>
                  )}
                </div>
              )}

              {/* Datas e Regras */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '5px' }}>
                    Data de Saída (Hoje)
                  </label>
                  <input
                    readOnly
                    className="input-field"
                    style={{ width: '100%', backgroundColor: '#FAF7F0' }}
                    value={`${today} (Hoje)`}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '5px' }}>
                    Data Prevista de Devolução *
                  </label>
                  <input
                    readOnly
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700, color: 'var(--color-success-text)', borderColor: '#0B303D' }}
                    value={`${addDaysToBrDate(today, BUSINESS_RULES.LOAN_DAYS)} (+${BUSINESS_RULES.LOAN_DAYS} dias)`}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '5px' }}>
                    Tipo de Circulação
                  </label>
                  <input
                    readOnly
                    className="input-field"
                    style={{ width: '100%', backgroundColor: '#FAF7F0' }}
                    value="Empréstimo Domiciliar"
                  />
                </div>
              </div>

              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <div>• O acadêmico receberá comprovante digital e aviso de vencimento por e-mail.</div>
                <div>
                  • Prazo sujeito a até <strong>{BUSINESS_RULES.MAX_RENEWALS} renovações (RF09)</strong>, exceto havendo fila de espera.
                </div>
              </div>

              {loanFormError && (
                <div role="alert" className="form-error">
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{loanFormError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowNewLoanModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Registrar Devolução de Exemplar (Frame 4.4.2 / registro de devolucao.PNG com RF08: R$ 5 + R$ 2/dia) */}
      {returnLoanData && (
        <div className="modal-backdrop" onClick={closeReturnModal}>
          <div className="modal-box teal-top" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Registrar Devolução de Exemplar
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Confirme o retorno do item ao acervo, vistorie o estado de conservação e liquide eventuais multas.
            </p>

            {/* Resumo do Exemplar */}
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-deep-teal)' }}>
                {returnLoanData.bookTitle} ({returnLoanData.author})
              </div>
              <div className="mono-code" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Tombo: {returnLoanData.tombo} • Leitor: {returnLoanData.userName} (Matrícula: {returnLoanData.userMatricula})
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Retirado em {returnLoanData.checkoutDate} • Devolução prevista: {returnLoanData.dueDate}
              </div>
            </div>

            {/* Alerta de Multa Automática RF08 (se houver atraso) */}
            {returnLoanData.daysOverdue > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  borderLeft: '4px solid #A62626',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--color-danger-text)', marginBottom: '8px' }}>
                  Atenção: Devolução com Prazo Expirado (Atraso Detectado)
                </div>
                <div style={{ fontSize: '13.5px', lineHeight: 1.7 }}>
                  <div>
                    Data Prevista de Entrega: <strong>{returnLoanData.dueDate}</strong>
                  </div>
                  <div>
                    Data Efetiva da Devolução:{' '}
                    <strong style={{ color: 'var(--color-danger-text)' }}>
                      {today} (Hoje • {returnLoanData.daysOverdue} dia(s) de atraso)
                    </strong>
                  </div>
                  <div>
                    Valor Total da Multa (RF08):{' '}
                    <strong style={{ color: 'var(--color-danger-text)', fontSize: '15px' }}>
                      {formatCurrency(calculateFine(returnLoanData.daysOverdue))} (
                      {formatCurrency(BUSINESS_RULES.FINE_BASE)} fixo + {returnLoanData.daysOverdue} ×{' '}
                      {formatCurrency(BUSINESS_RULES.FINE_PER_DAY)})
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', fontWeight: 600, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="fineOption"
                      checked={finePaymentOption === 'paid_now'}
                      onChange={() => setFinePaymentOption('paid_now')}
                    />
                    Multa quitada agora no balcão
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="fineOption"
                      checked={finePaymentOption === 'pending_portal'}
                      onChange={() => setFinePaymentOption('pending_portal')}
                    />
                    Lançar débito pendente no portal
                  </label>
                </div>
                {finePaymentOption === 'pending_portal' && (
                  <div style={{ fontSize: '12.5px', color: 'var(--color-danger-text)', marginTop: '8px' }}>
                    O leitor permanecerá bloqueado (RF05) até a quitação da multa na ficha de Usuários.
                  </div>
                )}
              </div>
            )}

            {/* Vistoria e Estado Físico */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                Vistoria e Estado Físico do Exemplar *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {CONDITIONS.map((cond) => {
                  const active = bookCondition === cond;
                  return (
                    <button
                      key={cond}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setBookCondition(cond)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '6px',
                        border: active ? '2px solid #1B6B4A' : '1px solid var(--color-border-strong)',
                        backgroundColor: active ? 'var(--color-success-bg)' : '#FFFFFF',
                        color:
                          cond === 'Extraviado / Perda'
                            ? 'var(--color-danger-text)'
                            : active
                            ? 'var(--color-success-text)'
                            : 'var(--color-text-primary)',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                      }}
                    >
                      {active ? `✓ ${cond}` : cond}
                    </button>
                  );
                })}
              </div>
              {bookCondition === 'Avariado / Danificado' && (
                <div style={{ fontSize: '12.5px', color: 'var(--color-warning-text)', marginTop: '8px' }}>
                  O exemplar será encaminhado para a Bancada de Restauro e ficará indisponível até a conclusão do reparo.
                </div>
              )}
              {bookCondition === 'Extraviado / Perda' && (
                <div style={{ fontSize: '12.5px', color: 'var(--color-danger-text)', marginTop: '8px' }}>
                  O tombo receberá baixa contábil (extravio) e será aberto o processo indenizatório com o leitor.
                </div>
              )}
            </div>

            {/* Aviso Dinâmico de Fila de Espera */}
            {(() => {
              const queueList = getWaitingQueue(returnLoanData.bookId);
              if (queueList.length === 0) return null;
              const goesToQueue = bookCondition === 'Em Perfeito Estado';
              return (
                <div
                  style={{
                    backgroundColor: '#FDF7F0',
                    border: '1px solid #EBC8A4',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-warning-text)', marginBottom: '3px' }}>
                    ⚠ Próxima Ação do Sistema para este Exemplar:
                  </div>
                  {goesToQueue ? (
                    <div>
                      Há <strong>{queueList.length} leitor(es)</strong> na fila de espera. Ao confirmar a devolução, o exemplar
                      ficará automaticamente reservado para <strong>{queueList[0].userName} (1º da fila)</strong>, com prazo de{' '}
                      {BUSINESS_RULES.RESERVATION_HOLD_HOURS}h para retirada.
                    </div>
                  ) : (
                    <div>
                      Há <strong>{queueList.length} leitor(es)</strong> na fila de espera, mas este exemplar não voltará a circular
                      agora ({bookCondition.toLowerCase()}). A fila continuará aguardando o próximo exemplar devolvido.
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-outline" onClick={closeReturnModal}>
                Cancelar
              </button>
              <button type="button" className="btn btn-teal" onClick={handleConfirmReturn}>
                <Check size={16} /> Confirmar Devolução
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emprestimos;
