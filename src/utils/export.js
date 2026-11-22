// Exportações reais do protótipo:
// - CSV separado por ";" com BOM UTF-8 (abre corretamente no Excel em português);
// - Documento de impressão em nova janela (o usuário pode escolher "Salvar como PDF").

const escapeCsv = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  return /[";\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export function downloadCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsv).join(';'));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: 'Instrument Sans', Arial, sans-serif; color: #1E2528; margin: 32px; }
  header { border-bottom: 3px solid #D68C45; padding-bottom: 12px; margin-bottom: 20px; }
  .brand { font-family: Georgia, serif; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: #185266; }
  h1 { font-family: Georgia, serif; color: #0B303D; font-size: 24px; margin: 6px 0 4px; }
  .subtitle { color: #465256; font-size: 13px; margin: 0; }
  h2 { color: #0B303D; font-size: 16px; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #ECE7DF; text-align: left; padding: 7px 8px; border: 1px solid #DDD6CA; }
  td { padding: 6px 8px; border: 1px solid #DDD6CA; vertical-align: top; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .kpi { border: 1px solid #DDD6CA; border-radius: 6px; padding: 10px; }
  .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #465256; }
  .kpi-value { font-size: 20px; font-weight: 700; color: #0B303D; margin-top: 4px; }
  .labels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .label { border: 1px dashed #525E62; border-radius: 6px; padding: 10px; page-break-inside: avoid; }
  .label .code { font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; letter-spacing: 1px; }
  .label .bars { font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: -1px; overflow: hidden; white-space: nowrap; }
  .label .title { font-size: 11px; margin-top: 4px; }
  footer { margin-top: 28px; font-size: 11px; color: #525E62; border-top: 1px solid #DDD6CA; padding-top: 8px; }
  @media print { body { margin: 12mm; } }
`;

const renderTable = (headers, rows) => `
  <table>
    <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${
      rows.length === 0
        ? `<tr><td colspan="${headers.length}">Nenhum registro encontrado.</td></tr>`
        : rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')
    }</tbody>
  </table>`;

/**
 * Abre o documento de impressão.
 * sections: [{ heading, headers, rows }] | [{ heading, kpis: [{label, value}] }] | [{ heading, labels: [{code, title}] }]
 * Retorna false se o navegador bloquear a janela.
 */
export function printDocument({ title, subtitle = '', sections = [] }) {
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) return false;

  const body = sections
    .map((section) => {
      const heading = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : '';
      if (section.kpis) {
        return `${heading}<div class="kpis">${section.kpis
          .map(
            (k) =>
              `<div class="kpi"><div class="kpi-label">${escapeHtml(k.label)}</div><div class="kpi-value">${escapeHtml(k.value)}</div></div>`
          )
          .join('')}</div>`;
      }
      if (section.labels) {
        return `${heading}<div class="labels">${section.labels
          .map(
            (l) =>
              `<div class="label"><div class="bars">${'|‖|'.repeat(9)}</div><div class="code">${escapeHtml(l.code)}</div><div class="title">${escapeHtml(l.title)}</div></div>`
          )
          .join('')}</div>`;
      }
      return `${heading}${renderTable(section.headers, section.rows)}`;
    })
    .join('');

  const generatedAt = new Date().toLocaleString('pt-BR');
  win.document.write(`<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${PRINT_STYLES}</style></head>
<body>
  <header>
    <div class="brand">ULBRA • Biblioteca Acadêmica</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
  </header>
  ${body}
  <footer>Documento gerado em ${escapeHtml(generatedAt)} pelo Sistema Integrado de Bibliotecas — CEULP/ULBRA.</footer>
  <script>window.addEventListener('load', function () { window.focus(); window.print(); });</script>
</body>
</html>`);
  win.document.close();
  return true;
}

export function fileStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
