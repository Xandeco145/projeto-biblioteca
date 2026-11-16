# 📚 Sistema de Gestão de Biblioteca Acadêmica — ULBRA

Protótipo funcional interativo desenvolvido em **React 18 + Vite** para o gerenciamento do acervo, circulação de exemplares, reservas e indicadores gerenciais da Biblioteca Acadêmica da **ULBRA**.

O sistema funciona **100% em memória no front-end** por meio de estado global reativo (`LibraryContext`): qualquer empréstimo, devolução, renovação, reserva, cadastro de obra ou quitação de multa realizada em uma tela atualiza instantaneamente todas as outras visões e perfis.

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

5. **Gerar build de produção (para deploy):**
   ```bash
   npm run build
   ```

---

## 🗂️ 2. Estrutura de Pastas e Onde Mexer em Cada Coisa

Se você precisar alterar textos, cores, regras de negócio ou o visual de alguma tela específica, consulte o mapa abaixo:

```text
├── index.html                          # Importação das fontes Google Fonts e título da aba
├── package.json                        # Dependências e scripts (dev, build, preview)
├── vite.config.js                      # Configuração do Vite
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
    ├── components/
    │   ├── Header/
    │   │   └── Header.jsx              # Barra superior, título dinâmico da página e seletor rápido de perfil
    │   └── Sidebar/
    │       ├── Sidebar.jsx             # Menu lateral dinâmico (filtra abas por Aluno, Bibliotecário ou Admin)
    │       └── Sidebar.css             # Estilização da barra lateral
    │
    └── pages/
        ├── Login.jsx                   # Tela de autenticação institucional (@rede.ulbra.br / @ulbra.br)
        │
        ├── aluno/                      # 🎓 TELAS DO PORTAL DO ALUNO (LEITOR)
        │   ├── AlunoDashboard.jsx      # Resumo do aluno, empréstimos ativos, modal de renovação (+14d) e reservas
        │   ├── AlunoCatalogo.jsx       # Consulta ao acervo, filtros, modal de reserva (48h) e fila de espera
        │   ├── AlunoReservas.jsx       # Painel dedicado às reservas ativas e posição na fila de espera
        │   └── AlunoMultasNotificacoes.jsx # Consulta de débitos/multas (RF08) e central de notificações
        │
        └── gestao/                     # 🏛️ TELAS DA EQUIPE (BIBLIOTECÁRIO E GESTOR / ADMIN)
            ├── GestaoDashboard.jsx     # KPIs gerenciais, gráfico semanal, atalhos de rotina e notificações
            ├── GestaoCatalogo.jsx      # Lista de obras, ficha detalhada de tombos, cadastro de obra e categorias
            ├── Emprestimos.jsx         # Circulação de balcão, modal de novo empréstimo e devolução com multa
            ├── GestaoReservas.jsx      # Gestão de retiradas no balcão e efetivação de reservas
            ├── Usuarios.jsx            # Cadastro de usuários, quitação de multas e promoção de perfil (Admin)
            ├── Inventario.jsx          # Auditoria patrimonial, baixa, restauração e cadastro de TCC/Artigo
            └── Relatorios.jsx          # Visão estratégica, demanda reprimida e exportações (exclusivo Admin)
```

### Guia rápido de manutenção:
* **Quer mudar cores, bordas, tamanhos de fonte ou aparência de botões/tabelas?** Edite `src/styles/tokens.css`.
* **Quer alterar os livros, alunos, tombos ou valores das regras?** Edite `src/data/mockData.js` (no objeto `BUSINESS_RULES` no topo do arquivo).
* **Quer ajustar a lógica de bloqueio, cálculo de multa ou validação de formulários?** Edite `src/context/LibraryContext.jsx`.

---

## 📋 3. Regras de Negócio Implementadas (Requisitos Funcionais)

Todas as regras abaixo já estão programadas e validadas nas interações do sistema:

