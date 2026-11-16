import React, { useState } from 'react';
import { Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';

const AlunoDashboard = () => {
  const {
    currentUser,
    loans,
    reservations,
    fines,
    renewLoan,
    cancelReservation,
    setActiveTab,
  } = useLibrary();

  const [renewalModalData, setRenewalModalData] = useState(null);
  const [renewalError, setRenewalError] = useState(null);

  const myLoans = loans.filter((l) => l.userId === currentUser.id);
  const myReservations = reservations.filter((r) => r.userId === currentUser.id);
  const myPendingFines = fines.filter(
    (f) => f.userId === currentUser.id && f.status === 'Pendente'
  );

  const totalDebt = myPendingFines.reduce((acc, f) => acc + f.amount, 0);
  const nearestDue = myLoans.length > 0 ? myLoans[0].dueDate.slice(0, 5) : '—';

  const handleRenewClick = (loanId) => {
    const result = renewLoan(loanId);
    if (result.ok) {
      setRenewalError(null);
      setRenewalModalData(result.data);
    } else {
      setRenewalError(result.error);
    }
  };

  return (
    <div className="panel-card">
      {/* Saudação e Metadados do Leitor */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="serif-title" style={{ fontSize: '32px', marginBottom: '6px' }}>
          Olá, {currentUser.name}
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Matrícula: <span className="mono-code">{currentUser.matricula}</span> •{' '}
          {currentUser.department} • Situação:{' '}
          <strong
            style={{
              color:
                totalDebt > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)',
            }}
          >
            {totalDebt > 0 ? 'Pendência Financeira' : 'Regular'}
          </strong>
        </p>
      </div>

      {/* 3 Cards de Resumo (Fiel ao Frame 4.2.1 do Figma) */}
      <div className="kpi-grid-3">
        <div className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
          <div className="overline-label">LIVROS EM POSSE</div>
          <div className="kpi-value">
            {myLoans.length} {myLoans.length === 1 ? 'exemplar' : 'exemplares'}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success-text)' }}>
            {myLoans.length > 0
              ? `Devolução mais próxima: ${nearestDue} (Limite: ${BUSINESS_RULES.MAX_ACTIVE_LOANS})`
              : `Limite disponível: ${BUSINESS_RULES.MAX_ACTIVE_LOANS} exemplares`}
          </div>
        </div>

        <div className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
          <div className="overline-label">RESERVAS EM ANDAMENTO</div>
          <div className="kpi-value">
            {myReservations.length} {myReservations.length === 1 ? 'ativa' : 'ativas'}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-warning-text)' }}>
            {myReservations.length > 0
              ? myReservations[0].status === 'Em espera'
                ? `${myReservations[0].queuePosition}º lugar na fila de espera`
                : 'Pronta para retirada no balcão'
              : 'Nenhuma reserva ativa'}
          </div>
        </div>

        <div
          className={`kpi-card ${totalDebt > 0 ? 'highlight-danger' : ''}`}
          style={totalDebt === 0 ? { backgroundColor: '#FAF7F0' } : undefined}
        >
          <div className="overline-label">DÉBITOS E MULTAS</div>
          <div
            className="kpi-value"
            style={totalDebt > 0 ? { color: 'var(--color-danger-text)' } : undefined}
          >
            R$ {totalDebt.toFixed(2).replace('.', ',')}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color:
                totalDebt > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)',
            }}
          >
            {totalDebt > 0
              ? 'Regularize no balcão para liberar empréstimos'
              : 'Nenhuma pendência financeira'}
          </div>
        </div>
      </div>

      {/* Alerta caso a renovação seja bloqueada por regra de negócio */}
      {renewalError && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid #E5B4B4',
            color: 'var(--color-danger-text)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13.5px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <strong>Operação não permitida:</strong> {renewalError}
          </span>
          <button
            className="btn-ghost"
            style={{ color: 'var(--color-danger-text)', fontWeight: 700 }}
            onClick={() => setRenewalError(null)}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Seção: Meus Empréstimos Ativos */}
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h2 className="serif-title" style={{ fontSize: '23px' }}>
            Meus Empréstimos Ativos
          </h2>
          <span className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
            Prazo padrão: {BUSINESS_RULES.LOAN_DAYS} dias • Máx. {BUSINESS_RULES.MAX_RENEWALS} renovações
          </span>
        </div>

        <div
          className="table-wrapper"
          style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Título da Obra</th>
                <th>Data Retirada</th>
                <th>Data Limite Devolução</th>
                <th>Renovações</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {myLoans.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                    Você não possui livros emprestados no momento.{' '}
                    <button
                      className="btn-ghost"
                      style={{ fontWeight: 700, textDecoration: 'underline' }}
                      onClick={() => setActiveTab('Catálogo')}
                    >
                      Explorar Catálogo
                    </button>
                  </td>
                </tr>
              ) : (
                myLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                        {loan.bookTitle}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                        {loan.author} • Tombo: <span className="mono-code">{loan.tombo}</span>
                      </div>
                    </td>
                    <td>{loan.checkoutDate}</td>
                    <td>
                      <strong
                        style={{
                          color:
                            loan.daysOverdue > 0
                              ? 'var(--color-danger-text)'
                              : 'var(--color-success-text)',
                        }}
                      >
                        {loan.dueDate}
                      </strong>
                    </td>
                    <td className="mono-code">
                      {loan.renewalsCount} de {BUSINESS_RULES.MAX_RENEWALS}
                    </td>
                    <td>
                      {loan.daysOverdue > 0 ? (
                        <span className="badge badge-danger">• Em Atraso ({loan.daysOverdue}d)</span>
                      ) : (
                        <span className="badge badge-success">• No prazo</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 14px', fontSize: '13px' }}
                        onClick={() => handleRenewClick(loan.id)}
                      >
                        Renovar +{BUSINESS_RULES.LOAN_DAYS}d
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção: Minhas Reservas Solicitadas */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h2 className="serif-title" style={{ fontSize: '23px' }}>
            Minhas Reservas Solicitadas
          </h2>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '13px', fontWeight: 600 }}
            onClick={() => setActiveTab('Reservas')}
          >
            Ver painel completo de reservas <ArrowRight size={15} />
          </button>
        </div>

        {myReservations.length === 0 ? (
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
            }}
          >
            Nenhuma reserva ou fila de espera solicitada no momento.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myReservations.map((res) => (
              <div
                key={res.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  backgroundColor: '#FCFBF8',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-deep-teal)' }}>
                    {res.bookTitle}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {res.author} • Solicitado em {res.requestDate} •{' '}
                    <span className="mono-code">{res.id}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {res.status === 'Em espera' ? (
                    <span className="badge badge-warning">
                      {res.queuePosition}º na fila de espera
                    </span>
                  ) : (
                    <span className="badge badge-success">
                      Pronta para retirada ({res.pickupDeadline})
                    </span>
                  )}

                  <button
                    className="btn btn-outline"
                    style={{ padding: '7px 14px', fontSize: '13px' }}
                    onClick={() => cancelReservation(res.id)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Renovação Confirmada com Sucesso (Frame 4.4.1 corrigido para +14d e até 5 renovações) */}
      {renewalModalData && (
        <div className="modal-backdrop" onClick={() => setRenewalModalData(null)}>
          <div className="modal-box success-top" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-success-bg)',
                  color: 'var(--color-success-text)',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                }}
              >
                <Check size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
                  Renovação Confirmada com Sucesso
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  O prazo para devolução foi estendido por mais {BUSINESS_RULES.LOAN_DAYS} dias (RF03).
                </p>
              </div>
            </div>

            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '18px 20px',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                rowGap: '12px',
                fontSize: '14px',
              }}
            >
              <span style={{ color: 'var(--color-text-secondary)' }}>Obra Renovada:</span>
              <strong style={{ color: 'var(--color-deep-teal)' }}>{renewalModalData.bookTitle}</strong>

              <span style={{ color: 'var(--color-text-secondary)' }}>Código do Exemplar:</span>
              <span className="mono-code" style={{ fontWeight: 700 }}>
                {renewalModalData.tombo}
              </span>

              <span style={{ color: 'var(--color-text-secondary)' }}>Prazo Anterior:</span>
              <span style={{ textDecoration: 'line-through', color: 'var(--color-text-secondary)' }}>
                {renewalModalData.previousDueDate}
              </span>

              <span style={{ color: 'var(--color-text-secondary)' }}>Nova Data Limite:</span>
              <div>
                <span className="badge badge-success" style={{ fontSize: '14px', fontWeight: 700 }}>
                  {renewalModalData.newDueDate}
                </span>
              </div>

              <span style={{ color: 'var(--color-text-secondary)' }}>Renovações Utilizadas:</span>
              <strong>
                {renewalModalData.renewalsCount} de {BUSINESS_RULES.MAX_RENEWALS} permitidas (RF09)
              </strong>
            </div>

            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderRadius: '6px',
                padding: '12px 16px',
                fontSize: '12.5px',
                color: 'var(--color-text-secondary)',
                marginBottom: '22px',
                lineHeight: 1.6,
              }}
            >
              <div>
                • Você ainda tem direito a mais{' '}
                <strong>
                  {BUSINESS_RULES.MAX_RENEWALS - renewalModalData.renewalsCount} renovação(ões)
                </strong>{' '}
                consecutiva(s) desta obra.
              </div>
              <div>• A renovação futura depende da ausência de reservas por outros alunos.</div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
              onClick={() => setRenewalModalData(null)}
            >
              Entendido / Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlunoDashboard;