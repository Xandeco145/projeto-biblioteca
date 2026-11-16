import React, { useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Plus,
  FolderPlus,
  BookPlus,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';

const GestaoCatalogo = () => {
  const {
    books,
    users,
    categories,
    selectedBookId,
    setSelectedBookId,
    addBook,
    addCategory,
    registerLoan,
    createReservation,
    setActiveTab,
  } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  // Modais
  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [quickLoanCopy, setQuickLoanCopy] = useState(null);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('u-2');
  const [loanError, setLoanError] = useState('');

  // Form Nova Obra (RF01: título, autor, editora, ano, ISBN, gênero/categoria, localização e exemplares)
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    publisher: '',
    year: '2026',
    edition: '1ª Edição',
    isbn: '',
    category: 'Informática',
    cdd: '005.1',
    location: 'Estante D • Prat. 2',
    sector: 'Setor de Tecnologia',
    circulationType: 'Circulação Livre',
    copiesCount: 2,
  });

  // Form Nova Categoria (RF15)
  const [catForm, setCatForm] = useState({ name: '', cdd: '', description: '' });

  const selectedBook = books.find((b) => b.id === selectedBookId);

  const handleCreateBook = (e) => {
    e.preventDefault();
    addBook(bookForm);
    setShowNewBookModal(false);
    setBookForm({
      title: '',
      author: '',
      publisher: '',
      year: '2026',
      edition: '1ª Edição',
      isbn: '',
      category: 'Informática',
      cdd: '005.1',
      location: 'Estante D • Prat. 2',
      sector: 'Setor de Tecnologia',
      circulationType: 'Circulação Livre',
      copiesCount: 2,
    });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    addCategory(catForm);
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
      setLoanError(res.error);
    } else {
      setLoanError('');
      setQuickLoanCopy(null);
    }
  };

  // TELA DE DETALHES DA OBRA E EXEMPLARES (Frame 4.4.2 / detalhes das obras.PNG)
  if (selectedBook) {
    const availableCount = selectedBook.copies.filter((c) => c.status === 'Disponível').length;
    const loanedCount = selectedBook.copies.filter((c) => c.status === 'Emprestado').length;

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
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-teal"
              onClick={() => createReservation({ bookId: selectedBook.id, userId: 'u-2' })}
            >
              Reservar Livro
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('Empréstimos')}
            >
              + Novo Empréstimo
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
            Exemplares Físicos Registrados ({selectedBook.copies.length} no total)
          </h2>
          <span style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
            {availableCount} disponíveis no acervo • {loanedCount} emprestados
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
                <th>Emprestado Para / Posição</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {selectedBook.copies.map((copy) => (
                <tr key={copy.tombo}>
                  <td className="mono-code" style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                    {copy.tombo}
                  </td>
                  <td>{copy.type}</td>
                  <td>{copy.location}</td>
                  <td>
                    {copy.status === 'Disponível' && (
                      <span className="badge badge-success">• Disponível</span>
                    )}
                    {copy.status === 'Emprestado' && (
                      <span className="badge badge-warning">• Emprestado</span>
                    )}
                    {copy.status === 'Reservado' && (
                      <span className="badge badge-info">• Retirada 48h</span>
                    )}
                    {copy.status === 'Consulta local' && (
                      <span className="badge badge-info">• Sala Leitura</span>
                    )}
                    {copy.status === 'Em reparo' && (
                      <span className="badge badge-danger">• Em reparo</span>
                    )}
                  </td>
                  <td style={{ fontSize: '13.5px' }}>
                    {copy.holder ? (
                      <>
                        <strong>{copy.holder}</strong>
                        {copy.dueDate && ` (Dev. ${copy.dueDate})`}
                      </>
                    ) : (
                      <span style={{ color: 'var(--color-text-secondary)' }}>— Na prateleira</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {copy.status === 'Disponível' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '7px 14px' }}
                        onClick={() => {
                          setLoanError('');
                          setQuickLoanCopy(copy);
                        }}
                      >
                        Emprestar
                      </button>
                    )}
                    {copy.status === 'Emprestado' && (
                      <button
                        className="btn btn-teal"
                        style={{ padding: '7px 14px' }}
                        onClick={() => setActiveTab('Empréstimos')}
                      >
                        Devolver
                      </button>
                    )}
                    {copy.status === 'Reservado' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '7px 14px' }}
                        onClick={() => setActiveTab('Reservas')}
                      >
                        Confirmar
                      </button>
                    )}
                    {(copy.status === 'Consulta local' || copy.status === 'Em reparo') && (
                      <button className="btn btn-outline" disabled style={{ padding: '7px 14px' }}>
                        Bloqueado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Rápido de Empréstimo Direto da Ficha do Exemplar */}
        {quickLoanCopy && (
          <div className="modal-backdrop" onClick={() => setQuickLoanCopy(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
                Registrar Empréstimo de Exemplar
              </h2>
              <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Tombo selecionado: <strong className="mono-code">{quickLoanCopy.tombo}</strong> —{' '}
                {selectedBook.title}
              </p>

              <form onSubmit={handleQuickLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>
                    Selecionar Leitor (Aluno / Docente) *
                  </label>
                  <select
                    className="select-field"
                    style={{ width: '100%' }}
                    value={selectedBorrowerId}
                    onChange={(e) => setSelectedBorrowerId(e.target.value)}
                  >
                    {users
                      .filter((u) => u.role === 'aluno')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.matricula} — {u.name} ({u.roleLabel} • {u.status})
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
                </div>

                {loanError && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-danger-bg)',
                      color: 'var(--color-danger-text)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  >
                    {loanError}
                  </div>
                )}

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

    const matchesCategory =
      selectedCategory === 'Todas' || book.category === selectedCategory;

    const availableCopies = book.copies.filter((c) => c.status === 'Disponível').length;
    let statusLabel = 'Emprestado';
    if (book.circulationType === 'Consulta Local') statusLabel = 'Consulta local';
    else if (availableCopies > 0) statusLabel = 'Disponível';

    const matchesStatus = selectedStatus === 'Todos' || statusLabel === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

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
            Consulte exemplares, prateleiras, gerencie categorias e acesse as fichas detalhadas de circulação.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setShowCategoryModal(true)}>
            <FolderPlus size={16} /> Categorias e Gêneros
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewBookModal(true)}>
            <BookPlus size={16} /> + Cadastrar Obra
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
          <option value="Todos">Disponibilidade: Todas</option>
          <option value="Disponível">Disponível</option>
          <option value="Emprestado">Emprestado</option>
          <option value="Consulta local">Consulta local</option>
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
            {filteredBooks.map((book) => {
              const availableCount = book.copies.filter((c) => c.status === 'Disponível').length;
              const isLocalOnly = book.circulationType === 'Consulta Local';

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
                    {isLocalOnly ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-info-text)', fontSize: '13px' }}>
                          • Consulta local
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {book.copies.length} exemplares
                        </div>
                      </>
                    ) : availableCount > 0 ? (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-success-text)', fontSize: '13px' }}>
                          • Disponível
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {availableCount} de {book.copies.length} exemplares
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--color-danger-text)', fontSize: '13px' }}>
                          • Emprestado
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          0 de {book.copies.length} exemplares
                        </div>
                      </>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Cadastrar Nova Obra no Acervo (RF01)
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Preencha os metadados bibliográficos completos e a quantidade de exemplares físicos.
            </p>

            <form onSubmit={handleCreateBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Título da Obra *</label>
                <input
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
                  <label style={labelStyle}>Autor(es) *</label>
                  <input
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="Ex.: Marco Tulio Valente"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Editora *</label>
                  <input
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="Ex.: Independente / Alta Books"
                    value={bookForm.publisher}
                    onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>ISBN *</label>
                  <input
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="978-85-0000-000-0"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ano de Publicação *</label>
                  <input
                    required
                    type="number"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={bookForm.year}
                    onChange={(e) => setBookForm({ ...bookForm, year: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Qtd. Exemplares *</label>
                  <input
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Categoria / Gênero *</label>
                  <select
                    className="select-field"
                    style={{ width: '100%' }}
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} (CDD {c.cdd})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Localização (Estante / Prateleira)</label>
                  <input
                    className="input-field"
                    style={{ width: '100%' }}
                    value={bookForm.location}
                    onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                  />
                </div>
              </div>

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
          <div className="modal-box teal-top" onClick={(e) => e.stopPropagation()}>
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
                gridTemplateColumns: '1fr 120px auto',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              <input
                required
                className="input-field"
                placeholder="Nome do gênero/categoria..."
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              />
              <input
                required
                className="input-field"
                placeholder="CDD (Ex: 340)"
                value={catForm.cdd}
                onChange={(e) => setCatForm({ ...catForm, cdd: e.target.value })}
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Adicionar
              </button>
            </form>

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
                      <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {cat.description || 'Área temática cadastrada'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>
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