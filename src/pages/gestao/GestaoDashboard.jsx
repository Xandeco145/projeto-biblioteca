import React from 'react';
import {
  BookOpen,
  ArrowLeftRight,
  Bookmark,
  Users,
  CheckSquare,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

const WEEKLY_DATA = [
  { day: '29 SET', loans: 24, returns: 19 },
  { day: '30 SET', loans: 31, returns: 26 },
  { day: '01 OUT', loans: 38, returns: 29 },
  { day: '02 OUT', loans: 34, returns: 31 },
  { day: '03 OUT', loans: 16, returns: 14 },
  { day: '04 OUT', loans: 8, returns: 5 },
  { day: '05 OUT', loans: 19, returns: 13 },
];

const GestaoDashboard = () => {
  const { books, loans, reservations, users, notifications, setActiveTab } = useLibrary();

  const readyReservations = reservations.filter((r) => r.status === 'Pronta para retirada').length;
  const waitingReservations = reservations.filter((r) => r.status === 'Em espera').length;
  const overdueLoans = loans.filter((l) => l.daysOverdue > 0).length;
  const activeUsersCount = users.filter((u) => u.status === 'Ativo').length;
  const staffNotifications = notifications.filter((n) => n.targetRole === 'staff');

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
          <div className="kpi-value">{1241 + books.length}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            +24 neste mês
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Empréstimos ativos
            </span>
            <ArrowLeftRight size={18} color="#185266" />
          </div>
          <div className="kpi-value">{182 + loans.length}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            12 devoluções previstas hoje
          </div>
        </div>

        <div className="kpi-card highlight-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Reservas ativas
            </span>
            <Bookmark size={18} color="#D68C45" />
          </div>
          <div className="kpi-value">0{reservations.length}</div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-warning-text)' }}>
            {readyReservations} prontas • {waitingReservations} em espera
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Usuários ativos
            </span>
            <Users size={18} color="#185266" />
          </div>
          <div className="kpi-value">{835 + activeUsersCount}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            +18 neste mês
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
            29 SET — 05 OUT 2026
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
              }}
            >
              <strong style={{ fontSize: '14px', color: 'var(--color-deep-teal)' }}>
                Circulação nos últimos 7 dias
              </strong>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      backgroundColor: '#0B303D',
                    }}
                  />
                  Empréstimos
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      backgroundColor: '#D68C45',
                    }}
                  />
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
                height: '120px',
                paddingTop: '12px',
              }}
            >
              {WEEKLY_DATA.map((item) => (
                <div key={item.day} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      gap: '5px',
                      height: '88px',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: '4px',
                    }}
                  >
                    <div
                      title={`Empréstimos: ${item.loans}`}
                      style={{
                        width: '14px',
                        height: `${item.loans * 2}px`,
                        backgroundColor: '#0B303D',
                        borderRadius: '3px 3px 0 0',
                      }}
                    />
                    <div
                      title={`Devoluções: ${item.returns}`}
                      style={{
                        width: '14px',
                        height: `${item.returns * 2}px`,
                        backgroundColor: '#D68C45',
                        borderRadius: '3px 3px 0 0',
                      }}
                    />
                  </div>
                  <div
                    className="mono-code"
                    style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}
                  >
                    {item.day}
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
                  156
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  empréstimos
                </div>
              </div>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                  128
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  devoluções
                </div>
              </div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success-text)' }}>
              +12% de circulação vs. semana anterior
            </div>
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
              onClick={() => setActiveTab('Empréstimos')}
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

            <button
              type="button"
              onClick={() => setActiveTab('Empréstimos')}
              style={shortcutCardStyle}
            >
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

            <button
              type="button"
              onClick={() => setActiveTab('Reservas')}
              style={shortcutCardStyle}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bookmark size={16} color="#185266" /> Reservas
                </span>
                <ChevronRight size={16} color="#525E62" />
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                {readyReservations} prontas para retirada
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Catálogo')}
              style={shortcutCardStyle}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} color="#185266" /> Catálogo
                </span>
                <ChevronRight size={16} color="#525E62" />
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Consultar 1.248 obras
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Usuários')}
              style={shortcutCardStyle}
            >
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
              onClick={() => setActiveTab('Empréstimos')}
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

        {/* Feed de Notificações */}
        <div className="panel-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2 className="serif-title" style={{ fontSize: '24px' }}>
              Notificações
            </h2>
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
            >
              {staffNotifications.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {staffNotifications.map((n) => (
              <div
                key={n.id}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color:
                      n.type === 'danger'
                        ? 'var(--color-danger-text)'
                        : n.type === 'warning'
                        ? 'var(--color-warning-text)'
                        : 'var(--color-deep-teal)',
                    marginBottom: '3px',
                  }}
                >
                  • {n.title}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  {n.message}
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