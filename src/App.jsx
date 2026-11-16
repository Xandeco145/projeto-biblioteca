import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLibrary } from './context/LibraryContext';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Login from './pages/Login';

// Páginas Visão do Aluno
import AlunoDashboard from './pages/aluno/AlunoDashboard';
import AlunoCatalogo from './pages/aluno/AlunoCatalogo';
import AlunoReservas from './pages/aluno/AlunoReservas';
import AlunoMultasNotificacoes from './pages/aluno/AlunoMultasNotificacoes';

// Páginas Visão do Funcionário e Gestor/Admin
import GestaoDashboard from './pages/gestao/GestaoDashboard';
import GestaoCatalogo from './pages/gestao/GestaoCatalogo';
import Emprestimos from './pages/gestao/Emprestimos';
import GestaoReservas from './pages/gestao/GestaoReservas';
import Usuarios from './pages/gestao/Usuarios';
import Inventario from './pages/gestao/Inventario';
import Relatorios from './pages/gestao/Relatorios';

function App() {
  const { currentUser, activeTab, toast } = useLibrary();

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    if (currentUser.role === 'aluno') {
      switch (activeTab) {
        case 'Dashboard':
          return <AlunoDashboard />;
        case 'Catálogo':
          return <AlunoCatalogo />;
        case 'Reservas':
          return <AlunoReservas />;
        case 'Multas':
        case 'Notificações':
          return <AlunoMultasNotificacoes initialSection={activeTab} />;
        default:
          return <AlunoDashboard />;
      }
    }

    // Visão Funcionário (bibliotecario) e Gestor/Admin (admin)
    switch (activeTab) {
      case 'Dashboard':
        return <GestaoDashboard />;
      case 'Catálogo':
        return <GestaoCatalogo />;
      case 'Empréstimos':
        return <Emprestimos />;
      case 'Reservas':
        return <GestaoReservas />;
      case 'Usuários':
        return <Usuarios />;
      case 'Inventário':
        return <Inventario />;
      case 'Relatórios':
        return currentUser.role === 'admin' ? <Relatorios /> : <GestaoDashboard />;
      default:
        return <GestaoDashboard />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="page-content">{renderContent()}</main>
      </div>

      {toast && (
        <div className="toast-banner" role="status">
          <CheckCircle2 size={20} color="#D68C45" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default App;