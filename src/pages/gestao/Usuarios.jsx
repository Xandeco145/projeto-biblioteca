import React, { useState } from 'react';
import {
  Users as UsersIcon,
  UserCheck,
  UserPlus,
  AlertCircle,
  AlertTriangle,
  Search,
  Shield,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BUSINESS_RULES } from '../../data/mockData';
import { diffInDays, formatCurrency, formatPercent } from '../../utils/format';

const emptyUserForm = () => ({
  name: '',
  matricula: '',
  email: '',
  role: 'aluno',
  readerType: 'Estudante',
  department: '',
});

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px' };

const Usuarios = () => {
  const {
    currentUser,
    users,
    loans,
    fines,
    today,
    addUser,
    updateUserRole,
    payFine,
    setActiveTab,
  } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState(emptyUserForm);
  const [formError, setFormError] = useState('');
  const [roleError, setRoleError] = useState('');

  const isAdmin = currentUser.role === 'admin';
  const activeCount = users.filter((u) => u.status === 'Ativo').length;
  const suspendedCount = users.filter((u) => u.status === 'Suspenso').length;
  const newLast30Days = users.filter(
    (u) => u.registeredAt && diffInDays(u.registeredAt, today) <= 30
  ).length;
  const activePct = users.length ? (activeCount / users.length) * 100 : 0;

  // Ficha sempre com os dados atualizados (situação muda ao quitar multa, devolver etc.)
  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.matricula.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'Todos' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openUser = (userId) => {
    setRoleError('');
    setSelectedUserId(userId);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const res = addUser(newUserForm);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setFormError('');
    setShowNewUserModal(false);
    setNewUserForm(emptyUserForm());
  };

  const handleRoleChange = (newRole) => {
    const res = updateUserRole(selectedUser.id, newRole);
    setRoleError(res.ok ? '' : res.error);
  };

  const userLoans = selectedUser ? loans.filter((l) => l.userId === selectedUser.id) : [];
  const userPendingFines = selectedUser
    ? fines.filter((f) => f.userId === selectedUser.id && f.status === 'Pendente')
    : [];

  return (
    <div>
      {/* 4 KPIs Superiores (Frame 4.5 / Usuários1.png) */}
      <div className="kpi-grid-4">
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Usuários cadastrados
            </span>
            <UsersIcon size={18} color="#185266" />
          </div>
          <div className="kpi-value">{users.length}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            {users.filter((u) => u.role === 'aluno').length} leitores •{' '}
            {users.filter((u) => u.role !== 'aluno').length} da equipe
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Usuários ativos
            </span>
            <UserCheck size={18} color="#185266" />
          </div>
          <div className="kpi-value">{activeCount}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            {formatPercent(activePct)} dos cadastros
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Novos cadastros
            </span>
            <UserPlus size={18} color="#185266" />
          </div>
          <div className="kpi-value">{newLast30Days}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            Nos últimos 30 dias
          </div>
        </div>

        <div className="kpi-card highlight-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Com pendências
            </span>
            <AlertCircle size={18} color="#D68C45" />
          </div>
          <div className="kpi-value">{String(suspendedCount).padStart(2, '0')}</div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-warning-text)' }}>
            Devoluções em atraso / multas pendentes
          </div>
        </div>
      </div>

      {/* Painel Lista de Usuários */}
      <div className="panel-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h1 className="serif-title" style={{ fontSize: '30px' }}>
            Lista de Usuários
          </h1>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setFormError('');
              setNewUserForm(emptyUserForm());
              setShowNewUserModal(true);
            }}
          >
            <UserPlus size={16} /> Novo Usuário
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 200px',
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
              placeholder="Buscar por nome, e-mail institucional ou matrícula..."
              aria-label="Buscar usuários"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="select-field"
            aria-label="Filtrar por status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Suspenso">Suspenso</option>
          </select>
        </div>

        <div
          className="table-wrapper"
          style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome / E-mail Institucional</th>
                <th>Matrícula</th>
                <th>Tipo de Usuário / Perfil</th>
                <th>Status / Circulação</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr className="empty-row">
                  <td colSpan="5">Nenhum usuário encontrado para os filtros informados.</td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)' }}>
                      {user.name}
                    </div>
                    <div className="mono-code" style={{ color: 'var(--color-text-secondary)' }}>
                      {user.email}
                    </div>
                  </td>

                  <td className="mono-code" style={{ fontWeight: 700 }}>
                    {user.matricula}
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{user.roleLabel}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                      {user.department}
                    </div>
                  </td>

                  <td>
                    {user.status === 'Suspenso' ? (
                      <>
                        <span className="badge badge-danger">• Suspenso</span>
                        <div style={{ fontSize: '12px', color: 'var(--color-danger-text)', marginTop: '4px', fontWeight: 600 }}>
                          {user.blockReason}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="badge badge-success">• Ativo</span>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {user.role !== 'aluno'
                            ? 'Equipe da biblioteca'
                            : user.activeLoansCount === 0
                            ? 'Sem empréstimos'
                            : `${user.activeLoansCount} de ${BUSINESS_RULES.MAX_ACTIVE_LOANS} empréstimo(s)`}
                        </div>
                      </>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontWeight: 700 }}
                      onClick={() => openUser(user.id)}
                    >
                      Ver ficha &rsaquo;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ficha do Usuário + Gerenciar Perfis de Acesso (RBAC / Promoção Admin) */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUserId(null)}>
          <div className="modal-box teal-top" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Ficha Cadastral e Perfil de Acesso
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {selectedUser.fullName} • Matrícula <span className="mono-code">{selectedUser.matricula}</span>
            </p>

            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '18px',
                fontSize: '13.5px',
                lineHeight: 1.7,
              }}
            >
              <div>
                • E-mail Institucional: <strong>{selectedUser.email}</strong>
              </div>
              <div>
                • Vínculo / Curso: <strong>{selectedUser.department}</strong>
              </div>
              <div>
                • Situação Cadastral:{' '}
                <strong style={{ color: selectedUser.status === 'Suspenso' ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                  {selectedUser.status}
                  {selectedUser.blockReason ? ` — ${selectedUser.blockReason} (RF05)` : ''}
                </strong>
              </div>
              {selectedUser.role === 'aluno' && (
                <div>
                  • Empréstimos ativos:{' '}
                  <strong>
                    {selectedUser.activeLoansCount} de {BUSINESS_RULES.MAX_ACTIVE_LOANS}
                  </strong>
                  {userLoans.length > 0 && (
                    <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                      {userLoans.map((l) => (
                        <li key={l.id}>
                          {l.bookTitle} (<span className="mono-code">{l.tombo}</span>) — dev. {l.dueDate}
                          {l.daysOverdue > 0 && (
                            <strong style={{ color: 'var(--color-danger-text)' }}> • {l.daysOverdue} dia(s) de atraso</strong>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Controle de Perfis RBAC exclusivo para Gestor/Admin */}
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-deep-teal)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} /> Gerenciar Perfil de Acesso (RBAC)
              </div>
              {isAdmin ? (
                selectedUser.id === currentUser.id ? (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Por segurança, o administrador não pode alterar o próprio perfil de acesso.
                  </div>
                ) : (
                  <>
                    <select
                      className="select-field"
                      aria-label="Perfil de acesso"
                      style={{ width: '100%' }}
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      <option value="aluno">Leitor / Aluno (Consulta e Reserva)</option>
                      <option value="bibliotecario">Funcionário / Bibliotecário (Circulação e Acervo)</option>
                      <option value="admin">Gestor / Administrador (Acesso Total e Relatórios)</option>
                    </select>
                    {roleError && (
                      <div role="alert" className="form-error" style={{ marginTop: '10px' }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>{roleError}</span>
                      </div>
                    )}
                  </>
                )
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Apenas o perfil <strong>Gestor / Administrador</strong> pode alterar níveis de permissão ou promover usuários.
                </div>
              )}
            </div>

            {/* Pendências financeiras: multas lançadas (quitação no balcão) e atrasos em aberto */}
            {userPendingFines.map((fine) =>
              fine.accruing ? (
                <div
                  key={fine.id}
                  style={{
                    backgroundColor: 'var(--color-danger-bg)',
                    border: '1px solid #E5B4B4',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-danger-text)' }}>
                      Devolução em atraso — multa acumulada: {formatCurrency(fine.amount)}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                      {fine.bookTitle} ({fine.daysOverdue} dia(s) de atraso). A multa é calculada e quitada no registro da devolução.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-teal"
                    onClick={() => {
                      setSelectedUserId(null);
                      setActiveTab('Empréstimos', { type: 'search', query: fine.tombo });
                    }}
                  >
                    Registrar Devolução
                  </button>
                </div>
              ) : (
                <div
                  key={fine.id}
                  style={{
                    backgroundColor: 'var(--color-danger-bg)',
                    border: '1px solid #E5B4B4',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-danger-text)' }}>
                      Multa Pendente {fine.id}: {formatCurrency(fine.amount)}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                      {fine.bookTitle} ({fine.daysOverdue} dia(s) de atraso) • lançada em {fine.date}
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={() => payFine(fine.id)}>
                    Quitar Multa Agora
                  </button>
                </div>
              )
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setSelectedUserId(null)}>
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Usuário (Controlado pelo Funcionário/Admin — corrige item 6 da AP1) */}
      {showNewUserModal && (
        <div className="modal-backdrop" onClick={() => setShowNewUserModal(false)}>
          <div className="modal-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Cadastrar Novo Usuário Institucional
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              A definição de perfil de acesso é realizada exclusivamente pela equipe da biblioteca.
            </p>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="user-name" style={labelStyle}>
                  Nome Completo *
                </label>
                <input
                  id="user-name"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="Ex.: João Pedro Martins"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="user-matricula" style={labelStyle}>
                    Matrícula / Código Funcional *
                  </label>
                  <input
                    id="user-matricula"
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="20260412"
                    value={newUserForm.matricula}
                    onChange={(e) => setNewUserForm({ ...newUserForm, matricula: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="user-role" style={labelStyle}>
                    Perfil de Acesso *
                  </label>
                  <select
                    id="user-role"
                    className="select-field"
                    style={{ width: '100%' }}
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  >
                    <option value="aluno">Leitor / Aluno</option>
                    {isAdmin && (
                      <>
                        <option value="bibliotecario">Funcionário / Bibliotecário</option>
                        <option value="admin">Gestor / Administrador</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: newUserForm.role === 'aluno' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                {newUserForm.role === 'aluno' && (
                  <div>
                    <label htmlFor="user-type" style={labelStyle}>
                      Tipo de Vínculo *
                    </label>
                    <select
                      id="user-type"
                      className="select-field"
                      style={{ width: '100%' }}
                      value={newUserForm.readerType}
                      onChange={(e) => setNewUserForm({ ...newUserForm, readerType: e.target.value })}
                    >
                      <option value="Estudante">Estudante</option>
                      <option value="Docente">Docente</option>
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="user-department" style={labelStyle}>
                    Curso / Setor
                  </label>
                  <input
                    id="user-department"
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="Ex.: Sistemas de Informação • Graduação"
                    value={newUserForm.department}
                    onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-email" style={labelStyle}>
                  E-mail Institucional *
                </label>
                <input
                  id="user-email"
                  required
                  type="email"
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder={
                    newUserForm.role === 'aluno' && newUserForm.readerType === 'Estudante'
                      ? 'joao.martins@rede.ulbra.br'
                      : 'joao.martins@ulbra.br'
                  }
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                />
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Estudantes: @rede.ulbra.br • Docentes e funcionários: @ulbra.br
                </div>
              </div>

              {formError && (
                <div role="alert" className="form-error">
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowNewUserModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Concluir Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