* **RF01 — Cadastro de Obras:** Permite registrar título, autor, editora, ano, ISBN, categoria/CDD, localização e gerar tombos automáticos (`TB-XXXXX-1`, etc.).
* **RF03 — Prazo de Empréstimo e Renovação:** **14 dias corridos** por empréstimo ou renovação.
* **RF04 — Limite Simultâneo:** Máximo de **2 livros simultâneos** por aluno.
* **RF05 — Bloqueio por Pendência:** Usuários com multa pendente ou devolução em atraso (ex.: *Rafael Oliveira*) ficam bloqueados para novos empréstimos e renovações até a quitação.
* **RF08 — Cálculo Automático de Multa:** Taxa fixa de **R$ 5,00 + R$ 2,00 por dia de atraso** (ex.: 3 dias de atraso = `R$ 11,00`).
* **RF09 — Limite de Renovações:** Até **5 renovações consecutivas** de `+14 dias`, bloqueadas automaticamente se houver fila de espera para a obra ou multa pendente.
* **RF10 — Reserva e Fila de Espera:** Obras disponíveis geram reserva de balcão com prazo de retirada de **48 horas**; obras totalmente emprestadas inserem o leitor na **fila de espera** com posição dinâmica.
* **RBAC — Controle de Acesso por Perfil:**
  * **Aluno:** Acessa *Dashboard, Catálogo, Reservas, Multas e Notificações*.
  * **Bibliotecário:** Acessa *Dashboard, Catálogo, Empréstimos, Reservas, Usuários e Inventário*.
  * **Gestor / Admin:** Acesso completo + aba *Relatórios* + permissão para alterar perfis de acesso de usuários.

---

## 🧪 4. Roteiro de Testes para Revisão da Equipe

Antes de aprovar para o deploy final, testem cada um dos cenários abaixo:

### Teste 1: Login e Troca de Perfis
1. Na tela de **Login**, teste entrar usando os botões de acesso rápido (**Aluno**, **Bibliotecário**, **Admin**) ou digitando um e-mail `@rede.ulbra.br` / `@ulbra.br`.
2. Verifique se o menu lateral (Sidebar) muda corretamente conforme o perfil escolhido (o Aluno **não** deve ver *Usuários*, *Inventário* ou *Relatórios*).
3. Utilize o menu no canto superior direito do cabeçalho (`Mariana Costa ▾`) para alternar rapidamente entre os perfis durante os testes.

### Teste 2: Fluxo do Aluno (Renovação, Reserva e Fila)
1. Acesse como **Mariana Costa (Aluno)**.
2. No **Dashboard**, clique em **Renovar +14d** na obra *"Pedagogia da autonomia"*. Confirme se o modal exibe a nova data limite (`+14 dias`) e atualiza o contador para `1 de 5 permitidas`.
3. Vá em **Catálogo**, busque por *"Código Limpo"* e clique em **Reservar**. Confirme a reserva e verifique se ela aparece imediatamente na aba **Reservas**.
4. Ainda no **Catálogo**, busque por *"O capital — Livro I"* (0 exemplares disponíveis) e clique em **Entrar na Fila**. Confirme a entrada na fila de espera.
5. Acesse **Multas e Débitos** e **Notificações** para validar o extrato e a marcação de leitura das notificações.

### Teste 3: Fluxo do Bibliotecário (Empréstimo, Bloqueio e Devolução com Multa)
1. Alterne para **Ana Paula Silva (Bibliotecário)**.
2. Vá em **Empréstimos** → **+ Novo Empréstimo**:
   * Tente emprestar um livro para **Rafael Oliveira** (usuário suspenso) ou **Mariana Costa** (que já possui 2 livros ativos) e verifique se o sistema bloqueia exibindo a justificativa do RF04/RF05.
   * Empreste um exemplar disponível de *"Dom Casmurro"* para **Lucas Almeida** e confirme que o empréstimo entra na tabela.
3. Na linha do empréstimo em atraso de **Rafael Oliveira** (*"O capital — Livro I"*), clique em **Baixa / Multa**:
   * Verifique o cálculo automático de **R$ 11,00** (`R$ 5,00 + 3 × R$ 2,00`).
   * Observe o aviso indicando que há fila de espera para o exemplar.
   * Escolha *"Quitado agora no balcão"* e clique em **Confirmar Devolução**. O exemplar será automaticamente reservado para o 1º da fila!

### Teste 4: Fluxo Administrativo e Patrimonial (Admin)
1. Alterne para **Carlos Mendes (Gestor / Admin)**.
2. Em **Catálogo**, teste **+ Cadastrar Obra** e **Categorias e Gêneros**, depois clique em **Ver ficha** em qualquer livro para inspecionar os tombos individuais.
3. Em **Usuários**, clique em **Ver ficha** de um aluno e teste alterar o **Perfil de Acesso (RBAC)**.
4. Em **Inventário**, teste cadastrar um **TCC / Artigo** e emitir uma **Baixa Patrimonial**.
5. Acesse **Relatórios** e valide os indicadores estratégicos e botões de exportação.

---

## ⚠️ 5. Checklist de Revisão do Grupo (Antes do Deploy)
- [ ] Conferir se não há erros de digitação nos textos das telas e modais.
- [ ] Validar se todas as ações interativas estão funcionando sem erros no console do navegador (`F12`).
- [ ] Testar o comando `npm run build` no terminal para garantir que a versão de produção compila sem falhas.