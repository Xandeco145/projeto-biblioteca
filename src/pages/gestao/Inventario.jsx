import React, { useState } from 'react';
import { Search, Tag, FileText, AlertTriangle } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { printDocument } from '../../utils/export';

const STATUS_BADGES = {
  Disponível: 'badge-success',
  Emprestado: 'badge-warning',
  Reservado: 'badge-info',
  'Consulta local': 'badge-info',
  'Em reparo': 'badge-warning',
  'Baixa contábil': 'badge-danger',
};

// Situações que permitem cada ação patrimonial
const ELIGIBLE = {
  baixa: ['Disponível', 'Consulta local', 'Em reparo'],
  restauro: ['Disponível', 'Consulta local'],
  retorno: ['Em reparo'],
};

const ACTION_LABELS = {
  restauro: 'Encaminhar para restauração',
  retorno: 'Concluir restauração (retornar ao acervo)',
};

const labelStyle = { display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' };

const Inventario = () => {
  const {
    inventoryItems,
    addInventoryItem,
    updateInventoryStatus,
    suggestNextTccTombo,
    showToast,
    setActiveTab,
  } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todas');

  const [activeActionModal, setActiveActionModal] = useState(null); // 'tcc' | 'baixa' | 'restauro'
  const [restoreAction, setRestoreAction] = useState('restauro'); // 'restauro' | 'retorno'
  const [tccForm, setTccForm] = useState(null);
  const [selectedTomboAction, setSelectedTomboAction] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [modalError, setModalError] = useState('');

  const filteredItems = inventoryItems.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.tombo.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q);

    const matchesType = typeFilter === 'Todos' || item.materialType === typeFilter;
    const matchesStatus = statusFilter === 'Todas' || item.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const eligibleFor = (action) =>
    inventoryItems.filter((i) => ELIGIBLE[action].includes(i.status));

  const openTccModal = () => {
    setTccForm({
      tombo: suggestNextTccTombo(),
      title: '',
      author: '',
      advisor: '',
      location: 'Arquivo TCC • Gav. B',
    });
    setModalError('');
    setActiveActionModal('tcc');
  };

  const openStatusModal = (type, action = type) => {
    const firstEligible = eligibleFor(action)[0];
    setRestoreAction(type === 'restauro' ? action : 'restauro');
    setSelectedTomboAction(firstEligible ? firstEligible.tombo : '');
    setActionNote('');
    setModalError('');
    setActiveActionModal(type);
  };

  const closeModal = () => {
    setActiveActionModal(null);
    setModalError('');
  };

  const handleSaveTcc = (e) => {
    e.preventDefault();
    const res = addInventoryItem({
      tombo: tccForm.tombo,
      materialType: 'TCC / Monografia',
      title: tccForm.title,
      subtitle: `${tccForm.author.trim()} • Orient.: ${tccForm.advisor.trim()}`,
      location: tccForm.location.trim() || 'Arquivo TCC • Gav. B',
      status: 'Consulta local',
    });
    if (!res.ok) {
      setModalError(res.error);
      return;
    }
    closeModal();
  };

  const currentAction = activeActionModal === 'baixa' ? 'baixa' : restoreAction;

  const handleApplyStatusAction = () => {
    if (!selectedTomboAction) {
      setModalError('Nenhum tombo elegível para esta ação.');
      return;
    }
    const res = updateInventoryStatus(selectedTomboAction, currentAction, actionNote);
    if (!res.ok) {
      setModalError(res.error);
      return;
    }
    closeModal();
  };

  const handleGenerateLabels = () => {
    if (filteredItems.length === 0) {
      showToast('Nenhum item na lista atual para gerar etiquetas.', 'error');
      return;
    }
    const ok = printDocument({
      title: 'Etiquetas Patrimoniais',
      subtitle: `${filteredItems.length} etiqueta(s) para impressão • recorte nas linhas tracejadas`,
      sections: [
        { labels: filteredItems.map((i) => ({ code: i.tombo, title: i.title })) },
      ],
    });
    showToast(
      ok
        ? `Lote de ${filteredItems.length} etiqueta(s) patrimonial(is) gerado para impressão!`
        : 'O navegador bloqueou a janela de impressão. Permita pop-ups para este site.',
      ok ? 'success' : 'error'
    );
  };

  const handleExportAudit = () => {
    const counts = inventoryItems.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {});
    const ok = printDocument({
      title: 'Relatório Geral de Auditoria Patrimonial',
      subtitle: `Inventário físico do acervo • ${inventoryItems.length} itens patrimoniais registrados`,
      sections: [
        {
          heading: 'Resumo por situação',
          kpis: Object.entries(counts).map(([label, value]) => ({ label, value })),
        },
        {
          heading: 'Itens patrimoniais',
          headers: ['Tombo', 'Tipo', 'Título', 'Detalhes', 'Localização', 'Situação'],
          rows: inventoryItems.map((i) => [i.tombo, i.materialType, i.title, i.subtitle, i.location, i.status]),
        },
      ],
    });
    showToast(
      ok
        ? 'Relatório de auditoria aberto para impressão — escolha "Salvar como PDF".'
        : 'O navegador bloqueou a janela de impressão. Permita pop-ups para este site.',
      ok ? 'success' : 'error'
    );
  };

  return (
    <div className="panel-card">
      <div style={{ marginBottom: '20px' }}>
        <h1 className="serif-title" style={{ fontSize: '30px', marginBottom: '4px' }}>
          Gestão e Auditoria de Patrimônio do Acervo
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Selecione uma ação operacional para o acervo ou realize auditorias de localização física e conservação.
        </p>
      </div>

      {/* 4 Cards de Ações Operacionais (Frame 4.6 / Inventário.png) */}
      <div className="kpi-grid-4">
        <button
          type="button"
          onClick={() => setActiveTab('Catálogo', { type: 'new-book' })}
          style={{ ...actionCardStyle, borderTop: '3px solid #D68C45' }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-deep-teal)' }}>
            + Cadastrar Livro
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '4px 0 10px' }}>
            Obras impressas, ISBN e edições
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-warning-text)' }}>
            Abrir cadastro &rsaquo;
          </div>
        </button>

        <button
          type="button"
          onClick={openTccModal}
          style={{ ...actionCardStyle, borderTop: '3px solid #0B303D' }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-deep-teal)' }}>
            + Cadastrar TCC / Artigo
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '4px 0 10px' }}>
            Trabalhos acadêmicos e orientadores
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
            Abrir cadastro &rsaquo;
          </div>
        </button>

        <button
          type="button"
          onClick={() => openStatusModal('baixa')}
          style={{ ...actionCardStyle, borderTop: '3px solid #A62626' }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-danger-text)' }}>
            Dar Baixa Patrimonial
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '4px 0 10px' }}>
            Registrar perdas, danos e descarte
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-danger-text)' }}>
            Emitir baixa &rsaquo;
          </div>
        </button>

        <button
          type="button"
          onClick={() => openStatusModal('restauro', 'restauro')}
          style={{ ...actionCardStyle, borderTop: '3px solid #185266' }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-deep-teal)' }}>
            Restauração e Auditoria
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '4px 0 10px' }}>
            Envio e retorno da Bancada de Restauro
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
            Iniciar auditoria &rsaquo;
          </div>
        </button>
      </div>

      {/* Barra de Filtros e Gerar Etiquetas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 180px 180px auto',
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
            placeholder="Buscar por código de tombo, título, autor ou orientador..."
            aria-label="Buscar itens patrimoniais"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-field"
          aria-label="Filtrar por tipo de material"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="Todos">Tipo: Todos</option>
          <option value="Livro">Livro</option>
          <option value="TCC / Monografia">TCC / Monografia</option>
          <option value="Periódico">Periódico</option>
        </select>

        <select
          className="select-field"
          aria-label="Filtrar por situação"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todas">Situação: Todas</option>
          <option value="Disponível">Disponível</option>
          <option value="Emprestado">Emprestado</option>
          <option value="Reservado">Reservado</option>
          <option value="Consulta local">Consulta local</option>
          <option value="Em reparo">Em reparo</option>
          <option value="Baixa contábil">Baixa contábil</option>
        </select>

        <button type="button" className="btn btn-teal" onClick={handleGenerateLabels}>
          <Tag size={15} /> Gerar Etiquetas
        </button>
      </div>

      {/* Tabela Patrimonial */}
      <div
        className="table-wrapper"
        style={{ border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '16px', maxHeight: '560px', overflowY: 'auto' }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Tombo Patrimonial</th>
              <th>Tipo de Material</th>
              <th>Título e Autoria</th>
              <th>Localização Física</th>
              <th>Situação Atual</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && (
              <tr className="empty-row">
                <td colSpan="5">Nenhum item patrimonial encontrado para os filtros informados.</td>
              </tr>
            )}
            {filteredItems.map((item) => (
              <tr key={item.tombo}>
                <td className="mono-code" style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                  {item.tombo}
                </td>
                <td>
                  <span className="badge badge-neutral">{item.materialType}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>{item.title}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                    {item.subtitle}
                  </div>
                </td>
                <td>
                  <strong>{item.location}</strong>
                </td>
                <td>
                  <span className={`badge ${STATUS_BADGES[item.status] || 'badge-neutral'}`}>
                    • {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', flexWrap: 'wrap', gap: '8px' }}>
        <span>
          Exibindo {filteredItems.length} de {inventoryItems.length} itens patrimoniais registrados no acervo físico
        </span>
        <button
          type="button"
          className="btn-ghost"
          style={{ color: 'var(--color-warning-text)', fontWeight: 700 }}
          onClick={handleExportAudit}
        >
          <FileText size={15} /> Exportar Relatório Geral de Auditoria (PDF) &rsaquo;
        </button>
      </div>

      {/* Modal Cadastro de TCC / Artigo */}
      {activeActionModal === 'tcc' && tccForm && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-box teal-top" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Cadastrar TCC / Produção Acadêmica
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Incorporação de monografias e artigos ao repositório físico do CEULP/ULBRA.
            </p>

            <form onSubmit={handleSaveTcc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="tcc-tombo" style={labelStyle}>
                    Código Tombo *
                  </label>
                  <input
                    id="tcc-tombo"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    value={tccForm.tombo}
                    onChange={(e) => setTccForm({ ...tccForm, tombo: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="tcc-location" style={labelStyle}>
                    Localização
                  </label>
                  <input
                    id="tcc-location"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={tccForm.location}
                    onChange={(e) => setTccForm({ ...tccForm, location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="tcc-title" style={labelStyle}>
                  Título do Trabalho *
                </label>
                <input
                  id="tcc-title"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="Ex.: Arquitetura de Microsserviços em Nuvem"
                  value={tccForm.title}
                  onChange={(e) => setTccForm({ ...tccForm, title: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="tcc-author" style={labelStyle}>
                    Acadêmico(a) Autor(a) *
                  </label>
                  <input
                    id="tcc-author"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    value={tccForm.author}
                    onChange={(e) => setTccForm({ ...tccForm, author: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="tcc-advisor" style={labelStyle}>
                    Professor(a) Orientador(a) *
                  </label>
                  <input
                    id="tcc-advisor"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="Prof.ª Caroline Pacheco"
                    value={tccForm.advisor}
                    onChange={(e) => setTccForm({ ...tccForm, advisor: e.target.value })}
                  />
                </div>
              </div>

              {modalError && (
                <div role="alert" className="form-error">
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{modalError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-teal">
                  Registrar TCC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Baixa Patrimonial ou Restauração */}
      {(activeActionModal === 'baixa' || activeActionModal === 'restauro') && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className={`modal-box ${activeActionModal === 'baixa' ? 'danger-top' : 'teal-top'}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              {activeActionModal === 'baixa'
                ? 'Emitir Baixa Patrimonial (RF14)'
                : 'Restauração e Auditoria de Exemplar'}
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Selecione o código de tombo para atualizar o registro físico do inventário. Exemplares emprestados ou
              reservados não são listados.
            </p>

            {activeActionModal === 'restauro' && (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, flexWrap: 'wrap' }}>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="restoreAction"
                      checked={restoreAction === value}
                      onChange={() => {
                        setRestoreAction(value);
                        const first = eligibleFor(value)[0];
                        setSelectedTomboAction(first ? first.tombo : '');
                        setModalError('');
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="inv-tombo" style={labelStyle}>
                Tombo Patrimonial
              </label>
              {eligibleFor(currentAction).length === 0 ? (
                <div className="form-warning">Nenhum tombo elegível para esta ação no momento.</div>
              ) : (
                <select
                  id="inv-tombo"
                  className="select-field"
                  style={{ width: '100%' }}
                  value={selectedTomboAction}
                  onChange={(e) => {
                    setSelectedTomboAction(e.target.value);
                    setModalError('');
                  }}
                >
                  {eligibleFor(currentAction).map((i) => (
                    <option key={i.tombo} value={i.tombo}>
                      {i.tombo} — {i.title} ({i.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {currentAction !== 'retorno' && (
              <div style={{ marginBottom: '18px' }}>
                <label htmlFor="inv-note" style={labelStyle}>
                  {currentAction === 'baixa' ? 'Motivo da baixa' : 'Descrição do dano'} (opcional)
                </label>
                <input
                  id="inv-note"
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder={currentAction === 'baixa' ? 'Ex.: Extravio, dano irreparável, descarte' : 'Ex.: Lombada solta, páginas rasgadas'}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>
            )}

            {modalError && (
              <div role="alert" className="form-error" style={{ marginBottom: '14px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{modalError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-outline" onClick={closeModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={eligibleFor(currentAction).length === 0}
                onClick={handleApplyStatusAction}
              >
                Confirmar Alteração Patrimonial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const actionCardStyle = {
  backgroundColor: '#FAF7F0',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '16px 18px',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

export default Inventario;
