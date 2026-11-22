import React from 'react';
import { Bookmark, Clock, MapPin, PlusCircle, XCircle } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';
import { getBookAvailability } from '../../utils/library';

const AlunoReservas = () => {
  const { currentUser, reservations, books, cancelReservation, setActiveTab } = useLibrary();

  const myReservations = reservations.filter((r) => r.userId === currentUser.id);
  const readyCount = myReservations.filter((r) => r.status === 'Pronta para retirada').length;
  const waitingCount = myReservations.filter((r) => r.status === 'Em espera').length;

  const pickupText = (res) => {
    if (res.status === 'Pronta para retirada') {
      return res.pickupExpired
        ? `Prazo de retirada expirado em ${res.pickupDeadline}`
        : `Retirar até ${res.pickupDeadline} às ${BUSINESS_RULES.PICKUP_CLOSING_HOUR}h`;
    }
    const book = books.find((b) => b.id === res.bookId);
    const next = book ? getBookAvailability(book).nextReturnDate : null;
    return next ? `Aguardando devolução (prev. ${next})` : 'Aguardando devolução';
  };

  const handleCancel = (res) => {
    const question =
      res.status === 'Pronta para retirada'
        ? `Cancelar a reserva ${res.id} de "${res.bookTitle}"? O exemplar separado será liberado.`
        : `Sair da fila de espera de "${res.bookTitle}"?`;
    if (window.confirm(question)) cancelReservation(res.id);
  };

  return (
    <div className="panel-card">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="serif-title" style={{ fontSize: '30px', marginBottom: '4px' }}>
            Minhas Reservas e Fila de Espera
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Acompanhe exemplares separados para retirada no balcão e sua posição nas filas de espera.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={() => setActiveTab('Catálogo')}>
          <PlusCircle size={16} /> Nova Reserva no Catálogo
        </button>
      </div>

      {/* KPIs das Reservas do Aluno */}
      <div className="kpi-grid-3">
        <div className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
          <div className="overline-label">TOTAL DE SOLICITAÇÕES</div>
          <div className="kpi-value">{myReservations.length}</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Reservas ativas vinculadas à matrícula {currentUser.matricula}
          </div>
        </div>

        <div className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
          <div className="overline-label">PRONTAS PARA RETIRADA</div>
          <div className="kpi-value" style={{ color: 'var(--color-success-text)' }}>
            {readyCount}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-success-text)', fontWeight: 600 }}>
            Prazo máximo de {BUSINESS_RULES.RESERVATION_HOLD_HOURS}h no balcão térreo
          </div>
        </div>

        <div className="kpi-card highlight-amber">
          <div className="overline-label">EM FILA DE ESPERA</div>
          <div className="kpi-value" style={{ color: 'var(--color-warning-text)' }}>
            {waitingCount}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-warning-text)', fontWeight: 600 }}>
            Notificação automática assim que um exemplar for devolvido
          </div>
        </div>
      </div>

      {/* Lista Detalhada */}
      {myReservations.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--color-border-strong)',
            borderRadius: '10px',
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <Bookmark size={32} color="#525E62" style={{ marginBottom: '10px' }} />
          <h3 className="serif-title" style={{ fontSize: '22px', marginBottom: '6px' }}>
            Nenhuma reserva ativa no momento
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Consulte o catálogo da Biblioteca Central para reservar exemplares disponíveis ou entrar na fila de espera.
          </p>
          <button type="button" className="btn btn-teal" onClick={() => setActiveTab('Catálogo')}>
            Ir para o Catálogo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {myReservations.map((res) => (
            <div
              key={res.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                backgroundColor: '#FCFBF8',
              }}
            >
              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span className="mono-code badge badge-neutral">{res.id}</span>
                  {res.status === 'Pronta para retirada' ? (
                    res.pickupExpired ? (
                      <span className="badge badge-danger">• Prazo de retirada expirado</span>
                    ) : (
                      <span className="badge badge-success">• Pronta para retirada</span>
                    )
                  ) : (
                    <span className="badge badge-warning">
                      • {res.queuePosition}º lugar na fila de espera
                    </span>
                  )}
                </div>

                <h3 className="serif-title" style={{ fontSize: '22px', marginBottom: '4px' }}>
                  {res.bookTitle}
                </h3>
                <div style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
                  Autor: <strong>{res.author}</strong> • Solicitado em {res.requestDate}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#F4F0E8',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  minWidth: '240px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Clock size={14} color="#185266" />
                  <span>{pickupText(res)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <MapPin size={14} color="#185266" />
                  <span>
                    {res.tomboAllocated
                      ? `Exemplar ${res.tomboAllocated} • Balcão Térreo`
                      : 'Aguardando retorno ao acervo'}
                  </span>
                </div>
              </div>

              <button type="button" className="btn btn-danger-outline" onClick={() => handleCancel(res)}>
                <XCircle size={15} /> Cancelar Solicitação
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlunoReservas;
