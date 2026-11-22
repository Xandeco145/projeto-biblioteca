import React from 'react';
import { Download, FileSpreadsheet, ClipboardCheck, Plus, CalendarDays } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { diffInDays, formatCurrency, formatPercent } from '../../utils/format';
import { getBookAvailability } from '../../utils/library';
import { downloadCsv, fileStamp, printDocument } from '../../utils/export';

const BALANCE_ROWS = [
  { status: 'Disponível', label: 'Exemplares nas Estantes (Disponíveis):', color: '#1B6B4A' },
  { status: 'Emprestado', label: 'Empréstimos Ativos com Leitores:', color: '#D68C45' },
  { status: 'Reservado', label: 'Reservados para Retirada (Balcão):', color: '#9A5512' },
  { status: 'Em reparo', label: 'Em Reparo / Restauração (Danos):', color: '#525E62' },
  { status: 'Consulta local', label: 'Consulta Local (Não Circulantes):', color: '#185266' },
  { status: 'Baixa contábil', label: 'Perdas / Extravios (Baixa Contábil):', color: '#A62626' },
];

const Relatorios = () => {
  const {
    books,
    loans,
    loanHistory,
    reservations,
    fines,
    inventoryItems,
    today,
    showToast,
    setActiveTab,
  } = useLibrary();

  // ---- Indicadores calculados a partir dos dados do sistema ----
  const allCopies = books.flatMap((b) => b.copies);
  const totalCopies = allCopies.length;
  const countCopies = (status) => allCopies.filter((c) => c.status === status).length;
  const circulatingCopies = totalCopies - countCopies('Consulta local') - countCopies('Baixa contábil');
  const occupiedCopies = countCopies('Emprestado') + countCopies('Reservado');

  const checkoutsLast30 = [...loans, ...loanHistory].filter(
    (l) => diffInDays(l.checkoutDate, today) <= 30
  ).length;
  const overdueLoans = loans.filter((l) => l.daysOverdue > 0);
  const paidFines = fines.filter((f) => f.status === 'Quitada');
  const pendingFines = fines.filter((f) => f.status === 'Pendente');
  const revenue = paidFines.reduce((acc, f) => acc + f.amount, 0);
  const receivable = pendingFines.reduce((acc, f) => acc + f.amount, 0);
  const turnover = circulatingCopies ? (checkoutsLast30 / circulatingCopies) * 100 : 0;
  const occupancy = circulatingCopies ? (occupiedCopies / circulatingCopies) * 100 : 0;

  const kpis = [
    {
      label: 'EMPRÉSTIMOS (ÚLTIMOS 30 DIAS)',
      value: String(checkoutsLast30),
      detail: `${loans.length} ativos agora • ${overdueLoans.length} em atraso`,
      detailColor: overdueLoans.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)',
    },
    {
      label: 'RECEITA DE MULTAS ARRECADADAS',
      value: formatCurrency(revenue),
      valueColor: 'var(--color-warning-text)',
      detail: `${formatCurrency(receivable)} a receber (RF08)`,
    },
    {
      label: 'ROTATIVIDADE DO ACERVO (30 DIAS)',
      value: formatPercent(turnover),
      detail: `Ocupação atual: ${formatPercent(occupancy)} dos exemplares circulantes`,
      detailColor: 'var(--color-success-text)',
    },
    {
      label: 'TOTAL DE EXEMPLARES NO ACERVO',
      value: String(totalCopies),
      detail: `${books.length} títulos catalogados`,
    },
  ];

  // ---- Demanda reprimida: fila de espera real + histórico de empréstimos ----
  const demandRows = books
    .map((book) => {
      const info = getBookAvailability(book);
      const queue = reservations.filter((r) => r.bookId === book.id && r.status === 'Em espera').length;
      let rec = 'Acervo suficiente';
      let urgent = false;
      if (queue > 0) {
        rec = `Adquirir +${queue} ex.`;
        urgent = true;
      } else if (!info.isLocalOnly && info.available === 0) {
        rec = 'Monitorar demanda';
        urgent = true;
      } else if (info.isLocalOnly) {
        rec = 'Consulta local';
      }
      return { book, info, queue, rec, urgent };
    })
    .sort((a, b) => b.queue - a.queue || (b.book.totalLoans || 0) - (a.book.totalLoans || 0))
    .slice(0, 5);

  // ---- Balanço do inventário físico (todos os itens patrimoniais) ----
  const totalItems = inventoryItems.length || 1;
  const balance = BALANCE_ROWS.map((row) => {
    const count = inventoryItems.filter((i) => i.status === row.status).length;
    return { ...row, count, pct: (count / totalItems) * 100 };
  });

  // ---- Exportações ----
  const handleExportReport = () => {
    const ok = printDocument({
      title: 'Relatório Gerencial da Biblioteca',
      subtitle: `Visão estratégica do acervo e finanças • data-base ${today}`,
      sections: [
        { heading: 'Indicadores', kpis: kpis.map((k) => ({ label: k.label, value: k.value })) },
        {
          heading: 'Obras mais procuradas e fila de espera',
          headers: ['Obra', 'Autor', 'Empréstimos (histórico)', 'Fila atual', 'Recomendação'],
          rows: demandRows.map((r) => [r.book.title, r.book.author, r.book.totalLoans || 0, r.queue, r.rec]),
        },
        {
          heading: 'Balanço do inventário físico',
          headers: ['Situação', 'Quantidade', 'Percentual'],
          rows: balance.map((b) => [b.status, b.count, formatPercent(b.pct)]),
        },
      ],
    });
    showToast(
      ok
        ? 'Relatório gerencial aberto para impressão — escolha "Salvar como PDF".'
        : 'O navegador bloqueou a janela de impressão. Permita pop-ups para este site.',
      ok ? 'success' : 'error'
    );
  };

  const handleDelinquencyReport = () => {
    const rows = pendingFines.map((f) => [
      f.userName,
      f.userMatricula,
      f.bookTitle,
      f.tombo,
      f.accruing ? `Venceu em ${f.date}` : f.date,
      f.daysOverdue,
      f.amount.toFixed(2).replace('.', ','),
      f.accruing ? 'Em apuração (devolução pendente)' : 'Multa pendente',
    ]);
    downloadCsv(
      `relatorio-inadimplencia-${fileStamp()}.csv`,
      ['Leitor', 'Matrícula', 'Obra', 'Tombo', 'Data', 'Dias de atraso', 'Valor (R$)', 'Situação'],
      rows
    );
    showToast(`Relatório de inadimplência exportado (${rows.length} registro(s)).`);
  };

  const handleExportCsv = () => {
    const rows = books.flatMap((b) =>
      b.copies.map((c) => [
        c.tombo,
        b.title,
        b.author,
        b.category,
        b.cdd,
        c.location,
        c.status,
        c.holder || '',
        c.dueDate || '',
        b.totalLoans || 0,
      ])
    );
    downloadCsv(
      `acervo-circulacao-${fileStamp()}.csv`,
      ['Tombo', 'Obra', 'Autor', 'Categoria', 'CDD', 'Localização', 'Situação', 'Leitor / Observação', 'Devolução / Retirada até', 'Empréstimos (histórico da obra)'],
      rows
    );
    showToast(`Dados analíticos exportados em CSV (${rows.length} exemplares).`);
  };

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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-neutral" style={{ padding: '9px 12px', fontSize: '12.5px' }}>
            <CalendarDays size={14} /> Data-base: {today}
          </span>

          <button type="button" className="btn btn-primary" onClick={handleExportReport}>
            <Download size={15} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* 4 Cards Executivos (Frame 4.6 / relatorio gerencial.PNG) */}
      <div className="kpi-grid-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card" style={{ backgroundColor: '#FAF7F0' }}>
            <div className="overline-label">{kpi.label}</div>
            <div className="kpi-value" style={kpi.valueColor ? { color: kpi.valueColor } : undefined}>
              {kpi.value}
            </div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: kpi.detailColor ? 700 : 400,
                color: kpi.detailColor || 'var(--color-text-secondary)',
              }}
            >
              {kpi.detail}
            </div>
          </div>
        ))}
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
                {demandRows.map(({ book, queue, rec, urgent }) => (
                  <tr key={book.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>{book.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{book.author}</div>
                    </td>
                    <td>{book.totalLoans || 0} vezes</td>
                    <td>{queue === 0 ? 'Sem fila' : `${queue} leitor(es)`}</td>
                    <td>
                      <strong
                        style={{
                          fontSize: '13px',
                          color: urgent ? 'var(--color-warning-text)' : 'var(--color-success-text)',
                        }}
                      >
                        {rec}
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
              gap: '14px',
            }}
          >
            {balance.map((row) => (
              <div key={row.status}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    gap: '8px',
                  }}
                >
                  <span>{row.label}</span>
                  <span style={{ color: row.color, whiteSpace: 'nowrap' }}>
                    {row.count} ex. ({formatPercent(row.pct, 0)})
                  </span>
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
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Total: {inventoryItems.length} itens patrimoniais (livros, TCCs e periódicos).
            </div>
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
            <button type="button" className="btn btn-outline" onClick={handleDelinquencyReport}>
              Relatório de Inadimplência
            </button>
            <button type="button" className="btn btn-outline" onClick={handleExportCsv}>
              <FileSpreadsheet size={15} /> Exportar Dados para CSV
            </button>
            <button type="button" className="btn btn-teal" onClick={() => setActiveTab('Inventário')}>
              <ClipboardCheck size={15} /> Iniciar Auditoria de Acervo
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveTab('Catálogo', { type: 'new-book' })}
          >
            <Plus size={15} /> Entrada de Novo Lote
          </button>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
