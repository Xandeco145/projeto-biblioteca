import React, { useState } from 'react';
import { Search, ChevronRight, Users, MapPin } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';

const AlunoCatalogo = () => {
  const { currentUser, books, categories, reservations, createReservation } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const [reserveModalBook, setReserveModalBook] = useState(null);
  const [queueModalBook, setQueueModalBook] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');

  const filteredBooks = books.filter((book) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === 'Todas' || book.category === selectedCategory;

    const availableCopies = book.copies.filter((c) => c.status === 'Disponível').length;
    const isLocalOnly = book.circulationType === 'Consulta Local';

    let bookStatus = 'Emprestado';
    if (isLocalOnly) bookStatus = 'Consulta local';
    else if (availableCopies > 0) bookStatus = 'Disponível';

    const matchesStatus = selectedStatus === 'Todos' || bookStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleConfirmReserve = (book) => {
    const res = createReservation({ bookId: book.id, userId: currentUser.id });
    if (!res.ok) {
      setFeedbackError(res.error);
    } else {
      setFeedbackError('');
      setReserveModalBook(null);
      setQueueModalBook(null);
    }
  };

  return (
    <div className="panel-card">
      {/* Cabeçalho da Seção (Fiel ao Frame 4.3.1 com título serifado padronizado) */}
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
            Livros do Acervo
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Consulte, organize e acompanhe a disponibilidade em tempo real das obras acadêmicas.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
            1.248
          </div>
          <div className="overline-label">OBRAS NO ACERVO</div>
        </div>
      </div>

      {/* Barra de Busca e Filtros (RF11 e RF12) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px 190px',
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
            placeholder="Buscar por título, autor ou ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-field"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="Todas">Categorias: Todas</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          className="select-field"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="Todos">Status: Todos</option>
          <option value="Disponível">Disponível</option>
          <option value="Emprestado">Emprestado</option>
          <option value="Consulta local">Consulta local</option>
        </select>
      </div>

      {/* Tabela de Obras (Fiel ao Frame 4.3.1 do Figma) */}
      <div
        className="table-wrapper"
        style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Título e autoria</th>
              <th>Categoria / CDD</th>
              <th>Localização Física</th>
              <th>Disponibilidade</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => {
              const availableCopies = book.copies.filter((c) => c.status === 'Disponível');
              const totalCopies = book.copies.length;
              const isLocalOnly = book.circulationType === 'Consulta Local';
              const alreadyReserved = reservations.some(
                (r) => r.bookId === book.id && r.userId === currentUser.id
              );

              return (
                <tr key={book.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Miniatura da Capa */}
                      <div
                        style={{
                          width: '34px',
                          height: '46px',
                          backgroundColor: book.coverColor,
                          color: '#FAF7F0',
                          borderRadius: '3px',
                          padding: '4px',
                          fontSize: '7px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          flexShrink: 0,
                          borderLeft: '3px solid #D68C45',
                        }}
                      >
                        {book.coverShort}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                          {book.title}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                          {book.author} • {book.publisher} • {book.year}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{book.category}</div>
                    <div className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                      {book.cdd}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{book.location}</div>
                    {availableCopies.length === 0 && !isLocalOnly ? (
                      <div style={{ fontSize: '12px', color: 'var(--color-danger-text)', fontWeight: 600 }}>
                        Devolução prev.: {book.nextReturnDate || '22/10/2026'}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {book.sector}
                      </div>
                    )}
                  </td>

                  <td>
                    {isLocalOnly ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-info-text)', fontSize: '13px' }}>
                          • Consulta local
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {totalCopies} exemplares
                        </div>
                      </>
                    ) : availableCopies.length > 0 ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-success-text)', fontSize: '13px' }}>
                          • Disponível
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {availableCopies.length} de {totalCopies} exemplares
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-danger-text)', fontSize: '13px' }}>
                          • Emprestado
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          0 de {totalCopies} exemplares
                        </div>
                      </>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {isLocalOnly ? (
                      <button className="btn btn-outline" disabled style={{ fontSize: '12.5px' }}>
                        Uso no Recinto
                      </button>
                    ) : alreadyReserved ? (
                      <span className="badge badge-info">Solicitado</span>
                    ) : availableCopies.length > 0 ? (
                      <button
                        className="btn btn-primary"
                        style={{ minWidth: '126px', padding: '8px 14px' }}
                        onClick={() => {
                          setFeedbackError('');
                          setReserveModalBook(book);
                        }}
                      >
                        Reservar <ChevronRight size={15} />
                      </button>
                    ) : (
                      <button
                        className="btn btn-teal"
                        style={{ minWidth: '126px', padding: '8px 14px' }}
                        onClick={() => {
                          setFeedbackError('');
                          setQueueModalBook(book);
                        }}
                      >
                        Entrar na Fila <ChevronRight size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Confirmar Reserva de Exemplar Disponível (Frame 4.4.1 com prazo 14 dias RF3) */}
      {reserveModalBook && (
        <div className="modal-backdrop" onClick={() => setReserveModalBook(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Confirmar Reserva de Exemplar
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Verifique os dados da obra e as condições de retirada no balcão.
            </p>

            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '66px',
                  backgroundColor: reserveModalBook.coverColor,
                  color: '#FAF7F0',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderLeft: '3px solid #D68C45',
                }}
              >
                {reserveModalBook.coverShort}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-deep-teal)' }}>
                  {reserveModalBook.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {reserveModalBook.author} • Editora {reserveModalBook.publisher} • {reserveModalBook.year}
                </div>
                <div className="mono-code" style={{ marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                  Exemplar atribuído:{' '}
                  {reserveModalBook.copies.find((c) => c.status === 'Disponível')?.tombo} (Circulação Livre)
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success-text)', marginTop: '4px' }}>
                  Status: Disponível imediatamente para separação
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderRadius: '8px',
                padding: '16px 18px',
                marginBottom: '20px',
                fontSize: '13.5px',
                lineHeight: 1.7,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', marginBottom: '6px' }}>
                Informações de Retirada e Prazos:
              </div>
              <div>
                • Local de Retirada: <strong>Balcão da Biblioteca Central (Térreo)</strong>
              </div>
              <div>
                • Prazo para Retirada:{' '}
                <strong style={{ color: 'var(--color-warning-text)' }}>
                  Até {BUSINESS_RULES.RESERVATION_HOLD_HOURS} horas após a reserva (21/10 às 18h)
                </strong>
              </div>
              <div>
                • Prazo de Empréstimo:{' '}
                <strong>{BUSINESS_RULES.LOAN_DAYS} dias corridos a partir da retirada (RF03)</strong>
              </div>
              <div>
                • Notificação: <strong>Enviada para {currentUser.email}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Nota: Caso não retire no prazo, a reserva expira e a obra retorna ao acervo geral.
              </div>
            </div>

            {feedbackError && (
              <div style={{ color: 'var(--color-danger-text)', fontSize: '13px', marginBottom: '12px' }}>
                {feedbackError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setReserveModalBook(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleConfirmReserve(reserveModalBook)}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Entrar na Fila de Espera (Frame 4.4.1 / fila.PNG) */}
      {queueModalBook && (
        <div className="modal-backdrop" onClick={() => setQueueModalBook(null)}>
          <div className="modal-box teal-top" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Entrar na Fila de Espera
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Todos os exemplares desta obra encontram-se atualmente emprestados.
            </p>

            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '66px',
                  backgroundColor: queueModalBook.coverColor,
                  color: '#FAF7F0',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderLeft: '3px solid #D68C45',
                }}
              >
                {queueModalBook.coverShort}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-deep-teal)' }}>
                  {queueModalBook.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {queueModalBook.author} • {queueModalBook.publisher} • {queueModalBook.year}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                  Total de exemplares: {queueModalBook.copies.length} (0 disponíveis no momento)
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-danger-text)', marginTop: '3px' }}>
                  • Emprestados até {queueModalBook.nextReturnDate || '22/10/2026'}
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderRadius: '8px',
                padding: '16px 18px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #185266',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--color-deep-teal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} /> Sua posição na fila de espera:
                </span>
                <strong style={{ color: 'var(--color-warning-text)', fontSize: '16px' }}>
                  {reservations.filter((r) => r.bookId === queueModalBook.id && r.status === 'Em espera').length + 1}º Lugar
                </strong>
              </div>

              <div style={{ fontSize: '13.5px', lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', marginBottom: '4px' }}>
                  Condições e Notificação da Fila:
                </div>
                <div>
                  • Próxima Devolução Estimada:{' '}
                  <strong>{queueModalBook.nextReturnDate || '22/10/2026'} às 18:00</strong>
                </div>
                <div>
                  • Aviso de Liberação: <strong>Disparo automático via e-mail ({currentUser.email}) e portal</strong>
                </div>
                <div>
                  • Tempo de Garantia:{' '}
                  <strong style={{ color: 'var(--color-success-text)' }}>
                    24 horas reservado no balcão
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setQueueModalBook(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-teal"
                onClick={() => handleConfirmReserve(queueModalBook)}
              >
                Entrar na Fila
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlunoCatalogo;