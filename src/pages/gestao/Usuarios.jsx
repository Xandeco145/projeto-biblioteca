import React, { useState } from 'react';
import { Users as UsersIcon, UserCheck, UserPlus, AlertCircle, Search, Shield } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

const Usuarios = () => {
  const { currentUser, users, loans, fines, addUser, updateUserRole, payFine } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    matricula: '',
    email: '',
    role: 'aluno',
    department: 'Sistemas de Informação • Graduação',
  });

  const activeCount = users.filter((u) => u.status === 'Ativo').length;
  const suspendedCount = users.filter((u) => u.status === 'Suspenso').length;

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

  const handleCreateUser = (e) => {
    e.preventDefault();
    addUser(newUserForm);
    setShowNewUserModal(false);
    setNewUserForm({
      name: '',
      matricula: '',
      email: '',
      role: 'aluno',
      department: 'Sistemas de Informação • Graduação',
    });
  };

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
          <div className="kpi-value">{869 + users.length}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            Comunidade acadêmica
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Usuários ativos
            </span>
            <UserCheck size={18} color="#185266" />
          </div>
          <div className="kpi-value">{836 + activeCount}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            96,1% dos cadastros
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Novos neste mês
            </span>
            <UserPlus size={18} color="#185266" />
          </div>
          <div className="kpi-value">18</div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
            Cadastros em outubro
          </div>
        </div>

        <div className="kpi-card highlight-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-deep-teal)' }}>
              Com pendências
            </span>
            <AlertCircle size={18} color="#D68C45" />
          </div>
          <div className="kpi-value">0{suspendedCount}</div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-warning-text)' }}>
            Devoluções / multas em atraso
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

          <button className="btn btn-primary" onClick={() => setShowNewUserModal(true)}>
            <UserPlus size={16} /> + Novo Usuário
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="select-field"
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
              {filteredUsers.map((user) => {
                const userLoansCount = loans.filter((l) => l.userId === user.id).length;
                return (
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
                            Pendência financeira / atraso
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="badge badge-success">• Ativo</span>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            {userLoansCount === 0
                              ? 'Sem empréstimos'
                              : `${userLoansCount} empréstimo(s)`}
                          </div>
                        </>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontWeight: 700 }}
                        onClick={() => setSelectedUserModal(user)}
                      >
                        Ver ficha &rsaquo;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ficha do Usuário + Gerenciar Perfis de Acesso (RBAC / Promoção Admin) */}
      {selectedUserModal && (
        <div className="modal-backdrop" onClick={() => setSelectedUserModal(null)}>
          <div className="modal-box teal-top" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Ficha Cadastral e Perfil de Acesso
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {selectedUserModal.fullName} • Matrícula <span className="mono-code">{selectedUserModal.matricula}</span>
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
                • E-mail Institucional: <strong>{selectedUserModal.email}</strong>
              </div>
              <div>
                • Vínculo / Curso: <strong>{selectedUserModal.department}</strong>
              </div>
              <div>
                • Situação Cadastral: <strong>{selectedUserModal.status}</strong>
              </div>
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
              {currentUser.role === 'admin' ? (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    className="select-field"
                    style={{ flex: 1 }}
                    value={selectedUserModal.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      updateUserRole(selectedUserModal.id, newRole);
                      setSelectedUserModal({ ...selectedUserModal, role: newRole });
                    }}
                  >
                    <option value="aluno">Leitor / Aluno (Consulta e Reserva)</option>
                    <option value="bibliotecario">Funcionário / Bibliotecário (Circulação e Acervo)</option>
                    <option value="admin">Gestor / Administrador (Acesso Total e Relatórios)</option>
                  </select>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Apenas o perfil <strong>Gestor / Administrador</strong> pode alterar níveis de permissão ou promover usuários.
                </div>
              )}
            </div>

            {/* Quitação de Multas Pendentes no Balcão */}
            {fines
              .filter((f) => f.userId === selectedUserModal.id && f.status === 'Pendente')
              .map((fine) => (
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
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-danger-text)' }}>
                      Multa Pendente: R$ {fine.amount.toFixed(2).replace('.', ',')}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                      {fine.bookTitle} ({fine.daysOverdue} dias de atraso)
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      payFine(fine.id);
                      setSelectedUserModal({ ...selectedUserModal, status: 'Ativo' });
                    }}
                  >
                    Quitar Multa Agora
                  </button>
                </div>
              ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setSelectedUserModal(null)}>
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Usuário (Controlado pelo Funcionário/Admin — corrige item 6 da AP1) */}
      {showNewUserModal && (
        <div className="modal-backdrop" onClick={() => setShowNewUserModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="serif-title" style={{ fontSize: '26px', marginBottom: '4px' }}>
              Cadastrar Novo Usuário Institucional
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              A definição de perfil de acesso é realizada exclusivamente pela equipe da biblioteca.
            </p>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px' }}>
                  Nome Completo *
                </label>
                <input
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px' }}>
                    Matrícula / Código Funcional *
                  </label>
                  <input
                    required
                    className="input-field"
                    style={{ width: '100%' }}
                    placeholder="20260412"
                    value={newUserForm.matricula}
                    onChange={(e) => setNewUserForm({ ...newUserForm, matricula: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px' }}>
                    Perfil de Acesso *
                  </label>
                  <select
                    className="select-field"
                    style={{ width: '100%' }}
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  >
                    <option value="aluno">Leitor / Aluno</option>
                    {currentUser.role === 'admin' && (
                      <>
                        <option value="bibliotecario">Funcionário / Bibliotecário</option>
                        <option value="admin">Gestor / Administrador</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px' }}>
                  E-mail Institucional (@rede.ulbra.br ou @ulbra.br) *
                </label>
                <input
                  required
                  type="email"
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="joao.martins@rede.ulbra.br"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                />
              </div>

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