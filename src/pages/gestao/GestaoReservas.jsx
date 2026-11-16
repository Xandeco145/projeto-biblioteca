import React, { useState } from 'react';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

const GestaoReservas = () => {
  const { reservations, books, users, createReservation, registerLoan } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showNewResModal, setShowNewResModal] = useState(false);
  const [newResBookId, setNewResBookId] = useState('book-1');
  const [newResUserId, setNewResUserId] = useState('u-5');

  const readyCount = reservations.filter((r) => r.status === 'Pronta para retirada').length;
  const waitingCount = reservations.filter((r) => r.status === 'Em espera').length;

  const filteredReservations = reservations.filter((res) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      res.bookTitle.toLowerCase().includes(q) ||
      res.userName.toLowerCase().includes(q) ||
      res.userMatricula.toLowerCase().includes(q) ||
      res.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'Todos' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateReservation = (e) => {
    e.preventDefault();
    createReservation({ bookId: newResBookId, userId: newResUserId });
    setShowNewResModal(false);
  };

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
            Acompanhe as retiradas no balcão e a fila de espera do acervo acadêmico.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
            0{reservations.length}
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
            placeholder="Buscar por obra, usuário ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowNewResModal(true)}>
          Nova Reserva <Plus size={16} />
        </button>

        <select
          className="select-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos os status</option>
          <option value="Pronta para retirada">Pronta para retirada</option>
          <option value="Em espera">Em espera</option>
        </select>
      </div>

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
              <th>Reserva / Retirada</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
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
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                    {res.pickupDeadline}
                  </div>
                </td>

                <td>
                  {res.status === 'Pronta para retirada' ? (
                    <>
                      <span className="badge badge-success">• Pronta para retirada</span>
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
                  {res.status === 'Pronta para retirada' ? (
                    <button
                      className="btn btn-ghost"
                      style={{ fontWeight: 700 }}
                      onClick={() =>
                        registerLoan({
                          bookId: res.bookId,
                          tombo: res.tomboAllocated,
                          userId: res.userId,
                          reservationIdToFulfill: res.id,
                        })
                      }
                    >
                      Efetivar Retirada <ChevronRight size={15} />
                    </button>
                  ) : (
                    <span className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                      Fila #{res.queuePosition}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Reserva pelo Balcão */}
      {showNewResModal && (
        <div className="modal-backdrop" onClick={() => setShowNewResModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Registrar Reserva no Balcão
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Reserva automaticamente um exemplar disponível ou posiciona o leitor na fila de espera.
            </p>

            <form onSubmit={handleCreateReservation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                  Obra *
                </label>
                <select
                  className="select-field"
                  style={{ width: '100%' }}
                  value={newResBookId}
                  onChange={(e) => setNewResBookId(e.target.value)}
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.author})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                  Leitor *
                </label>
                <select
                  className="select-field"
                  style={{ width: '100%' }}
                  value={newResUserId}
                  onChange={(e) => setNewResUserId(e.target.value)}
                >
                  {users
                    .filter((u) => u.role === 'aluno')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.matricula} — {u.name}
                      </option>
                    ))}
                </select>
              </div>

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