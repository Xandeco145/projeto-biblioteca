import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, RefreshCw } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

const DEMO_PROFILES = [
  { id: 'u-1', label: 'Mariana Costa (Aluno)' },
  { id: 'u-6', label: 'Ana Paula Silva (Bibliotecário)' },
  { id: 'u-7', label: 'Carlos Mendes (Gestor / Admin)' },
];

const Header = () => {
  const { currentUser, activeTab, selectedBookId, loginAsUser, logout } = useLibrary();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu ao clicar fora dele ou pressionar Esc
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const getHeaderTitle = () => {
    if (!currentUser) return '';
    if (currentUser.role === 'aluno') {
      if (activeTab === 'Dashboard') return 'Portal do Aluno — Área do Leitor';
      if (activeTab === 'Catálogo') return 'Catálogo — Acervo Acadêmico';
      if (activeTab === 'Reservas') return 'Portal do Aluno — Minhas Reservas e Fila';
      if (activeTab === 'Multas') return 'Portal do Aluno — Consulta de Multas e Débitos';
      if (activeTab === 'Notificações') return 'Portal do Aluno — Central de Notificações';
      return activeTab;
    }

    if (selectedBookId && activeTab === 'Catálogo') {
      return 'Catálogo — Detalhes da Obra e Exemplares';
    }
    if (activeTab === 'Dashboard') return 'Painel de Gestão — Biblioteca Central';
    if (activeTab === 'Catálogo') return 'Catálogo — Gestão de Acervo';
    if (activeTab === 'Empréstimos') return 'Circulação de Balcão — Empréstimos e Devoluções';
    if (activeTab === 'Reservas') return 'Reservas — Retiradas no Balcão e Fila de Espera';
    if (activeTab === 'Usuários') return 'Usuários — Cadastros e Perfis de Acesso';
    if (activeTab === 'Inventário') return 'Controle de Inventário e Patrimônio Físico';
    if (activeTab === 'Relatórios') return 'Relatórios Gerenciais e Auditoria de Estoque';
    return activeTab;
  };

  return (
    <header
      style={{
        backgroundColor: '#0B303D',
        color: '#FAF7F0',
        height: '68px',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #185266',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.2px' }}>
        {getHeaderTitle()}
      </div>

      {/* Identificação Padronizada do Usuário Logado + Seletor Rápido de Perfil */}
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(250, 247, 240, 0.16)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#FAF7F0',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span
            style={{
              backgroundColor: '#185266',
              color: '#FAF7F0',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 7px',
              borderRadius: '5px',
            }}
          >
            {currentUser?.avatarInitials}
          </span>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{currentUser?.name}</div>
            <div style={{ fontSize: '11px', color: '#D68C45', fontFamily: 'var(--font-mono)' }}>
              {currentUser?.roleLabel}
            </div>
          </div>
          <ChevronDown size={15} />
        </button>

        {menuOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '275px',
              backgroundColor: '#FFFFFF',
              color: '#1E2528',
              borderRadius: '10px',
              border: '1px solid #DDD6CA',
              boxShadow: '0 14px 30px rgba(11, 48, 61, 0.2)',
              padding: '8px',
              zIndex: 100,
            }}
          >
            <div
              className="overline-label"
              style={{ padding: '6px 10px', borderBottom: '1px solid #ECE7DF', marginBottom: '6px' }}
            >
              Alternar Perfil de Demonstração
            </div>
            {DEMO_PROFILES.map((profile) => {
              const isCurrent = currentUser?.id === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  role="menuitem"
                  className="btn-ghost"
                  disabled={isCurrent}
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    fontSize: '13px',
                    fontWeight: isCurrent ? 700 : 500,
                    opacity: isCurrent ? 0.6 : 1,
                    cursor: isCurrent ? 'default' : 'pointer',
                  }}
                  onClick={() => {
                    loginAsUser(profile.id);
                    setMenuOpen(false);
                  }}
                >
                  <RefreshCw size={14} /> {profile.label}
                  {isCurrent ? ' • atual' : ''}
                </button>
              );
            })}
            <div style={{ borderTop: '1px solid #ECE7DF', marginTop: '6px', paddingTop: '6px' }}>
              <button
                type="button"
                role="menuitem"
                className="btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  fontSize: '13px',
                  color: '#A62626',
                }}
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <LogOut size={14} /> Sair do Sistema
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
