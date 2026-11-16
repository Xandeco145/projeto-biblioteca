import React, { useState } from 'react';
import { Search, Tag, FileText } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

const Inventario = () => {
  const { inventoryItems, addInventoryItem, updateInventoryStatus, showToast, setActiveTab } =
    useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todas');

  const [activeActionModal, setActiveActionModal] = useState(null); // 'tcc' | 'baixa' | 'restauro'
  const [tccForm, setTccForm] = useState({
    tombo: 'TCC-2026-0043',
    title: '',
    author: '',
    advisor: '',
    location: 'Arquivo TCC • Gav. B',
  });
  const [selectedTomboAction, setSelectedTomboAction] = useState('TB-00642-1');

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

  const handleSaveTcc = (e) => {
    e.preventDefault();
    addInventoryItem({
      tombo: tccForm.tombo,
      materialType: 'TCC / Monografia',
      title: tccForm.title,
      subtitle: `${tccForm.author} • Orient.: ${tccForm.advisor}`,
      location: tccForm.location,
      status: 'Consulta local',
    });
    setActiveActionModal(null);
  };

  const handleApplyStatusAction = (newStatus, newLocation) => {
    updateInventoryStatus(selectedTomboAction, newStatus, newLocation);
    setActiveActionModal(null);
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
          onClick={() => setActiveTab('Catálogo')}
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
          onClick={() => setActiveActionModal('tcc')}
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
          onClick={() => setActiveActionModal('baixa')}
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
          onClick={() => setActiveActionModal('restauro')}
          style={{ ...actionCardStyle, borderTop: '3px solid #185266' }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-deep-teal)' }}>
            Restauração e Auditoria
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '4px 0 10px' }}>
            Conferência física de estantes
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-field"
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todas">Situação: Todas</option>
          <option value="Disponível">Disponível</option>
          <option value="Consulta local">Consulta local</option>
          <option value="Em reparo">Em reparo</option>
          <option value="Baixa contábil">Baixa contábil</option>
        </select>

        <button
          className="btn btn-teal"
          onClick={() => showToast('Lote de etiquetas patrimoniais (código de barras) gerado para impressão!')}
        >
          <Tag size={15} /> Gerar Etiquetas
        </button>
      </div>

      {/* Tabela Patrimonial */}
      <div
        className="table-wrapper"
        style={{ border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '16px' }}
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
                  {item.status === 'Disponível' && (
                    <span className="badge badge-success">• Disponível</span>
                  )}
                  {item.status === 'Consulta local' && (
                    <span className="badge badge-info">• Consulta local</span>
                  )}
                  {item.status === 'Em reparo' && (
                    <span className="badge badge-warning">• Em reparo</span>
                  )}
                  {item.status === 'Baixa contábil' && (
                    <span className="badge badge-danger">• Baixa contábil</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        <span>Exibindo {filteredItems.length} de 3.840 itens patrimoniais registrados no acervo físico</span>
        <button
          className="btn-ghost"
          style={{ color: 'var(--color-warning-text)', fontWeight: 700 }}
          onClick={() => showToast('Relatório Geral de Auditoria Patrimonial exportado em PDF!')}
        >
          <FileText size={15} /> Exportar Relatório Geral de Auditoria (PDF) &rsaquo;
        </button>
      </div>

      {/* Modal Cadastro de TCC / Artigo */}
      {activeActionModal === 'tcc' && (
        <div className="modal-backdrop" onClick={() => setActiveActionModal(null)}>
          <div className="modal-box teal-top" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Cadastrar TCC / Produção Acadêmica
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Incorporação de monografias e artigos ao repositório físico do CEULP/ULBRA.
            </p>

            <form onSubmit={handleSaveTcc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                  Código Tombo *
                </label>
                <input
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                  value={tccForm.tombo}
                  onChange={(e) => setTccForm({ ...tccForm, tombo: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                  Título do Trabalho *
                </label>
                <input
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
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                    Acadêmico Autor *
                  </label>
                  <input
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    value={tccForm.author}
                    onChange={(e) => setTccForm({ ...tccForm, author: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                    Professor(a) Orientador(a) *
                  </label>
                  <input
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="Profª. Caroline Pacheco"
                    value={tccForm.advisor}
                    onChange={(e) => setTccForm({ ...tccForm, advisor: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActiveActionModal(null)}>
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
        <div className="modal-backdrop" onClick={() => setActiveActionModal(null)}>
          <div
            className={`modal-box ${activeActionModal === 'baixa' ? 'danger-top' : 'teal-top'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              {activeActionModal === 'baixa'
                ? 'Emitir Baixa Patrimonial (RF14)'
                : 'Encaminhar Exemplar para Restauração'}
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Selecione o código de tombo para atualizar o registro físico do inventário.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                Tombo Patrimonial
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={selectedTomboAction}
                onChange={(e) => setSelectedTomboAction(e.target.value)}
              >
                {inventoryItems.map((i) => (
                  <option key={i.tombo} value={i.tombo}>
                    {i.tombo} — {i.title} ({i.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setActiveActionModal(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  activeActionModal === 'baixa'
                    ? handleApplyStatusAction('Baixa contábil', '— Fora de estante')
                    : handleApplyStatusAction('Em reparo', 'Bancada de Restauro')
                }
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