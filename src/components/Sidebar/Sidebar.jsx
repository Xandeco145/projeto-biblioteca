import React from 'react';
import './Sidebar.css';
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Bookmark,
  Users,
  Package,
  BarChart2,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

const Sidebar = () => {
  const { currentUser, activeTab, setActiveTab, setSelectedBookId, fines, notifications } =
    useLibrary();

  const role = currentUser?.role || 'aluno';

  const unreadCount = notifications.filter(
    (n) => !n.read && (role === 'aluno' ? n.targetRole === 'aluno' : n.targetRole === 'staff')
  ).length;

  const pendingStudentFines = fines.filter(
    (f) => f.userId === currentUser?.id && f.status === 'Pendente'
  ).length;

  // Menus estritamente separados por perfil (correção do feedback da Prof.ª Caroline)
  const studentMenuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Catálogo', icon: BookOpen, label: 'Catálogo' },
    { id: 'Reservas', icon: Bookmark, label: 'Reservas' },
    {
      id: 'Multas',
      icon: AlertCircle,
      label: 'Multas e Débitos',
      badge: pendingStudentFines > 0 ? pendingStudentFines : null,
    },
    {
      id: 'Notificações',
      icon: Bell,
      label: 'Notificações',
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  const staffMenuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Catálogo', icon: BookOpen, label: 'Catálogo' },
    { id: 'Empréstimos', icon: ArrowLeftRight, label: 'Empréstimos' },
    { id: 'Reservas', icon: Bookmark, label: 'Reservas' },
    { id: 'Usuários', icon: Users, label: 'Usuários' },
    { id: 'Inventário', icon: Package, label: 'Inventário' },
    ...(role === 'admin'
      ? [{ id: 'Relatórios', icon: BarChart2, label: 'Relatórios' }]
      : []),
  ];

  const menuItems = role === 'aluno' ? studentMenuItems : staffMenuItems;

  const handleSelect = (id) => {
    setActiveTab(id);
    setSelectedBookId(null);
  };

  return (
    <aside className="sidebar-container">
      {/* Topo / Logo */}
      <div className="sidebar-header">
        <h1 className="logo-title">Ulbra</h1>
        <span className="logo-subtitle">Biblioteca Acadêmica</span>
      </div>

      {/* Navegação Principal */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(item.id)}
            >
              <Icon className="icon" size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="sidebar-footer">
        <h2 className="footer-title">Biblioteca Central</h2>
        <p className="footer-subtitle">
          {role === 'aluno' ? 'Portal do Leitor' : 'Gestão do Acervo'}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;