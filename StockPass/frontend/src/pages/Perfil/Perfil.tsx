import React, { useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import { mensagemErro } from '../../services/stockApi';

type Props = {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
};

export function Perfil({ user, onUserUpdated, onLogout }: Props) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [companyName, setCompanyName] = useState(user.companyName ?? '');
  const [taxId, setTaxId] = useState(user.taxId ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setSavingProfile(true);
    try {
      const { data } = await api.put<User>('/auth/profile', {
        name,
        email,
        companyName,
        taxId,
        phone,
      });
      setName(data.name);
      setEmail(data.email);
      setCompanyName(data.companyName ?? '');
      setTaxId(data.taxId ?? '');
      setPhone(data.phone ?? '');
      onUserUpdated(data);
      setMsg('Informações da conta atualizadas.');
    } catch (error) {
      setMsg(mensagemErro(error));
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setMsg('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMsg(err?.response?.data?.message || 'Erro ao alterar senha.');
    }
  }

  return (
    <div className="painel">
      <section className="panel-card">
        <h2>Meu perfil</h2>
        <form onSubmit={saveProfile} className="profile-form">
          <label>Nome
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {user.role === 'FORNECEDOR' && (
            <>
              <label>Empresa
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </label>
              <label>CNPJ
                <input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              </label>
              <label>Telefone
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </>
          )}
          <p><b>Perfil:</b> {user.role}</p>
          <button className="btn-primary" type="submit" disabled={savingProfile}>
            {savingProfile ? 'Salvando...' : 'Salvar informações'}
          </button>
        </form>
      </section>

      <section className="panel-card">
        <h2>Trocar senha</h2>
        <form onSubmit={changePassword} className="profile-form">
          <input
            type="password"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
          <button className="btn-primary">Alterar senha</button>
        </form>
        {msg && <p className="message">{msg}</p>}
      </section>

      <section className="panel-card">
        <button className="btn-secondary" onClick={onLogout}>Sair da conta</button>
      </section>
    </div>
  );
}