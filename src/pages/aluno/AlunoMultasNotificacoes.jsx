import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';
import { formatCurrency } from '../../utils/format';

const NOTIF_STYLE = {
  warning: { color: '#D68C45', Icon: AlertTriangle },
  danger: { color: '#A62626', Icon: AlertCircle },
  success: { color: '#1B6B4A', Icon: CheckCircle2 },
  info: { color: '#185266', Icon: Info },
};

const AlunoMultasNotificacoes = ({ initialSection = 'Multas' }) => {
  const {
    currentUser,
    fines,
    setActiveTab,
    getVisibleNotifications,
    markNotificationsRead,
    markAllNotificationsRead,
  } = useLibrary();

  // A seção acompanha a aba ativa (mantém Sidebar e cabeçalho sincronizados)
  const subTab = initialSection;

  const myFines = fines.filter((f) => f.userId === currentUser.id);
  const pendingFines = myFines.filter((f) => f.status === 'Pendente');
  const totalPending = pendingFines.reduce((acc, f) => acc + f.amount, 0);
  const isBlocked = currentUser.status === 'Suspenso';

  const myNotifications = getVisibleNotifications(currentUser);
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const fineBaseText = formatCurrency(BUSINESS_RULES.FINE_BASE);
  const finePerDayText = formatCurrency(BUSINESS_RULES.FINE_PER_DAY);

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
              ? `Regra RF08: taxa fixa de ${fineBaseText} + ${finePerDayText} por dia de atraso.`
              : 'Alertas automáticos sobre prazos de devolução, disponibilidade de reservas e pendências (RF16).'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${subTab === 'Multas' ? 'btn-teal' : 'btn-outline'}`}
            onClick={() => setActiveTab('Multas')}
          >
            <AlertCircle size={15} /> Multas e Débitos
          </button>
          <button
            type="button"
            className={`btn ${subTab === 'Notificações' ? 'btn-teal' : 'btn-outline'}`}
            onClick={() => setActiveTab('Notificações')}
          >
            <Bell size={15} /> Notificações ({unreadCount > 0 ? `${unreadCount} não lidas` : myNotifications.length})
          </button>
        </div>
      </div>

      {subTab === 'Multas' ? (
        <>
          {/* Card de Regra de Bloqueio (RF05) */}
          <div
            style={{
              backgroundColor: isBlocked ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
              border: `1px solid ${isBlocked ? '#E5B4B4' : '#B7E0CE'}`,
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
                color={isBlocked ? 'var(--color-danger-text)' : 'var(--color-success-text)'}
                style={{ flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: isBlocked ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                  }}
                >
                  {isBlocked
                    ? `Bloqueio Ativo (RF05): ${currentUser.blockReason}${totalPending > 0 ? ` • Débito total: ${formatCurrency(totalPending)}` : ''}`
                    : 'Situação Financeira Regular — Nenhum débito em aberto'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {isBlocked
                    ? 'Compareça ao balcão da Biblioteca Central para devolver o exemplar e quitar a multa. Novos empréstimos e renovações ficam bloqueados até a regularização.'
                    : `Você está apto a realizar empréstimos (até ${BUSINESS_RULES.MAX_ACTIVE_LOANS} obras simultâneas) e reservas no sistema.`}
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
                  <tr className="empty-row">
                    <td colSpan="7">Nenhum registro de multa encontrado para esta matrícula.</td>
                  </tr>
                ) : (
                  myFines.map((fine) => (
                    <tr key={fine.id}>
                      <td className="mono-code" style={{ fontWeight: 700 }}>
                        {fine.accruing ? 'Em apuração' : fine.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                          {fine.bookTitle}
                        </div>
                        <div className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                          Tombo: {fine.tombo}
                        </div>
                      </td>
                      <td>
                        {fine.accruing ? (
                          <>
                            <div>Venceu em {fine.date}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              Devolução pendente
                            </div>
                          </>
                        ) : (
                          fine.date
                        )}
                      </td>
                      <td>{fine.daysOverdue} dia(s)</td>
                      <td className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                        {fineBaseText} + ({fine.daysOverdue} × {finePerDayText})
                      </td>
                      <td>
                        <strong>{formatCurrency(fine.amount)}</strong>
                        {fine.accruing && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            valor parcial (acumulando)
                          </div>
                        )}
                      </td>
                      <td>
                        {fine.accruing ? (
                          <span className="badge badge-danger">• Em aberto — devolva o exemplar</span>
                        ) : fine.status === 'Pendente' ? (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Clique em uma notificação para marcá-la como lida.
            </span>
            <button
              type="button"
              className="btn btn-outline"
              onClick={markAllNotificationsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={15} /> Marcar todas como lidas
            </button>
          </div>

          {myNotifications.length === 0 ? (
            <div
              style={{
                border: '1px dashed var(--color-border-strong)',
                borderRadius: '10px',
                padding: '32px 24px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
              }}
            >
              Você não possui notificações no momento.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myNotifications.map((notif) => {
                const { color, Icon } = NOTIF_STYLE[notif.type] || NOTIF_STYLE.info;
                return (
                  <div
                    key={notif.id}
                    role={notif.read ? undefined : 'button'}
                    tabIndex={notif.read ? undefined : 0}
                    onClick={() => !notif.read && markNotificationsRead([notif.id])}
                    onKeyDown={(e) => {
                      if (!notif.read && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        markNotificationsRead([notif.id]);
                      }
                    }}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderLeft: `4px solid ${color}`,
                      borderRadius: '8px',
                      padding: '16px 20px',
                      backgroundColor: notif.read ? '#FFFFFF' : '#FCF9F2',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px',
                      cursor: notif.read ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Icon size={20} color={color} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {notif.title}
                          {!notif.read && <span className="badge badge-warning" style={{ padding: '2px 8px' }}>Nova</span>}
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
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AlunoMultasNotificacoes;
