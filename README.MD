# 📚 Sistema de Gestão de Biblioteca Acadêmica — ULBRA

Protótipo funcional interativo desenvolvido em **React 18 + Vite** para o gerenciamento do acervo, circulação de exemplares, reservas e indicadores gerenciais da Biblioteca Acadêmica da **ULBRA**.

O sistema funciona **100% em memória no front-end** por meio de estado global reativo (`LibraryContext`): qualquer empréstimo, devolução, renovação, reserva, cadastro de obra ou quitação de multa realizada em uma tela atualiza instantaneamente todas as outras visões e perfis.

> **Datas da simulação:** todas as datas do protótipo são calculadas a partir da **data atual do computador**. Assim, prazos, dias de atraso e multas estão sempre coerentes, em qualquer dia em que o sistema for apresentado (ex.: o empréstimo do Rafael Oliveira sempre aparece com **3 dias de atraso = R$ 11,00**). Ao recarregar a página, os dados voltam ao estado inicial.

---

## 🚀 1. Como Instalar e Rodar o Projeto (Guia Rápido)

### Pré-requisitos
* **Node.js** instalado (versão `18.x` ou superior recomendada).
* **Git** instalado para clonar o repositório.

### Passo a passo no terminal

1. **Clone o repositório e entre na pasta do projeto:**
   ```bash
   git clone https://github.com/Xandeco145/projeto-biblioteca.git
   cd projeto-biblioteca
   ```

2. **Instale as dependências necessárias:**
   ```bash
   npm install
   ```
   > **Dependências principais utilizadas (`package.json`):**
   > * `react` e `react-dom` (`^18.3.1`) — Biblioteca de interface.
   > * `lucide-react` (`^0.400.0`) — Biblioteca de ícones.
   > * `vite` e `@vitejs/plugin-react` (`^5.4.0` / `^4.3.0`) — Bundler e servidor de desenvolvimento.

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   Abra o endereço exibido no terminal (geralmente `http://localhost:5173`).

5. **Gerar e testar o build de produção (para deploy):**
   ```bash
   npm run build
   npm run preview
   ```

---

## 🗂️ 2. Estrutura de Pastas e Onde Mexer em Cada Coisa

```text
├── index.html                          # Fontes Google Fonts, ícone e título da aba
├── package.json                        # Dependências e scripts (dev, build, preview)
├── vite.config.js                      # Configuração do Vite (base relativa para qualquer hospedagem)
├── .github/workflows/deploy.yml        # Deploy automático no GitHub Pages
└── src/
    ├── main.jsx                        # Ponto de entrada que envolve o App no LibraryProvider
    ├── App.jsx                         # Roteamento principal entre Login, Visão Aluno e Visão Gestão
    │
    ├── styles/
    │   └── tokens.css                  # 🎨 CORES, FONTES, BOTÕES, TABELAS, CARDS E MODAIS GLOBAIS
    │
    ├── data/
    │   └── mockData.js                 # ⚙️ REGRAS DE NEGÓCIO (prazos/multas) + DADOS INICIAIS (livros, usuários, etc.)
    │
    ├── context/
    │   └── LibraryContext.jsx          # 🧠 LÓGICA DO SISTEMA (emprestar, devolver, renovar, reservar, multas)
    │
    ├── utils/
    │   ├── format.js                   # Datas dd/mm/aaaa, cálculo de dias e formatação de moeda (R$)
    │   ├── library.js                  # Regras puras: multa (RF08), disponibilidade da obra, prazo de retirada
    │   └── export.js                   # Exportação real em CSV (Excel) e impressão/PDF
    │
    ├── components/
    │   ├── Header/Header.jsx           # Barra superior, título dinâmico da página e seletor rápido de perfil
    │   └── Sidebar/                    # Menu lateral dinâmico (filtra abas por Aluno, Bibliotecário ou Admin)
    │
    └── pages/
        ├── Login.jsx                   # Autenticação institucional (@rede.ulbra.br / @ulbra.br)
        ├── aluno/                      # 🎓 PORTAL DO ALUNO (LEITOR)
        │   ├── AlunoDashboard.jsx      # Resumo do aluno, empréstimos ativos, renovação (+14d) e reservas
        │   ├── AlunoCatalogo.jsx       # Consulta ao acervo, filtros, reserva (48h) e fila de espera
        │   ├── AlunoReservas.jsx       # Reservas ativas e posição dinâmica na fila de espera
        │   └── AlunoMultasNotificacoes.jsx # Multas/débitos (RF08) e central de notificações (RF16)
        └── gestao/                     # 🏛️ TELAS DA EQUIPE (BIBLIOTECÁRIO E GESTOR / ADMIN)
            ├── GestaoDashboard.jsx     # KPIs, circulação dos últimos 7 dias, atalhos e alertas automáticos
            ├── GestaoCatalogo.jsx      # Obras, ficha de tombos, cadastro de obra (RF01) e categorias (RF15)
            ├── Emprestimos.jsx         # Empréstimo no balcão (RF03/04/05) e devolução com multa (RF06/RF08)
            ├── GestaoReservas.jsx      # Retiradas no balcão, fila de espera e cancelamentos
            ├── Usuarios.jsx            # Cadastro de usuários, quitação de multas e perfis de acesso (RBAC)
            ├── Inventario.jsx          # Patrimônio: baixa (RF14), restauração, TCC/Artigo, etiquetas e auditoria
            └── Relatorios.jsx          # Indicadores gerenciais e exportações (exclusivo Admin — RF13)
```

