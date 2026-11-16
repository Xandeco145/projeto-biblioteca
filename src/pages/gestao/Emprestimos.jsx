import React, { useState } from 'react';
import { Search, Plus, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';

const Emprestimos = () => {
  const {
    loans,
    books,
    users,
    fines,
    reservations,
    calculateFine,
    registerLoan,
    returnLoan,
  } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modais
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [returnTargetLoan, setReturnTargetLoan] = useState(null);

  // Estado do Modal Novo Empréstimo
  const [selectedBookId, setSelectedBookId] = useState('book-1');
  const [selectedUserId, setSelectedUserId] = useState('u-2');
  const [loanFormError, setLoanFormError] = useState('');

  // Estado do Modal Devolução
  const [bookCondition, setBookCondition] = useState('Em Perfeito Estado');
  const [finePaymentOption, setFinePaymentOption] = useState('paid_now');

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

  const selectedUserObj = users.find((u) => u.id === selectedUserId);
  const selectedUserLoansCount = loans.filter((l) => l.userId === selectedUserId).length;
  const selectedUserPendingFines = fines.filter(
    (f) => f.userId === selectedUserId && f.status === 'Pendente'
  );

  const handleConfirmNewLoan = (e) => {
    e.preventDefault();
    const res = registerLoan({
      bookId: selectedBookId,
      userId: selectedUserId,
    });
    if (!res.ok) {
      setLoanFormError(res.error);
    } else {
      setLoanFormError('');
      setShowNewLoanModal(false);
    }
  };

  const handleConfirmReturn = () => {
    if (!returnTargetLoan) return;
    returnLoan({
      loanId: returnTargetLoan.id,
      condition: bookCondition,
      fineAction: finePaymentOption,
    });
    setReturnTargetLoan(null);
    setBookCondition('Em Perfeito Estado');
    setFinePaymentOption('paid_now');
  };

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
            {182 + loans.length}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setLoanFormError('');
            setShowNewLoanModal(true);
          }}
        >
          <Plus size={16} /> + Novo Empréstimo
        </button>

        <select
          className="select-field"
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
                        Multa RF08: R$ {fineValue.toFixed(2).replace('.', ',')} ({loan.daysOverdue} dias)
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

      {/* Modal 1: Novo Empréstimo / Agendamento de Retirada (Frame 4.4.2 corrigido: +14 dias e Limite: 2) */}
      {showNewLoanModal && (
        <div className="modal-backdrop" onClick={() => setShowNewLoanModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Novo Empréstimo / Retirada no Balcão
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Selecione a obra e o leitor acadêmico para validar as regras RF03, RF04 e RF05.
            </p>

            <form onSubmit={handleConfirmNewLoan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  Obra do Acervo *
                </label>
                <select
                  className="select-field"
                  style={{ width: '100%' }}
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                >
                  {books.map((b) => {
                    const avail = b.copies.filter((c) => c.status === 'Disponível').length;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.title} — {b.author} ({avail} disponível(is))
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  Pesquisar e Selecionar Usuário (Aluno / Docente) *
                </label>
                <select
                  className="select-field"
                  style={{ width: '100%' }}
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {users
                    .filter((u) => u.role === 'aluno')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.matricula} — {u.fullName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Cartão de Validação em Tempo Real do Leitor (RF04 e RF05) */}
              {selectedUserObj && (
                <div
                  style={{
                    backgroundColor:
                      selectedUserPendingFines.length > 0 ||
                      selectedUserObj.status === 'Suspenso' ||
                      selectedUserLoansCount >= BUSINESS_RULES.MAX_ACTIVE_LOANS
                        ? 'var(--color-danger-bg)'
                        : '#F4F0E8',
                    borderLeft: `4px solid ${
                      selectedUserPendingFines.length > 0 ||
                      selectedUserObj.status === 'Suspenso' ||
                      selectedUserLoansCount >= BUSINESS_RULES.MAX_ACTIVE_LOANS
                        ? '#A62626'
                        : '#1B6B4A'
                    }`,
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
                      color:
                        selectedUserPendingFines.length > 0 ||
                        selectedUserObj.status === 'Suspenso' ||
                        selectedUserLoansCount >= BUSINESS_RULES.MAX_ACTIVE_LOANS
                          ? 'var(--color-danger-text)'
                          : 'var(--color-success-text)',
                    }}
                  >
                    {selectedUserPendingFines.length > 0 || selectedUserObj.status === 'Suspenso'
                      ? '⚠ Cadastro Suspenso: Possui multa ou devolução em atraso (Bloqueado pelo RF05)'
                      : `✓ Cadastro Regular: Sem débitos de multas • ${selectedUserLoansCount} empréstimo(s) em posse (Limite: ${BUSINESS_RULES.MAX_ACTIVE_LOANS})`}
                  </div>
                </div>
              )}

              {/* Datas e Regras */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '5px' }}>
                    Data de Saída (Hoje)
                  </label>
                  <input readOnly className="input-field" style={{ width: '100%', backgroundColor: '#FAF7F0' }} value="19/10/2026 (Hoje)" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '5px' }}>
                    Data Prevista de Devolução *
                  </label>
                  <input
                    readOnly
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700, color: 'var(--color-success-text)', borderColor: '#0B303D' }}
                    value={`02/11/2026 (+${BUSINESS_RULES.LOAN_DAYS} dias)`}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '5px' }}>
                    Tipo de Circulação
                  </label>
                  <input readOnly className="input-field" style={{ width: '100%', backgroundColor: '#FAF7F0' }} value="Empréstimo Domiciliar" />
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
                <div
                  style={{
                    backgroundColor: 'var(--color-danger-bg)',
                    color: 'var(--color-danger-text)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} />
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

      {/* Modal 2: Registrar Devolução de Exemplar (Frame 4.4.2 / registro de devolucao.PNG com RF08: R$ 5 + R$ 2/dia = R$ 11,00) */}
      {returnTargetLoan && (
        <div className="modal-backdrop" onClick={() => setReturnTargetLoan(null)}>
          <div className="modal-box teal-top" onClick={(e) => e.stopPropagation()}>
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
                {returnTargetLoan.bookTitle} ({returnTargetLoan.author})
              </div>
              <div className="mono-code" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Tombo: {returnTargetLoan.tombo} • Leitor: {returnTargetLoan.userName} (Matrícula: {returnTargetLoan.userMatricula})
              </div>
            </div>

            {/* Alerta de Multa Automática RF08 (se houver atraso) */}
            {returnTargetLoan.daysOverdue > 0 && (
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
                    Data Prevista de Entrega: <strong>{returnTargetLoan.dueDate}</strong>
                  </div>
                  <div>
                    Data Efetiva da Devolução:{' '}
                    <strong style={{ color: 'var(--color-danger-text)' }}>
                      19/10/2026 (Hoje • {returnTargetLoan.daysOverdue} dias de atraso)
                    </strong>
                  </div>
                  <div>
                    Valor Total da Multa (RF08):{' '}
                    <strong style={{ color: 'var(--color-danger-text)', fontSize: '15px' }}>
                      R$ {calculateFine(returnTargetLoan.daysOverdue).toFixed(2).replace('.', ',')} (R$ 5,00 fixo + R$ 2,00 / dia)
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', fontWeight: 600 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="fineOption"
                      checked={finePaymentOption === 'paid_now'}
                      onChange={() => setFinePaymentOption('paid_now')}
                    />
                    Quitado agora no balcão
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
              </div>
            )}

            {/* Vistoria e Estado Físico */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                Vistoria e Estado Físico do Exemplar *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {['Em Perfeito Estado', 'Avariado / Danificado', 'Extraviado / Perda'].map((cond) => {
                  const active = bookCondition === cond;
                  return (
                    <button
                      key={cond}
                      type="button"
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
            </div>

            {/* Aviso Dinâmico de Fila de Espera */}
            {(() => {
              const queueList = reservations.filter(
                (r) => r.bookId === returnTargetLoan.bookId && r.status === 'Em espera'
              );
              if (queueList.length === 0) return null;
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
                  <div>
                    Há <strong>{queueList.length} aluno(s)</strong> na fila de espera. Ao confirmar a baixa, o exemplar ficará automaticamente reservado para{' '}
                    <strong>{queueList[0].userName} (1º da fila)</strong>.
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setReturnTargetLoan(null)}>
                Cancelar
              </button>
              <button className="btn btn-teal" onClick={handleConfirmReturn}>
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