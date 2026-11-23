import React, { useEffect, useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Plus,
  FolderPlus,
  BookPlus,
  AlertTriangle,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';
import { getBookAvailability } from '../../utils/library';

const emptyBookForm = (categories) => {
  const defaultCategory = categories.find((c) => c.name === 'Informática') || categories[0];
  return {
    title: '',
    author: '',
    publisher: '',
    year: String(new Date().getFullYear()),
    edition: '1ª Edição',
    isbn: '',
    category: defaultCategory?.name || '',
    cdd: defaultCategory?.cdd || '',
    location: 'Estante D • Prat. 2',
    sector: 'Setor de Tecnologia',
    circulationType: 'Circulação Livre',
    copiesCount: 2,
  };
};

const COPY_BADGES = {
  Disponível: { className: 'badge-success', label: '• Disponível' },
  Emprestado: { className: 'badge-warning', label: '• Emprestado' },
  Reservado: { className: 'badge-info', label: `• Retirada ${BUSINESS_RULES.RESERVATION_HOLD_HOURS}h` },
  'Consulta local': { className: 'badge-info', label: '• Sala de Leitura' },
  'Em reparo': { className: 'badge-danger', label: '• Em reparo' },
  'Baixa contábil': { className: 'badge-neutral', label: '• Baixa contábil' },
};

const ErrorBox = ({ message }) =>
  message ? (
    <div role="alert" className="form-error">
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>{message}</span>
    </div>
  ) : null;

const GestaoCatalogo = () => {
  const {
    books,
    users,
    categories,
    reservations,
    selectedBookId,
    setSelectedBookId,
    addBook,
    addCategory,
    registerLoan,
    createReservation,
    setActiveTab,
    pageIntent,
    clearPageIntent,
  } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  // Modais
  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [quickLoanCopy, setQuickLoanCopy] = useState(null);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('u-2');
  const [reserveUserId, setReserveUserId] = useState('u-5');
  const [modalError, setModalError] = useState('');

  // Form Nova Obra (RF01: título, autor, editora, ano, ISBN, gênero/categoria, localização e exemplares)
  const [bookForm, setBookForm] = useState(() => emptyBookForm(categories));

  // Form Nova Categoria (RF15)
  const [catForm, setCatForm] = useState({ name: '', cdd: '', description: '' });

  const readers = users.filter((u) => u.role === 'aluno');
  const selectedBook = books.find((b) => b.id === selectedBookId);

  // Garante que o leitor pré-selecionado ainda é um leitor válido (ex.: após mudança de perfil)
  const ensureReader = (currentId, setter) => {
    if (!readers.some((u) => u.id === currentId) && readers[0]) setter(readers[0].id);
  };

  const openNewBookModal = () => {
    setBookForm(emptyBookForm(categories));
    setModalError('');
    setShowNewBookModal(true);
  };

  // Atalhos vindos de outras telas (Inventário e Relatórios → "Cadastrar Livro")
  useEffect(() => {
    if (!pageIntent) return;
    if (pageIntent.type === 'new-book') openNewBookModal();
    clearPageIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIntent]);

  const handleCreateBook = (e) => {
    e.preventDefault();
    const res = addBook(bookForm);
    if (!res.ok) {
      setModalError(res.error);
      return;
    }
    setModalError('');
    setShowNewBookModal(false);
  };

  const handleCategoryChange = (name) => {
    const cat = categories.find((c) => c.name === name);
    setBookForm({ ...bookForm, category: name, cdd: cat ? cat.cdd : bookForm.cdd });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    const res = addCategory(catForm);
    if (!res.ok) {
      setModalError(res.error);
      return;
    }
    setModalError('');
    setCatForm({ name: '', cdd: '', description: '' });
  };

  const handleQuickLoanSubmit = (e) => {
    e.preventDefault();
    const res = registerLoan({
      bookId: selectedBook.id,
      tombo: quickLoanCopy.tombo,
      userId: selectedBorrowerId,
    });
    if (!res.ok) {
      setModalError(res.error);
    } else {
      setModalError('');
      setQuickLoanCopy(null);
    }
  };

  const handleReserveSubmit = (e) => {
    e.preventDefault();
    const res = createReservation({ bookId: selectedBook.id, userId: reserveUserId, origin: 'balcao' });
    if (!res.ok) {
      setModalError(res.error);
    } else {
      setModalError('');
      setShowReserveModal(false);
    }
  };

  // TELA DE DETALHES DA OBRA E EXEMPLARES (Frame 4.4.2 / detalhes das obras.PNG)
  if (selectedBook) {
    const info = getBookAvailability(selectedBook);
    const queue = reservations.filter((r) => r.bookId === selectedBook.id && r.status === 'Em espera');
    const nextQueuePosition = queue.length + 1;

    return (
      <div className="panel-card">
        <button
          type="button"
          className="btn-ghost"
          style={{ color: 'var(--color-warning-text)', fontWeight: 700, marginBottom: '14px', paddingLeft: 0 }}
          onClick={() => setSelectedBookId(null)}
        >
          <ChevronLeft size={16} /> Voltar para a lista de livros
        </button>

        {/* Card Cabeçalho da Obra */}
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '26px',
          }}
        >
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div
              style={{
                width: '74px',
                height: '104px',
                backgroundColor: selectedBook.coverColor,
                color: '#FAF7F0',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                borderLeft: '4px solid #D68C45',
                flexShrink: 0,
              }}
            >
              {selectedBook.coverShort}
            </div>
            <div>
              <h1 className="serif-title" style={{ fontSize: '30px', marginBottom: '6px' }}>
                {selectedBook.title}
              </h1>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Autoria: <strong>{selectedBook.author}</strong> | Editora: {selectedBook.publisher} | Ano:{' '}
                {selectedBook.year} | {selectedBook.edition}
              </div>
              <div className="mono-code" style={{ color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                ISBN: {selectedBook.isbn} | Classificação CDD: {selectedBook.cdd} ({selectedBook.category})
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                Localização Base: {selectedBook.location} • {selectedBook.sector}
              </div>
              {queue.length > 0 && (
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-warning-text)', marginTop: '4px' }}>
                  Fila de espera: {queue.length} leitor(es)
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-teal"
              disabled={info.isLocalOnly}
              title={info.isLocalOnly ? 'Obra de consulta local: não disponível para reserva' : undefined}
              onClick={() => {
                ensureReader(reserveUserId, setReserveUserId);
                setModalError('');
                setShowReserveModal(true);
              }}
            >
              Reservar Livro
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={info.isLocalOnly}
              onClick={() => setActiveTab('Empréstimos', { type: 'new-loan', bookId: selectedBook.id })}
            >
              <Plus size={16} /> Novo Empréstimo
            </button>
          </div>
        </div>

        {/* Tabela de Exemplares Físicos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '14px',
            marginBottom: '14px',
            flexWrap: 'wrap',
          }}
        >
          <h2 className="serif-title" style={{ fontSize: '24px' }}>
            Exemplares Físicos Registrados ({info.total} no total)
          </h2>
          <span style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
            {info.available} disponíveis no acervo • {info.loaned} emprestados
            {info.reserved > 0 ? ` • ${info.reserved} reservado(s)` : ''}
            {info.repair > 0 ? ` • ${info.repair} em reparo` : ''}
            {info.writtenOff > 0 ? ` • ${info.writtenOff} baixado(s)` : ''}
          </span>
        </div>

        <div
          className="table-wrapper"
          style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Código Tombo</th>
                <th>Tipo de Exemplar</th>
                <th>Localização Exata</th>
                <th>Situação Atual</th>
                <th>Emprestado Para / Observação</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {selectedBook.copies.map((copy) => {
                const badge = COPY_BADGES[copy.status];
                return (
                  <tr key={copy.tombo}>
                    <td className="mono-code" style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                      {copy.tombo}
                    </td>
                    <td>{copy.type}</td>
                    <td>{copy.location}</td>
                    <td>
                      {badge ? (
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      ) : (
                        <span className="badge badge-neutral">• {copy.status}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '13.5px' }}>
                      {copy.holder ? (
                        <>
                          <strong>{copy.holder}</strong>
                          {copy.status === 'Emprestado' && copy.dueDate && ` (dev. ${copy.dueDate})`}
                          {copy.status === 'Reservado' && copy.dueDate && ` (retirada até ${copy.dueDate})`}
                        </>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>— Na prateleira</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {copy.status === 'Disponível' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '7px 14px' }}
                          onClick={() => {
                            ensureReader(selectedBorrowerId, setSelectedBorrowerId);
                            setModalError('');
                            setQuickLoanCopy(copy);
                          }}
                        >
                          Emprestar
                        </button>
                      )}
                      {copy.status === 'Emprestado' && (
                        <button
                          type="button"
                          className="btn btn-teal"
                          style={{ padding: '7px 14px' }}
                          onClick={() => setActiveTab('Empréstimos', { type: 'search', query: copy.tombo })}
                        >
                          Devolver
                        </button>
                      )}
                      {copy.status === 'Reservado' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '7px 14px' }}
                          onClick={() => setActiveTab('Reservas', { type: 'search', query: copy.tombo })}
                        >
                          Ver reserva
                        </button>
                      )}
                      {['Consulta local', 'Em reparo', 'Baixa contábil'].includes(copy.status) && (
                        <button type="button" className="btn btn-outline" disabled style={{ padding: '7px 14px' }}>
                          Bloqueado
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Rápido de Empréstimo Direto da Ficha do Exemplar */}
        {quickLoanCopy && (
          <div className="modal-backdrop" onClick={() => setQuickLoanCopy(null)}>
            <div className="modal-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
                Registrar Empréstimo de Exemplar
              </h2>
              <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Tombo selecionado: <strong className="mono-code">{quickLoanCopy.tombo}</strong> —{' '}
                {selectedBook.title}
              </p>

              <form onSubmit={handleQuickLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="quick-loan-user" style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>
                    Selecionar Leitor (Aluno / Docente) *
                  </label>
                  <select
                    id="quick-loan-user"
                    className="select-field"
                    style={{ width: '100%' }}
                    value={selectedBorrowerId}
                    onChange={(e) => {
                      setSelectedBorrowerId(e.target.value);
                      setModalError('');
                    }}
                  >
                    {readers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.matricula} — {u.name} ({u.roleLabel} • {u.status} • {u.activeLoansCount}/
                        {BUSINESS_RULES.MAX_ACTIVE_LOANS} livros)
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    backgroundColor: '#F4F0E8',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    • Prazo oficial de devolução: <strong>+{BUSINESS_RULES.LOAN_DAYS} dias corridos (RF03)</strong>
                  </div>
                  <div>
                    • Limite máximo por leitor: <strong>{BUSINESS_RULES.MAX_ACTIVE_LOANS} livros simultâneos (RF04)</strong>
                  </div>
                  <div>
                    • Leitores com multa pendente ou devolução em atraso ficam <strong>bloqueados (RF05)</strong>
                  </div>
                </div>

                <ErrorBox message={modalError} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setQuickLoanCopy(null)}>
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

        {/* Modal: Reserva pelo balcão (escolha do leitor) */}
        {showReserveModal && (
          <div className="modal-backdrop" onClick={() => setShowReserveModal(false)}>
            <div className="modal-box teal-top" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
                Reservar Livro para um Leitor
              </h2>
              <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {selectedBook.title} —{' '}
                {info.available > 0
                  ? `um exemplar disponível será separado no balcão por ${BUSINESS_RULES.RESERVATION_HOLD_HOURS}h (RF10).`
                  : `sem exemplares disponíveis: o leitor entrará na fila de espera (${nextQueuePosition}º lugar).`}
              </p>

              <form onSubmit={handleReserveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="reserve-user" style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>
                    Leitor *
                  </label>
                  <select
                    id="reserve-user"
                    className="select-field"
                    style={{ width: '100%' }}
                    value={reserveUserId}
                    onChange={(e) => {
                      setReserveUserId(e.target.value);
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

                <ErrorBox message={modalError} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowReserveModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-teal">
                    {info.available > 0 ? 'Confirmar Reserva' : 'Incluir na Fila'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // TELA PRINCIPAL: LIVROS CADASTRADOS (Frame 4.3.2 / catalogo gestao.PNG)
  const filteredBooks = books.filter((book) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn.toLowerCase().includes(query) ||
      book.copies.some((c) => c.tombo.toLowerCase().includes(query));

    const matchesCategory = selectedCategory === 'Todas' || book.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'Todos' || getBookAvailability(book).statusLabel === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalCopies = books.reduce((acc, b) => acc + b.copies.length, 0);

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
            Livros Cadastrados
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {books.length} obras • {totalCopies} exemplares. Consulte prateleiras, gerencie categorias e acesse as fichas detalhadas de circulação.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setModalError('');
              setShowCategoryModal(true);
            }}
          >
            <FolderPlus size={16} /> Categorias e Gêneros
          </button>
          <button type="button" className="btn btn-primary" onClick={openNewBookModal}>
            <BookPlus size={16} /> Cadastrar Obra
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 210px 200px',
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
            placeholder="Buscar por título, autor, tombo ou ISBN..."
            aria-label="Buscar obras"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-field"
          aria-label="Filtrar por categoria"
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
          aria-label="Filtrar por disponibilidade"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="Todos">Disponibilidade: Todas</option>
          <option value="Disponível">Disponível</option>
          <option value="Emprestado">Emprestado</option>
          <option value="Consulta local">Consulta local</option>
          <option value="Indisponível">Indisponível</option>
        </select>
      </div>

      {/* Tabela de Obras */}
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
            {filteredBooks.length === 0 && (
              <tr className="empty-row">
                <td colSpan="5">Nenhuma obra encontrada para os filtros informados.</td>
              </tr>
            )}
            {filteredBooks.map((book) => {
              const info = getBookAvailability(book);

              return (
                <tr key={book.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {book.sector}
                    </div>
                  </td>

                  <td>
                    {info.isLocalOnly ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-info-text)', fontSize: '13px' }}>
                          • Consulta local
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {info.total} exemplares
                        </div>
                      </>
                    ) : info.available > 0 ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-success-text)', fontSize: '13px' }}>
                          • Disponível
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {info.available} de {info.total} exemplares
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-danger-text)', fontSize: '13px' }}>
                          • {info.statusLabel}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          0 de {info.total} exemplares
                        </div>
                      </>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontWeight: 700 }}
                      onClick={() => setSelectedBookId(book.id)}
                    >
                      Ver ficha <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Completo: Cadastro de Nova Obra (RF01 — solicitado no Critério 2) */}
      {showNewBookModal && (
        <div className="modal-backdrop" onClick={() => setShowNewBookModal(false)}>
          <div className="modal-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Cadastrar Nova Obra no Acervo (RF01)
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Preencha os metadados bibliográficos completos e a quantidade de exemplares físicos.
            </p>

            <form onSubmit={handleCreateBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="book-title" style={labelStyle}>Título da Obra *</label>
                <input
                  id="book-title"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="Ex.: Engenharia de Software Moderna"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="book-author" style={labelStyle}>Autor(es) *</label>
                  <input
                    id="book-author"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="Ex.: Marco Tulio Valente"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="book-publisher" style={labelStyle}>Editora *</label>
                  <input
                    id="book-publisher"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="Ex.: Independente / Alta Books"
                    value={bookForm.publisher}
                    onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.9fr 0.8fr', gap: '12px' }}>
                <div>
                  <label htmlFor="book-isbn" style={labelStyle}>ISBN *</label>
                  <input
                    id="book-isbn"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="978-85-0000-000-0"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="book-year" style={labelStyle}>Ano *</label>
                  <input
                    id="book-year"
                    required
                    type="number"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={bookForm.year}
                    onChange={(e) => setBookForm({ ...bookForm, year: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="book-edition" style={labelStyle}>Edição</label>
                  <input
                    id="book-edition"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={bookForm.edition}
                    onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="book-copies" style={labelStyle}>Qtd. Exemplares *</label>
                  <input
                    id="book-copies"
                    required
                    type="number"
                    min="1"
                    max="20"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={bookForm.copiesCount}
                    onChange={(e) => setBookForm({ ...bookForm, copiesCount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="book-category" style={labelStyle}>Categoria / Gênero *</label>
                  <select
                    id="book-category"
                    className="select-field"
                    style={{ width: '100%' }}
                    value={bookForm.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} (CDD {c.cdd})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="book-cdd" style={labelStyle}>Classificação CDD</label>
                  <input
                    id="book-cdd"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={bookForm.cdd}
                    onChange={(e) => setBookForm({ ...bookForm, cdd: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="book-circulation" style={labelStyle}>Tipo de Circulação</label>
                  <select
                    id="book-circulation"
                    className="select-field"
                    style={{ width: '100%' }}
                    value={bookForm.circulationType}
                    onChange={(e) => setBookForm({ ...bookForm, circulationType: e.target.value })}
                  >
                    <option value="Circulação Livre">Circulação Livre (empréstimo)</option>
                    <option value="Consulta Local">Consulta Local (não circula)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="book-location" style={labelStyle}>Localização (Estante / Prateleira)</label>
                  <input
                    id="book-location"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={bookForm.location}
                    onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="book-sector" style={labelStyle}>Setor</label>
                  <input
                    id="book-sector"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={bookForm.sector}
                    onChange={(e) => setBookForm({ ...bookForm, sector: e.target.value })}
                  />
                </div>
              </div>

              <ErrorBox message={modalError} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowNewBookModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Obra e Gerar Tombos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Categorias e Gêneros Literários (RF15 — solicitado no Critério 2) */}
      {showCategoryModal && (
        <div className="modal-backdrop" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-box teal-top" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Gerenciar Categorias e Gêneros (RF15)
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Classificação decimal (CDD) e áreas temáticas do acervo da Biblioteca Central.
            </p>

            <form
              onSubmit={handleCreateCategory}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              <input
                required
                className="input-field"
                aria-label="Nome da categoria"
                placeholder="Nome do gênero/categoria..."
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              />
              <input
                required
                className="input-field"
                aria-label="Código CDD"
                placeholder="CDD (ex.: 340)"
                value={catForm.cdd}
                onChange={(e) => setCatForm({ ...catForm, cdd: e.target.value })}
              />
              <input
                className="input-field"
                aria-label="Descrição da categoria"
                placeholder="Descrição (opcional)"
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Adicionar
              </button>
            </form>

            {modalError && (
              <div style={{ marginBottom: '12px' }}>
                <ErrorBox message={modalError} />
              </div>
            )}

            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                marginBottom: '18px',
              }}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Categoria / Gênero</th>
                    <th>Código CDD</th>
                    <th>Obras</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <strong>{cat.name}</strong>
                      </td>
                      <td className="mono-code">{cat.cdd}</td>
                      <td className="mono-code">{books.filter((b) => b.category === cat.name).length}</td>
                      <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {cat.description || 'Área temática cadastrada'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--color-deep-teal)',
  marginBottom: '5px',
};

export default GestaoCatalogo;