### Guia rápido de manutenção:
* **Cores, bordas, fontes, botões e tabelas:** `src/styles/tokens.css`.
* **Livros, usuários, tombos e valores das regras:** `src/data/mockData.js` (objeto `BUSINESS_RULES` no topo).
* **Lógica de bloqueio, multa, fila e validações:** `src/context/LibraryContext.jsx`.

---

## 📋 3. Regras de Negócio Implementadas (Requisitos Funcionais)

* **RF01 — Cadastro de Obras:** título, autor, editora, ano, edição, ISBN (10 ou 13 dígitos, sem duplicidade), categoria/CDD (preenchida automaticamente pela categoria), tipo de circulação, localização e geração sequencial de tombos (`TB-01245-1`, `TB-01245-2`...).
* **RF03 — Prazo de Empréstimo e Renovação:** **14 dias corridos** por empréstimo ou renovação.
* **RF04 — Limite Simultâneo:** máximo de **2 livros simultâneos** por leitor.
* **RF05 — Bloqueio por Pendência:** leitores com **multa pendente** ou **devolução em atraso** ficam automaticamente com situação **Suspenso** e bloqueados para novos empréstimos e renovações até a regularização. A situação é recalculada sozinha ao devolver o livro ou quitar a multa.
* **RF06 / RF08 — Devolução e Multa Automática:** taxa fixa de **R$ 5,00 + R$ 2,00 por dia de atraso** (ex.: 3 dias = `R$ 11,00`). Enquanto o livro não é devolvido, a multa aparece como **"Em apuração"** (valor acumulando); na devolução ela é registrada uma única vez como **quitada no balcão** ou **pendente**.
* **RF09 — Limite de Renovações:** até **5 renovações** de `+14 dias`, bloqueadas se houver fila de espera para a obra, atraso ou multa pendente.
* **RF10 — Reserva e Fila de Espera:** obra disponível → exemplar separado no balcão por **48 horas** (até 18h do prazo); obra sem exemplares → **fila de espera com posição dinâmica**. Ao devolver, cancelar uma reserva pronta ou concluir uma restauração, o exemplar vai automaticamente para o **1º da fila**. Obras de **consulta local** não podem ser reservadas nem emprestadas.
* **RF14 — Baixa Patrimonial e Restauração:** o inventário reúne todos os exemplares do catálogo + TCCs e periódicos. Baixa e restauração alteram o próprio exemplar (ele deixa de circular) e não são permitidas para exemplares emprestados ou reservados.
* **RF16 — Notificações:** cada leitor vê apenas as próprias notificações (empréstimo, renovação, reserva pronta, fila, multas). A equipe recebe alertas automáticos de atrasos e retiradas pendentes.
* **RBAC — Controle de Acesso por Perfil:**
  * **Aluno:** Dashboard, Catálogo, Reservas, Multas e Notificações.
  * **Bibliotecário:** Dashboard, Catálogo, Empréstimos, Reservas, Usuários e Inventário (cadastra apenas leitores).
  * **Gestor / Admin:** acesso completo + **Relatórios** + alteração de perfis de acesso (não pode alterar o próprio perfil).

### Contas de demonstração

