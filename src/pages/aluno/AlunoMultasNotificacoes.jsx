import React, { useState, useEffect } from 'react';
import { AlertCircle, Bell, CheckCheck, Info, ShieldAlert } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';

const AlunoMultasNotificacoes = ({ initialSection = 'Multas' }) => {
  const { currentUser, fines, notifications, markAllNotificationsRead } = useLibrary();
  const [subTab, setSubTab] = useState(initialSection);

  useEffect(() => {
    setSubTab(initialSection);
  }, [initialSection]);

  const myFines = fines.filter((f) => f.userId === currentUser.id);
  const pendingFines = myFines.filter((f) => f.status === 'Pendente');
  const totalPending = pendingFines.reduce((acc, f) => acc + f.amount, 0);

  const studentNotifications = notifications.filter((n) => n.targetRole === 'aluno');

  return (
    <div className="panel-card">
      {/* Navegação Interna entre Multas e Notificações */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '16px',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="serif-title" style={{ fontSize: '30px', marginBottom: '4px' }}>
            {subTab === 'Multas'
              ? 'Consulta de Multas e Situação Financeira'
              : 'Central de Notificações do Leitor'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {subTab === 'Multas'
              ? `Regra RF08: Taxa fixa de R$ ${BUSINESS_RULES.FINE_BASE.toFixed(2).replace('.', ',')} + R$ ${BUSINESS_RULES.FINE_PER_DAY.toFixed(2).replace('.', ',')} por dia de atraso.`
              : 'Alertas automáticos sobre prazos de devolução, disponibilidade de reservas e pendências (RF16).'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${subTab === 'Multas' ? 'btn-teal' : 'btn-outline'}`}
            onClick={() => setSubTab('Multas')}
          >
            <AlertCircle size={15} /> Multas e Débitos
          </button>
          <button
            className={`btn ${subTab === 'Notificações' ? 'btn-teal' : 'btn-outline'}`}
            onClick={() => setSubTab('Notificações')}
          >
            <Bell size={15} /> Notificações ({studentNotifications.length})
          </button>
        </div>
      </div>

      {subTab === 'Multas' ? (
        <>
          {/* Card de Regra de Bloqueio (RF05) */}
          <div
            style={{
              backgroundColor: totalPending > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
              border: `1px solid ${totalPending > 0 ? '#E5B4B4' : '#B7E0CE'}`,
              borderRadius: '10px',
              padding: '18px 20px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert
                size={24}
                color={totalPending > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)'}
              />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: totalPending > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                  }}
                >
                  {totalPending > 0
                    ? `Bloqueio Ativo (RF05): Débito pendente de R$ ${totalPending.toFixed(2).replace('.', ',')}`
                    : 'Situação Financeira Regular — Nenhum débito em aberto'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {totalPending > 0
                    ? 'Compareça ao balcão da Biblioteca Central para quitar a multa e liberar novos empréstimos.'
                    : 'Você está apto a realizar empréstimos (até 2 obras simultâneas) e reservas no sistema.'}
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Multas do Aluno */}
          <div
            className="table-wrapper"
            style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Obra / Tombo</th>
                  <th>Data</th>
                  <th>Atraso</th>
                  <th>Cálculo (RF08)</th>
                  <th>Valor Total</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {myFines.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                      Nenhum registro de multa encontrado para esta matrícula.
                    </td>
                  </tr>
                ) : (
                  myFines.map((fine) => (
                    <tr key={fine.id}>
                      <td className="mono-code" style={{ fontWeight: 700 }}>
                        {fine.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                          {fine.bookTitle}
                        </div>
                        <div className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                          Tombo: {fine.tombo}
                        </div>
                      </td>
                      <td>{fine.date}</td>
                      <td>{fine.daysOverdue} dia(s)</td>
                      <td className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                        R$ 5,00 + ({fine.daysOverdue} × R$ 2,00)
                      </td>
                      <td>
                        <strong>R$ {fine.amount.toFixed(2).replace('.', ',')}</strong>
                      </td>
                      <td>
                        {fine.status === 'Pendente' ? (
                          <span className="badge badge-danger">• Pendente no balcão</span>
                        ) : (
                          <span className="badge badge-success">• Quitada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button className="btn btn-outline" onClick={markAllNotificationsRead}>
              <CheckCheck size={15} /> Marcar todas como lidas
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {studentNotifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderLeft: `4px solid ${
                    notif.type === 'warning' ? '#D68C45' : '#185266'
                  }`,
                  borderRadius: '8px',
                  padding: '16px 20px',
                  backgroundColor: notif.read ? '#FFFFFF' : '#FCF9F2',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Info
                    size={20}
                    color={notif.type === 'warning' ? '#D68C45' : '#185266'}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', marginBottom: '4px' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {notif.message}
                    </div>
                  </div>
                </div>
                <span className="mono-code" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                  {notif.time}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AlunoMultasNotificacoes;