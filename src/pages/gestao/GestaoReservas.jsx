import React, { useEffect, useState } from 'react';
import { Search, Plus, ChevronRight, AlertTriangle, XCircle } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';
import { getBookAvailability } from '../../utils/library';

const GestaoReservas = () => {
  const {
    reservations,
    books,
    users,
    createReservation,
    cancelReservation,
    registerLoan,
    pageIntent,
    clearPageIntent,
  } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showNewResModal, setShowNewResModal] = useState(false);
  const [newResBookId, setNewResBookId] = useState('book-6');
  const [newResUserId, setNewResUserId] = useState('u-5');
  const [modalError, setModalError] = useState('');
  const [actionError, setActionError] = useState('');

  const readers = users.filter((u) => u.role === 'aluno');
  const circulatingBooks = books.filter((b) => b.circulationType !== 'Consulta Local');
  const readyCount = reservations.filter((r) => r.status === 'Pronta para retirada').length;
  const waitingCount = reservations.filter((r) => r.status === 'Em espera').length;

  // Atalho vindo da ficha da obra ("Ver reserva" de um exemplar)
  useEffect(() => {
    if (!pageIntent) return;
    if (pageIntent.type === 'search') setSearchTerm(pageIntent.query || '');
    clearPageIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIntent]);

  const filteredReservations = reservations.filter((res) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      res.bookTitle.toLowerCase().includes(q) ||
      res.userName.toLowerCase().includes(q) ||
      res.userMatricula.toLowerCase().includes(q) ||
      res.id.toLowerCase().includes(q) ||
      (res.tomboAllocated || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'Todos' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateReservation = (e) => {
    e.preventDefault();
    const res = createReservation({ bookId: newResBookId, userId: newResUserId, origin: 'balcao' });
    if (!res.ok) {
      setModalError(res.error);
      return;
    }
    setModalError('');
    setShowNewResModal(false);
  };

  const handlePickup = (res) => {
    const result = registerLoan({
      bookId: res.bookId,
      tombo: res.tomboAllocated,
      userId: res.userId,
      reservationIdToFulfill: res.id,
    });
    setActionError(result.ok ? '' : `Retirada da reserva ${res.id} não permitida — ${result.error}`);
  };

  const handleCancel = (res) => {
    const question =
      res.status === 'Pronta para retirada'
        ? `Cancelar a reserva ${res.id} (${res.userName})? O exemplar ${res.tomboAllocated} será repassado ao próximo da fila ou devolvido ao acervo.`
        : `Remover ${res.userName} da fila de espera de "${res.bookTitle}"?`;
    if (window.confirm(question)) {
      cancelReservation(res.id, { byStaff: true });
      setActionError('');
    }
  };

  const selectedBookInfo = (() => {
    const book = books.find((b) => b.id === newResBookId);
    return book ? getBookAvailability(book) : null;
  })();

  return (
    <div className="panel-card">
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
            Reservas Ativas
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Acompanhe as retiradas no balcão ({BUSINESS_RULES.RESERVATION_HOLD_HOURS}h) e a fila de espera do acervo acadêmico.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
            {String(reservations.length).padStart(2, '0')}
          </div>
          <div className="overline-label">
            {readyCount} PRONTAS • {waitingCount} EM ESPERA
          </div>
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
            placeholder="Buscar por obra, usuário, matrícula, código ou tombo..."
            aria-label="Buscar reservas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!readers.some((u) => u.id === newResUserId) && readers[0]) setNewResUserId(readers[0].id);
            setModalError('');
            setShowNewResModal(true);
          }}
        >
          <Plus size={16} /> Nova Reserva
        </button>

        <select
          className="select-field"
          aria-label="Filtrar por status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos os status</option>
          <option value="Pronta para retirada">Pronta para retirada</option>
          <option value="Em espera">Em espera</option>
        </select>
      </div>

      {actionError && (
        <div role="alert" className="form-error" style={{ marginBottom: '16px', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: '8px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{actionError}</span>
          </span>
          <button
            type="button"
            className="btn-ghost"
            style={{ color: 'var(--color-danger-text)', fontWeight: 700, padding: '0 4px' }}
            onClick={() => setActionError('')}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Tabela de Reservas */}
      <div
        className="table-wrapper"
        style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Obra / Reserva</th>
              <th>Usuário / Matrícula</th>
              <th>Solicitação / Retirada</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 && (
              <tr className="empty-row">
                <td colSpan="5">
                  {reservations.length === 0
                    ? 'Nenhuma reserva ativa no momento.'
                    : 'Nenhuma reserva encontrada para os filtros informados.'}
                </td>
              </tr>
            )}
            {filteredReservations.map((res) => (
              <tr key={res.id}>
                <td>
                  <div className="serif-title" style={{ fontSize: '20px' }}>
                    {res.bookTitle}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                    {res.author} • <span className="mono-code">{res.id}</span>
                  </div>
                </td>

                <td>
                  <div style={{ fontWeight: 600 }}>{res.userName}</div>
                  <div className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                    {res.userMatricula}
                  </div>
                </td>

                <td>
                  <div style={{ fontWeight: 600 }}>{res.requestDate}</div>
                  <div style={{ fontSize: '12.5px', color: res.pickupExpired ? 'var(--color-danger-text)' : 'var(--color-text-secondary)' }}>
                    {res.status === 'Pronta para retirada'
                      ? `${res.pickupExpired ? 'Expirou em' : 'Retirar até'} ${res.pickupDeadline} às ${BUSINESS_RULES.PICKUP_CLOSING_HOUR}h`
                      : 'Aguardando devolução'}
                  </div>
                </td>

                <td>
                  {res.status === 'Pronta para retirada' ? (
                    <>
                      {res.pickupExpired ? (
                        <span className="badge badge-danger">• Prazo expirado</span>
                      ) : (
                        <span className="badge badge-success">• Pronta para retirada</span>
                      )}
                      <div className="mono-code" style={{ marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                        Exemplar {res.tomboAllocated}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="badge badge-info">• Em espera</span>
                      <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                        {res.queuePosition}º na fila de espera
                      </div>
                    </>
                  )}
                </td>

                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {res.status === 'Pronta para retirada' ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontWeight: 700 }}
                        onClick={() => handlePickup(res)}
                      >
                        Efetivar Retirada <ChevronRight size={15} />
                      </button>
                    ) : (
                      <span className="mono-code" style={{ color: 'var(--color-text-secondary)', marginRight: '6px' }}>
                        Fila #{res.queuePosition}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      title="Cancelar reserva"
                      aria-label={`Cancelar reserva ${res.id}`}
                      style={{ color: 'var(--color-danger-text)' }}
                      onClick={() => handleCancel(res)}
                    >
                      <XCircle size={15} /> Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Reserva pelo Balcão */}
      {showNewResModal && (
        <div className="modal-backdrop" onClick={() => setShowNewResModal(false)}>
          <div className="modal-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Registrar Reserva no Balcão
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Reserva automaticamente um exemplar disponível ou posiciona o leitor na fila de espera.
            </p>

            <form onSubmit={handleCreateReservation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="res-book" style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                  Obra *
                </label>
                <select
                  id="res-book"
                  className="select-field"
                  style={{ width: '100%' }}
                  value={newResBookId}
                  onChange={(e) => {
                    setNewResBookId(e.target.value);
                    setModalError('');
                  }}
                >
                  {circulatingBooks.map((b) => {
                    const info = getBookAvailability(b);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.author}) — {info.available > 0 ? `${info.available} disponível(is)` : 'fila de espera'}
                      </option>
                    );
                  })}
                </select>
                {selectedBookInfo && (
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                    {selectedBookInfo.available > 0
                      ? `Um exemplar será separado no Armário Balcão A por ${BUSINESS_RULES.RESERVATION_HOLD_HOURS}h.`
                      : `Sem exemplares disponíveis: o leitor entrará na fila de espera${selectedBookInfo.nextReturnDate ? ` (próxima devolução prevista: ${selectedBookInfo.nextReturnDate})` : ''}.`}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="res-user" style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                  Leitor *
                </label>
                <select
                  id="res-user"
                  className="select-field"
                  style={{ width: '100%' }}
                  value={newResUserId}
                  onChange={(e) => {
                    setNewResUserId(e.target.value);
                    setModalError('');
                  }}
                >
                  {readers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.matricula} — {u.name} ({u.roleLabel})
                    </option>
                  ))}
                </select>
              </div>

              {modalError && (
                <div role="alert" className="form-error">
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{modalError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowNewResModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoReservas;