| Perfil | Nome | E-mail institucional | Situação inicial |
|---|---|---|---|
| Aluno | Mariana Costa | `mariana.costa@rede.ulbra.br` | 2 de 2 livros (limite RF04) |
| Aluno | Lucas Almeida | `lucas.almeida@rede.ulbra.br` | Reserva pronta de *Dom Casmurro* |
| Aluno | Rafael Oliveira | `rafael.oliveira@rede.ulbra.br` | **Suspenso** — 3 dias de atraso |
| Aluno | Camila Ferreira | `camila.ferreira@rede.ulbra.br` | 1º lugar na fila de *O capital* |
| Docente | Beatriz Santos | `beatriz.santos@ulbra.br` | 2 livros emprestados |
| Bibliotecário | Ana Paula Silva | `ana.silva@ulbra.br` | — |
| Gestor / Admin | Carlos Mendes | `carlos.mendes@ulbra.br` | — |

> Apenas e-mails cadastrados entram no sistema. Novos usuários cadastrados na tela **Usuários** já podem fazer login com o e-mail informado.

---

## 🧪 4. Roteiro de Testes para Revisão da Equipe

### Teste 1: Login e Troca de Perfis
1. Na tela de **Login**, entre pelos botões de acesso rápido (**Aluno**, **Bibliotecário**, **Admin**) ou digitando um e-mail da tabela acima. Um e-mail não cadastrado mostra mensagem de erro.
2. Verifique se o menu lateral muda conforme o perfil (o Aluno **não** vê *Empréstimos*, *Usuários*, *Inventário* ou *Relatórios*).
3. Use o menu no canto superior direito do cabeçalho (`Mariana Costa ▾`) para alternar rapidamente entre os perfis.

### Teste 2: Fluxo do Aluno (Renovação, Reserva e Fila)
1. Acesse como **Mariana Costa (Aluno)**.
2. No **Dashboard**, clique em **Renovar +14d** na obra *"Pedagogia da autonomia"*. O modal mostra a nova data limite (`+14 dias`) e `1 de 5 permitidas`.
3. Vá em **Catálogo**, busque *"Código Limpo"* e clique em **Reservar**. O modal avisa que ela já está no limite de 2 livros (RF04). Confirme e veja a reserva em **Reservas**.
4. Ainda no **Catálogo**, busque *"O capital — Livro I"* (0 exemplares disponíveis) e clique em **Entrar na Fila** — ela entra em **2º lugar** (Camila é a 1ª).
5. Acesse **Multas e Débitos** e **Notificações** para validar o extrato e a marcação de leitura (individual ou "Marcar todas como lidas").

### Teste 3: Fluxo do Bibliotecário (Empréstimo, Bloqueio e Devolução com Multa)
1. Alterne para **Ana Paula Silva (Bibliotecário)**.
2. Vá em **Empréstimos** → **Novo Empréstimo**:
   * Selecione **Rafael Oliveira** (suspenso) ou **Mariana Costa** (2 livros ativos): o cartão de validação e a confirmação exibem o bloqueio RF05/RF04.
   * Empreste *"Dom Casmurro"* para **Lucas Almeida**: como ele tem a reserva **R-0261** pronta, o sistema usa o exemplar reservado `TB-00642-5` e efetiva a reserva.
3. Na linha do empréstimo em atraso de **Rafael Oliveira** (*"O capital — Livro I"*), clique em **Baixa / Multa**:
   * Verifique o cálculo automático de **R$ 11,00** (`R$ 5,00 + 3 × R$ 2,00`) e o aviso de fila de espera.
   * Escolha *"Multa quitada agora no balcão"* e clique em **Confirmar Devolução**. O exemplar é reservado automaticamente para **Camila Ferreira** (1ª da fila) e a **Mariana sobe para o 1º lugar**.
   * Em **Usuários**, o Rafael volta a ficar **Ativo** (sem multa duplicada).
   * Teste também *"Lançar débito pendente no portal"* (após recarregar a página): o Rafael continua suspenso até clicar em **Quitar Multa Agora** na ficha dele.

### Teste 4: Fluxo Administrativo e Patrimonial (Admin)
1. Alterne para **Carlos Mendes (Gestor / Admin)**.
2. Em **Catálogo**, teste **Cadastrar Obra** e **Categorias e Gêneros**; depois clique em **Ver ficha** em qualquer livro para inspecionar os tombos e usar **Reservar Livro** (escolhendo o leitor).
3. Em **Usuários**, clique em **Ver ficha** de um aluno e altere o **Perfil de Acesso (RBAC)**; cadastre um **Novo Usuário** e faça login com o e-mail dele.
4. Em **Inventário**, cadastre um **TCC / Artigo**, emita uma **Baixa Patrimonial** (o exemplar deixa de circular no catálogo) e use **Restauração e Auditoria → Concluir restauração** em `TB-00264-3`.
5. Acesse **Relatórios**, confira os indicadores e teste **Exportar Relatório** (PDF), **Relatório de Inadimplência** e **Exportar Dados para CSV**.

