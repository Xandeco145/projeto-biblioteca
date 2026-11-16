import React, { useState } from 'react';
import { Download, FileSpreadsheet, ClipboardCheck, Plus } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

const TOP_DEMAND_BOOKS = [
  { title: 'Dom Casmurro', author: 'Machado de Assis', loans: '84 vezes', queue: '12 alunos', rec: 'Adquirir +3 ex.', urgent: true },
  { title: 'O capital — Livro I', author: 'Karl Marx', loans: '67 vezes', queue: '8 alunos', rec: 'Adquirir +2 ex.', urgent: true },
  { title: 'Pedagogia da autonomia', author: 'Paulo Freire', loans: '59 vezes', queue: '5 alunos', rec: 'Acervo suficiente', urgent: false },
  { title: 'Código Limpo (Clean Code)', author: 'Robert C. Martin', loans: '52 vezes', queue: '7 alunos', rec: 'Adquirir +2 ex.', urgent: true },
  { title: 'Metodologia Científica', author: 'Marconi e Lakatos', loans: '48 vezes', queue: '2 alunos', rec: 'Acervo suficiente', urgent: false },
];

const INVENTORY_BALANCE = [
  { label: 'Exemplares nas Estantes (Disponíveis):', value: '3.210 ex.', pct: 84, color: '#1B6B4A' },
  { label: 'Empréstimos Ativos com Leitores:', value: '542 ex.', pct: 14, color: '#D68C45' },
  { label: 'Em Reparo / Restauração (Danos):', value: '64 ex.', pct: 4, color: '#525E62' },
  { label: 'Consulta Local (Não Circulantes):', value: '18 ex.', pct: 2, color: '#185266' },
  { label: 'Perdas / Extravios Pendentes:', value: '6 ex.', pct: 1, color: '#A62626' },
];

const Relatorios = () => {
  const { showToast, setActiveTab } = useLibrary();
  const [period, setPeriod] = useState('Outubro/2026');

  return (
    <div className="panel-card">
      {/* Cabeçalho */}
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
            Visão Estratégica do Acervo e Finanças
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Indicadores analíticos de circulação, receita de multas e auditoria de estoque físico de exemplares (RF13).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="select-field"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="Outubro/2026">Período: Outubro/2026</option>
            <option value="Setembro/2026">Período: Setembro/2026</option>
            <option value="2026.2 (Semestre)">Período: 2026.2 (Semestre)</option>
          </select>

          <button
            className="btn btn-primary"
            onClick={() => showToast(`Relatório Gerencial (${period}) exportado com sucesso!`)}
          >
            <Download size={15} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* 4 Cards Executivos (Frame 4.6 / relatorio gerencial.PNG) */}
      <div className="kpi-grid-4">
        <div className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
          <div className="overline-label">TOTAL DE EMPRÉSTIMOS (MÊS)</div>
          <div className="kpi-value">542</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-success-text)' }}>
            +14% vs. mês anterior
          </div>
        </div>

        <div className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
          <div className="overline-label">RECEITA DE MULTAS ARRECADADAS</div>
          <div className="kpi-value" style={{ color: 'var(--color-warning-text)' }}>
            R$ 486,00
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            Infrações quitadas no balcão (RF08)
          </div>
        </div>

        <div className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
          <div className="overline-label">ROTATIVIDADE DO ACERVO</div>
          <div className="kpi-value">72.4%</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-success-text)' }}>
            Alta utilização acadêmica
          </div>
        </div>

        <div className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
          <div className="overline-label">TOTAL DE EXEMPLARES NO ACERVO</div>
          <div className="kpi-value">3.840</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            1.248 títulos catalogados
          </div>
        </div>
      </div>

      {/* Duas Colunas: Obras Mais Procuradas + Balanço do Inventário Físico */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div>
          <h2 className="serif-title" style={{ fontSize: '23px', marginBottom: '12px' }}>
            Obras Mais Procuradas e Fila de Espera (Demanda Reprimida)
          </h2>

          <div
            className="table-wrapper"
            style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título da Obra</th>
                  <th>Empréstimos</th>
                  <th>Fila Atual</th>
                  <th>Recomendação</th>
                </tr>
              </thead>
              <tbody>
                {TOP_DEMAND_BOOKS.map((item) => (
                  <tr key={item.title}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {item.author}
                      </div>
                    </td>
                    <td>{item.loans}</td>
                    <td>{item.queue}</td>
                    <td>
                      <strong
                        style={{
                          fontSize: '13px',
                          color: item.urgent
                            ? 'var(--color-warning-text)'
                            : 'var(--color-success-text)',
                        }}
                      >
                        {item.rec}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="serif-title" style={{ fontSize: '23px', marginBottom: '12px' }}>
            Balanço do Inventário Físico (Auditoria)
          </h2>

          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {INVENTORY_BALANCE.map((row) => (
              <div key={row.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  <span>{row.label}</span>
                  <span style={{ color: row.color }}>{row.value}</span>
                </div>
                <div
                  style={{
                    height: '7px',
                    backgroundColor: '#ECE7DF',
                    borderRadius: '99px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${row.pct}%`,
                      height: '100%',
                      backgroundColor: row.color,
                      borderRadius: '99px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra Inferior: Ações de Fechamento Operacional e Inventário */}
      <div
        style={{
          backgroundColor: '#FAF7F0',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '18px 20px',
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', marginBottom: '4px' }}>
          Ações de Fechamento Operacional e Inventário:
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
          Emita relatórios fiscais para auditoria universitária ou inicie a conferência semestral de estantes físicas.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              onClick={() => showToast('Relatório de Inadimplência gerado com sucesso!')}
            >
              Relatório de Inadimplência
            </button>
            <button
              className="btn btn-outline"
              onClick={() => showToast('Dados analíticos exportados em formato CSV!')}
            >
              <FileSpreadsheet size={15} /> Exportar Dados para CSV
            </button>
            <button
              className="btn btn-teal"
              onClick={() => setActiveTab('Inventário')}
            >
              <ClipboardCheck size={15} /> Iniciar Auditoria de Acervo
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setActiveTab('Catálogo')}
          >
            <Plus size={15} /> + Entrada de Novo Lote
          </button>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;