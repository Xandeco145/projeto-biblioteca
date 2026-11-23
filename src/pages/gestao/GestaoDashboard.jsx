import React from 'react';
import {
  BookOpen,
  ArrowLeftRight,
  Bookmark,
  Users,
  CheckSquare,
  AlertCircle,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { dateFromToday, formatPercent } from '../../utils/format';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const dayLabel = (brDate) => `${brDate.slice(0, 2)} ${MONTHS[Number(brDate.slice(3, 5)) - 1]}`;

const ALERT_COLORS = {
  danger: 'var(--color-danger-text)',
  warning: 'var(--color-warning-text)',
  success: 'var(--color-success-text)',
  info: 'var(--color-deep-teal)',
};

const GestaoDashboard = () => {
  const {
    books,
    loans,
    loanHistory,
    reservations,
    users,
    staffAlerts,
    today,
    setActiveTab,
    getVisibleNotifications,
    markAllNotificationsRead,
  } = useLibrary();

  const totalCopies = books.reduce((acc, b) => acc + b.copies.length, 0);
  const readyReservations = reservations.filter((r) => r.status === 'Pronta para retirada').length;
  const waitingReservations = reservations.filter((r) => r.status === 'Em espera').length;
  const overdueLoans = loans.filter((l) => l.daysOverdue > 0).length;
  const dueToday = loans.filter((l) => l.dueDate === today).length;
  const activeUsersCount = users.filter((u) => u.status === 'Ativo').length;
  const suspendedCount = users.filter((u) => u.status === 'Suspenso').length;

  // Circulação dos últimos 7 dias calculada a partir dos registros reais
  const allCheckouts = [...loans, ...loanHistory];
  const buildSeries = (startOffset) =>
    Array.from({ length: 7 }, (_, i) => {
      const date = dateFromToday(startOffset + i);
      return {
        date,
        day: dayLabel(date),
        loans: allCheckouts.filter((l) => l.checkoutDate === date).length,
        returns: loanHistory.filter((h) => h.returnDate === date).length,
      };
    });
  const weeklyData = buildSeries(-6);
  const previousWeek = buildSeries(-13);
  const weekLoans = weeklyData.reduce((acc, d) => acc + d.loans, 0);
  const weekReturns = weeklyData.reduce((acc, d) => acc + d.returns, 0);
  const previousTotal = previousWeek.reduce((acc, d) => acc + d.loans + d.returns, 0);
  const currentTotal = weekLoans + weekReturns;
  const maxValue = Math.max(1, ...weeklyData.map((d) => Math.max(d.loans, d.returns)));
  const barHeight = (value) => (value === 0 ? 0 : Math.max(6, Math.round((value / maxValue) * 70)));

  let comparison = 'Sem movimentação na semana anterior para comparação';
  let comparisonColor = 'var(--color-text-secondary)';
  if (previousTotal > 0) {
    const variation = ((currentTotal - previousTotal) / previousTotal) * 100;
    comparison = `${variation >= 0 ? '+' : ''}${formatPercent(variation, 0)} de circulação vs. semana anterior`;
    comparisonColor = variation >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)';
  }

  const staffNotifications = getVisibleNotifications();
  const unreadNotifications = staffNotifications.filter((n) => !n.read).length;

  return (
    <div>
      {/* 4 KPIs Superiores (Fiel ao Frame 4.2.2) */}
      <div className="kpi-grid-4">
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Obras no acervo
            </span>
            <BookOpen size={18} color="#185266" />
          </div>
          <div className="kpi-value">{books.length}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            {totalCopies} exemplares cadastrados
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Empréstimos ativos
            </span>
            <ArrowLeftRight size={18} color="#185266" />
          </div>
          <div className="kpi-value">{loans.length}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            {dueToday} devolução(ões) prevista(s) hoje • {overdueLoans} em atraso
          </div>
        </div>

        <div className="kpi-card highlight-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Reservas ativas
            </span>
            <Bookmark size={18} color="#D68C45" />
          </div>
          <div className="kpi-value">{String(reservations.length).padStart(2, '0')}</div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-warning-text)' }}>
            {readyReservations} {readyReservations === 1 ? 'pronta' : 'prontas'} • {waitingReservations} em espera
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Usuários ativos
            </span>
            <Users size={18} color="#185266" />
          </div>
          <div className="kpi-value">{activeUsersCount}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            {suspendedCount} com pendências (RF05)
          </div>
        </div>
      </div>

      {/* Painel Central: Informações Detalhadas (Gráfico de Circulação Semanal) */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <h2 className="serif-title" style={{ fontSize: '24px' }}>
            Informações Detalhadas
          </h2>
          <span className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
            {weeklyData[0].day} — {weeklyData[6].day} {weeklyData[6].date.slice(6)}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '28px',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <strong style={{ fontSize: '14px', color: 'var(--color-deep-teal)' }}>
                Circulação nos últimos 7 dias
              </strong>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#0B303D' }} />
                  Empréstimos
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#D68C45' }} />
                  Devoluções
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '12px',
                alignItems: 'end',
                height: '130px',
                paddingTop: '12px',
              }}
            >
              {weeklyData.map((item) => (
                <div key={item.date} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      gap: '5px',
                      height: '96px',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: '4px',
                    }}
                  >
                    {[
                      { key: 'loans', value: item.loans, color: '#0B303D', label: 'Empréstimos' },
                      { key: 'returns', value: item.returns, color: '#D68C45', label: 'Devoluções' },
                    ].map((bar) => (
                      <div
                        key={bar.key}
                        title={`${bar.label} em ${item.date}: ${bar.value}`}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                      >
                        <span className="mono-code" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                          {bar.value}
                        </span>
                        <div
                          style={{
                            width: '14px',
                            height: `${barHeight(bar.value)}px`,
                            backgroundColor: bar.color,
                            borderRadius: '3px 3px 0 0',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    className="mono-code"
                    style={{
                      fontSize: '10.5px',
                      color: item.date === today ? 'var(--color-deep-teal)' : 'var(--color-text-secondary)',
                      fontWeight: item.date === today ? 700 : 400,
                      marginTop: '6px',
                    }}
                  >
                    {item.date === today ? 'HOJE' : item.day}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balanço da Semana */}
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '24px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-deep-teal)', marginBottom: '12px' }}>
              Balanço da semana
            </div>
            <div style={{ display: 'flex', gap: '28px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                  {weekLoans}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  empréstimos
                </div>
              </div>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                  {weekReturns}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  devoluções
                </div>
              </div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: comparisonColor }}>{comparison}</div>
          </div>
        </div>
      </div>

      {/* Linha Inferior: Rotina da Biblioteca (6 Atalhos) + Painel de Notificações */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="panel-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <h2 className="serif-title" style={{ fontSize: '24px' }}>
              Rotina da biblioteca
            </h2>
            <span className="overline-label">ACESSO RÁPIDO</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('Empréstimos', { type: 'new-loan' })}
              style={shortcutCardStyle}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeftRight size={16} color="#185266" /> Empréstimos
                </span>
                <ChevronRight size={16} color="#525E62" />
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Registrar nova saída
              </div>
            </button>

            <button type="button" onClick={() => setActiveTab('Empréstimos')} style={shortcutCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={16} color="#185266" /> Devoluções
                </span>
                <ChevronRight size={16} color="#525E62" />
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                {loans.length} em aberto no balcão
              </div>
            </button>

            <button type="button" onClick={() => setActiveTab('Reservas')} style={shortcutCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bookmark size={16} color="#185266" /> Reservas
                </span>
                <ChevronRight size={16} color="#525E62" />
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                {readyReservations} {readyReservations === 1 ? 'pronta' : 'prontas'} para retirada
              </div>
            </button>

            <button type="button" onClick={() => setActiveTab('Catálogo')} style={shortcutCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} color="#185266" /> Catálogo
                </span>
                <ChevronRight size={16} color="#525E62" />
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Consultar {books.length} obras
              </div>
            </button>

            <button type="button" onClick={() => setActiveTab('Usuários')} style={shortcutCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#185266" /> Usuários
                </span>
                <ChevronRight size={16} color="#525E62" />
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Gerenciar cadastros
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Empréstimos', { type: 'filter-status', status: 'Em Atraso' })}
              style={{
                ...shortcutCardStyle,
                backgroundColor: '#FDF2F2',
                borderColor: '#E8B8B8',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-danger-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> Pendências
                </span>
                <ChevronRight size={16} color="var(--color-danger-text)" />
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-danger-text)', marginTop: '6px', fontWeight: 600 }}>
                {overdueLoans} empréstimo(s) em atraso
              </div>
            </button>
          </div>
        </div>

        {/* Feed de Notificações (alertas automáticos + notificações da equipe) */}
        <div className="panel-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '8px',
            }}
          >
            <h2 className="serif-title" style={{ fontSize: '24px' }}>
              Notificações
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unreadNotifications > 0 && (
                <button
                  type="button"
                  className="btn-ghost"
                  title="Marcar notificações como lidas"
                  aria-label="Marcar notificações como lidas"
                  onClick={markAllNotificationsRead}
                  style={{ padding: '4px 6px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <span
                style={{
                  backgroundColor: '#0B303D',
                  color: '#FAF7F0',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '6px',
                }}
                title="Alertas ativos + notificações não lidas"
              >
                {staffAlerts.length + unreadNotifications}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
            {staffAlerts.length === 0 && staffNotifications.length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Nenhuma notificação no momento.
              </div>
            )}

            {staffAlerts.map((n) => (
              <div key={n.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: ALERT_COLORS[n.type], marginBottom: '3px' }}>
                  • {n.title}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  {n.message}
                </div>
              </div>
            ))}

            {staffNotifications.map((n) => (
              <div
                key={n.id}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '12px',
                  opacity: n.read ? 0.8 : 1,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: ALERT_COLORS[n.type] || ALERT_COLORS.info, marginBottom: '3px' }}>
                  • {n.title}
                  {!n.read && (
                    <span className="badge badge-warning" style={{ marginLeft: '6px', padding: '1px 6px', fontSize: '10.5px' }}>
                      Nova
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  {n.message}
                </div>
                <div className="mono-code" style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                  {n.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const shortcutCardStyle = {
  backgroundColor: '#FAF7F0',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '16px',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'all 0.15s ease',
};

export default GestaoDashboard;