---

## 🌐 5. Deploy (Link Online)

### Opção A — GitHub Pages (automático, já configurado)
1. No GitHub, abra **Settings → Pages → Build and deployment → Source** e selecione **GitHub Actions** (uma única vez).
2. Cada `git push` na branch `main` executa o workflow `.github/workflows/deploy.yml`, que gera o build e publica o site.
3. Link final: **https://xandeco145.github.io/projeto-biblioteca/** (acompanhe na aba **Actions**).

### Opção B — Vercel ou Netlify
* **Vercel / Netlify (importando o repositório):** Framework `Vite`, comando de build `npm run build`, pasta de publicação `dist`.
* **Netlify Drop (sem conta de Git):** rode `npm run build` e arraste a pasta `dist` em <https://app.netlify.com/drop>.

---

## 🛠️ 6. Correções Aplicadas na Revisão Final

**Regras e fluxos**
- Multa do Rafael era **cobrada em dobro** na devolução e ele continuava bloqueado após pagar → a multa agora é calculada automaticamente ("Em apuração") e registrada uma única vez na devolução.
- Situação **Ativo/Suspenso** e **posição na fila** eram valores fixos que ficavam desatualizados → agora são calculadas automaticamente (RF05/RF10).
- **Renovação** só verificava o próprio exemplar → agora também bloqueia quem tem outro atraso ou multa pendente (RF05).
- Empréstimo avulso podia usar o exemplar **reservado para outro leitor** → corrigido; o exemplar reservado é usado apenas pelo próprio leitor e a reserva é efetivada.
- Botão **"Reservar Livro"** da ficha da obra reservava sempre para o Lucas → agora pede o leitor e mostra o resultado.
- **"Nova Reserva"** e **"Efetivar Retirada"** falhavam em silêncio → agora exibem o motivo (RF04/RF05, duplicidade etc.).
- Era possível reservar **obra de consulta local** (fila que nunca andava) ou uma obra que o leitor **já estava com ele** → bloqueado.
- Cancelar uma reserva pronta agora repassa o exemplar ao **próximo da fila**; a equipe também pode cancelar reservas e ver prazos de retirada expirados.
- **Inventário** e **catálogo** não conversavam (baixa de um exemplar não o tirava de circulação) → agora o inventário reflete os exemplares reais, com retorno da restauração.
- **Login** com e-mail desconhecido entrava como Mariana Costa (e quebrava após cadastrar usuários) → agora só entram e-mails cadastrados.
- **Notificações** de um aluno apareciam para todos e "marcar como lidas" afetava todos os perfis → agora são individuais.
- Tombos de TCC e códigos de reserva/multa podiam se **repetir** → numeração sequencial e validação de duplicidade.

**Dados e textos**
- Datas inconsistentes ("hoje" valia 18/10, 19/10 ou 21/10 conforme a tela; 3 ou 4 dias de atraso) → data única do sistema.
- Exemplares emprestados sem registro de empréstimo (Lucas, Camila, Beatriz) → registros criados.
- Indicadores fixos e contraditórios (1.248 obras, 186 × 542 empréstimos, 840 × 841 usuários, 105% no balanço, "72.4%", "010" reservas) → todos calculados a partir dos dados reais.
- Prazo de garantia da fila "24 horas" contradizia a regra de 48h → corrigido.
- Textos revisados: "Data de Retirada", "Data-Limite de Devolução", "Sala de Leitura", "Multa quitada agora no balcão", botões com "+" duplicado, CDD da categoria, entre outros.
- Exportações (CSV, PDF e etiquetas) agora geram arquivos reais em vez de apenas uma mensagem.

---

## ⚠️ 7. Checklist de Revisão do Grupo (Antes do Deploy)
- [x] Conferir se não há erros de digitação nos textos das telas e modais.
- [x] Validar se todas as ações interativas estão funcionando sem erros no console do navegador (`F12`).
- [x] Testar o comando `npm run build` no terminal para garantir que a versão de produção compila sem falhas.
