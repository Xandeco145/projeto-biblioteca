import React, { useState } from 'react';
import { ShieldCheck, UserCheck, GraduationCap, Briefcase } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

const Login = () => {
  const { loginWithEmail, loginAsUser } = useLibrary();
  const [email, setEmail] = useState('mariana.costa@rede.ulbra.br');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = loginWithEmail(email);
    if (!res.ok) {
      setError(res.error);
    } else {
      setError('');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF7F0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Barra superior institucional */}
      <div style={{ height: '14px', backgroundColor: '#0B303D', width: '100%' }} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '470px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #DDD6CA',
            borderTop: '4px solid #D68C45',
            borderRadius: '10px',
            padding: '38px 36px 32px',
            boxShadow: '0 10px 30px rgba(11, 48, 61, 0.08)',
          }}
        >
          {/* Emblema Institucional Ulbra */}
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0B303D',
                color: '#E5B87B',
                padding: '12px 32px',
                borderRadius: '4px',
                fontFamily: 'var(--font-serif)',
                fontSize: '36px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                lineHeight: 1,
              }}
            >
              ulbra
            </div>
            <div
              style={{
                color: '#D68C45',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1.6px',
                marginTop: '8px',
                textTransform: 'uppercase',
              }}
            >
              BIBLIOTECA ACADÊMICA
            </div>
          </div>

          <h1
            className="serif-title"
            style={{ fontSize: '28px', marginBottom: '6px' }}
          >
            Acesse sua conta
          </h1>
          <p style={{ color: '#465256', fontSize: '14px', margin: '0 0 22px' }}>
            Digite seu e-mail institucional para prosseguir.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                htmlFor="institutional-email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0B303D',
                  marginBottom: '6px',
                }}
              >
                E-mail Institucional
              </label>
              <input
                id="institutional-email"
                type="email"
                required
                className="input-field"
                style={{ width: '100%', borderColor: '#0B303D' }}
                placeholder="nome@rede.ulbra.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger-text)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="button"
              className="btn btn-outline"
              style={{ width: '100%', padding: '11px' }}
              onClick={() => loginWithEmail(email || 'mariana.costa@rede.ulbra.br')}
            >
              <ShieldCheck size={18} color="#185266" />
              Entrar com Google Institucional
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              Avançar
            </button>
          </form>

          {/* Instruções de credenciais */}
          <div
            style={{
              marginTop: '18px',
              backgroundColor: '#F4F0E8',
              borderRadius: '6px',
              padding: '12px 14px',
              fontSize: '12.5px',
              color: '#465256',
              lineHeight: 1.6,
            }}
          >
            <div>• Alunos: utilize sua credencial <strong>@rede.ulbra.br</strong></div>
            <div>• Professores e Técnicos: acesse via <strong>@ulbra.br</strong></div>
          </div>

          {/* Acesso Rápido por Perfil (Para validação e demonstração) */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #ECE7DF' }}>
            <div className="overline-label" style={{ marginBottom: '10px', textAlign: 'center' }}>
              Acesso Rápido por Perfil (Validação)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '8px 6px', fontSize: '12px' }}
                onClick={() => loginAsUser('u-1')}
              >
                <GraduationCap size={14} /> Aluno
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '8px 6px', fontSize: '12px' }}
                onClick={() => loginAsUser('u-6')}
              >
                <UserCheck size={14} /> Bibliotecário
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '8px 6px', fontSize: '12px' }}
                onClick={() => loginAsUser('u-7')}
              >
                <Briefcase size={14} /> Admin
              </button>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '12px',
              color: '#525E62',
            }}
          >
            Sistema Integrado de Bibliotecas — CEULP/ULBRA
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;